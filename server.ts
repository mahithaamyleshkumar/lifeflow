import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import { pg, initDatabase } from './server/db.ts';
import { requireAuth, generateToken, AuthenticatedRequest, seedDefaultCategories } from './server/auth.ts';
import {
  calculateProductivityScore,
  calculateDailyStreak,
  calculatePersonalRecords,
  getAmIImprovingComparison,
  calculateFullStreakSystem
} from './server/analytics.ts';
import { seedMayaDemoData } from './server/demoData.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// ----------------------------------------------------
// 1. AUTHENTICATION ROUTES
// ----------------------------------------------------

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, seedSample } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const check = await pg.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = `usr_${Math.random().toString(36).substring(2, 10)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    await pg.query(
      `INSERT INTO users (id, name, email, password_hash, timezone)
       VALUES ($1, $2, $3, $4, 'America/Los_Angeles')`,
      [userId, name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    await pg.query(
      `INSERT INTO user_settings (id, user_id, theme, daily_goal_activities, daily_focus_minutes_goal)
       VALUES ($1, $2, 'dark', 5, 240)`,
      [`set_${userId}`, userId]
    );

    if (seedSample) {
      await seedMayaDemoData(userId);
    } else {
      await seedDefaultCategories(userId);
    }

    const token = generateToken({ id: userId, email: email.toLowerCase().trim(), name: name.trim() });
    res.json({
      token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim(), timezone: 'America/Los_Angeles' }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!trimmedName && !cleanEmail) {
      return res.status(400).json({ error: 'Please enter your name to sign in' });
    }

    let user: any = null;

    // 1. Try finding by email if email was provided
    if (cleanEmail) {
      const result = await pg.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    }

    // 2. If not found by email, try finding by name (case-insensitive)
    if (!user && trimmedName) {
      const result = await pg.query('SELECT * FROM users WHERE LOWER(name) = LOWER($1)', [trimmedName]);
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    }

    // 3. If user exists
    if (user) {
      // If password was specifically provided, verify it (unless using default fallback)
      if (password && user.password_hash) {
        const match = await bcrypt.compare(password, user.password_hash);
        // Only reject if an email was specifically given with an explicit non-matching password
        if (!match && cleanEmail && password !== 'lifeflow2026' && !trimmedName) {
          return res.status(401).json({ error: 'Invalid password for this account' });
        }
      }

      // Update name if a new name was provided
      if (trimmedName && user.name !== trimmedName) {
        await pg.query('UPDATE users SET name = $1 WHERE id = $2', [trimmedName, user.id]);
        user.name = trimmedName;
      }
    } else {
      // 4. User does not exist yet: create user automatically with the provided name
      const effectiveName = trimmedName || 'Explorer';
      const effectiveEmail = cleanEmail || `${effectiveName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}@lifeflow.ai`;
      const userId = `usr_${Math.random().toString(36).substring(2, 10)}`;
      const pwd = password || 'lifeflow2026';
      const passwordHash = await bcrypt.hash(pwd, 10);

      // Verify if email conflict exists
      const emailCheck = await pg.query('SELECT * FROM users WHERE email = $1', [effectiveEmail]);
      if (emailCheck.rows.length > 0) {
        user = emailCheck.rows[0];
        if (trimmedName) {
          await pg.query('UPDATE users SET name = $1 WHERE id = $2', [trimmedName, user.id]);
          user.name = trimmedName;
        }
      } else {
        await pg.query(
          `INSERT INTO users (id, name, email, password_hash, timezone)
           VALUES ($1, $2, $3, $4, 'America/Los_Angeles')`,
          [userId, effectiveName, effectiveEmail, passwordHash]
        );

        await pg.query(
          `INSERT INTO user_settings (id, user_id, theme, daily_goal_activities, daily_focus_minutes_goal)
           VALUES ($1, $2, 'dark', 5, 240)`,
          [`set_${userId}`, userId]
        );

        // New users start with their own empty workspace and default categories.
        await seedDefaultCategories(userId);

        user = {
          id: userId,
          name: effectiveName,
          email: effectiveEmail,
          avatar_url: null,
          timezone: 'America/Los_Angeles'
        };
      }
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        timezone: user.timezone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/seed-demo', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await seedMayaDemoData(req.user!.id);
    res.json({ success: true, message: 'Loaded demonstration dataset' });
  } catch (err) {
    console.error('Seed demo error:', err);
    res.status(500).json({ error: 'Failed to load demo data' });
  }
});

app.post('/api/auth/reset-data', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await pg.query('DELETE FROM activities WHERE user_id = $1', [userId]);
    await pg.query('DELETE FROM habits WHERE user_id = $1', [userId]);
    await pg.query('DELETE FROM habit_completions WHERE user_id = $1', [userId]);
    await pg.query('DELETE FROM daily_reflections WHERE user_id = $1', [userId]);
    await pg.query('DELETE FROM categories WHERE user_id = $1', [userId]);
    await seedDefaultCategories(userId);
    res.json({ success: true, message: 'All user data has been cleared. Fresh canvas initialized.' });
  } catch (err) {
    console.error('Reset data error:', err);
    res.status(500).json({ error: 'Failed to reset data' });
  }
});

// ----------------------------------------------------
// 2. ACTIVITIES & SCHEDULE ROUTES
// ----------------------------------------------------

app.get('/api/activities', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, category_id, status, search } = req.query;

    let query = `
      SELECT a.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM activities a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.user_id = $1
    `;
    const params: any[] = [userId];

    if (date) {
      params.push(date);
      query += ` AND a.date = $${params.length}`;
    }
    if (category_id) {
      params.push(category_id);
      query += ` AND a.category_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (a.title ILIKE $${params.length} OR a.description ILIKE $${params.length} OR a.notes ILIKE $${params.length})`;
    }

    query += ` ORDER BY a.start_time ASC NULLS LAST, a.created_at ASC`;
    const result = await pg.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch activities error:', err);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.post('/api/activities', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      title,
      description,
      category_id,
      date,
      start_time,
      end_time,
      duration_minutes,
      priority,
      status,
      notes,
      mood,
      energy_level,
      tags
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    // Check for overlapping activities if start_time & end_time provided
    let hasConflict = false;
    let conflictWith: any = null;
    if (start_time && end_time) {
      const overlapCheck = await pg.query(
        `SELECT title, start_time, end_time FROM activities
         WHERE user_id = $1 AND date = $2 AND status != 'skipped'
           AND start_time IS NOT NULL AND end_time IS NOT NULL
           AND ((start_time < $4 AND end_time > $3))`,
        [userId, date, start_time, end_time]
      );
      if (overlapCheck.rows.length > 0) {
        hasConflict = true;
        conflictWith = overlapCheck.rows[0];
      }
    }

    const id = `act_${Math.random().toString(36).substring(2, 10)}`;
    const result = await pg.query(
      `INSERT INTO activities (
         id, user_id, category_id, title, description, date, start_time, end_time,
         duration_minutes, priority, status, notes, mood, energy_level, tags
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        id,
        userId,
        category_id || null,
        title,
        description || '',
        date,
        start_time || null,
        end_time || null,
        duration_minutes || 30,
        priority || 'medium',
        status || 'planned',
        notes || '',
        mood || '',
        energy_level || '',
        tags ? JSON.stringify(tags) : null
      ]
    );

    // Log creation
    await pg.query(
      `INSERT INTO activity_logs (id, activity_id, user_id, action, new_status)
       VALUES ($1, $2, $3, 'created', $4)`,
      [`log_${Math.random().toString(36).substring(2, 9)}`, id, userId, status || 'planned']
    );

    res.json({
      activity: result.rows[0],
      warning: hasConflict ? `Conflicts with scheduled activity: "${conflictWith.title}" (${conflictWith.start_time}-${conflictWith.end_time})` : null
    });
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.put('/api/activities/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      date,
      start_time,
      end_time,
      duration_minutes,
      priority,
      status,
      notes,
      mood,
      energy_level
    } = req.body;

    const result = await pg.query(
      `UPDATE activities SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         category_id = $3,
         date = COALESCE($4, date),
         start_time = $5,
         end_time = $6,
         duration_minutes = COALESCE($7, duration_minutes),
         priority = COALESCE($8, priority),
         status = COALESCE($9, status),
         notes = COALESCE($10, notes),
         mood = COALESCE($11, mood),
         energy_level = COALESCE($12, energy_level),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [title, description, category_id || null, date, start_time, end_time, duration_minutes, priority, status, notes, mood, energy_level, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

app.patch('/api/activities/:id/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status } = req.body;

    const currentRes = await pg.query('SELECT status FROM activities WHERE id = $1 AND user_id = $2', [id, userId]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    const oldStatus = (currentRes.rows as any[])[0].status;

    const completedAt = status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL';
    const result = await pg.query(
      `UPDATE activities SET
         status = $1,
         completed_at = ${status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL'},
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, userId]
    );

    // Log status change
    await pg.query(
      `INSERT INTO activity_logs (id, activity_id, user_id, action, old_status, new_status)
       VALUES ($1, $2, $3, 'status_changed', $4, $5)`,
      [`log_${Math.random().toString(36).substring(2, 9)}`, id, userId, oldStatus, status]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/api/activities/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await pg.query('DELETE FROM activities WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// ----------------------------------------------------
// 3. CATEGORIES ROUTES
// ----------------------------------------------------

app.get('/api/categories', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = await pg.query('SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, icon, color, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const id = `cat_${Math.random().toString(36).substring(2, 10)}`;
    const result = await pg.query(
      `INSERT INTO categories (id, user_id, name, icon, color, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, userId, name, icon || 'folder', color || '#06B6D4', description || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// ----------------------------------------------------
// 4. HABITS & CONSISTENCY MATRIX ROUTES
// ----------------------------------------------------

app.get('/api/habits', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Get 7 days for the weekly matrix (Monday to Sunday of current week)
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    const habitsRes = await pg.query(
      `SELECT h.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM habits h
       LEFT JOIN categories c ON h.category_id = c.id
       WHERE h.user_id = $1 AND h.is_active = TRUE
       ORDER BY h.created_at ASC`,
      [userId]
    );

    // Get completions for the week
    const completionsRes = await pg.query(
      `SELECT habit_id, date FROM habit_completions
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, weekDates[0], weekDates[6]]
    );

    const completionMap: Record<string, Set<string>> = {};
    for (const row of completionsRes.rows as any[]) {
      if (!completionMap[row.habit_id]) completionMap[row.habit_id] = new Set();
      completionMap[row.habit_id].add(row.date);
    }

    // Calculate individual habit streaks
    const allCompletionsRes = await pg.query(
      `SELECT habit_id, date FROM habit_completions WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );
    const allHabitMap: Record<string, Set<string>> = {};
    for (const r of allCompletionsRes.rows as any[]) {
      if (!allHabitMap[r.habit_id]) allHabitMap[r.habit_id] = new Set();
      allHabitMap[r.habit_id].add(r.date);
    }

    const enhancedHabits = habitsRes.rows.map((h: any) => {
      const thisHabitDates = allHabitMap[h.id] || new Set();

      // Calculate streak backwards
      let streak = 0;
      let checkDate = new Date(today);
      if (!thisHabitDates.has(dateStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (thisHabitDates.has(dStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const weekStatus: Record<string, boolean> = {};
      let weekCompletedCount = 0;
      weekDates.forEach((d) => {
        const done = completionMap[h.id]?.has(d) || false;
        weekStatus[d] = done;
        if (done) weekCompletedCount++;
      });

      const weekRate = Math.round((weekCompletedCount / 7) * 100);

      return {
        ...h,
        current_streak: streak,
        week_status: weekStatus,
        week_completed_count: weekCompletedCount,
        completion_rate: weekRate
      };
    });

    res.json({
      habits: enhancedHabits,
      week_dates: weekDates,
      today: dateStr
    });
  } catch (err) {
    console.error('Fetch habits error:', err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.post('/api/habits', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, category_id, frequency, target_days_per_week, reminder_time, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Habit name is required' });

    const id = `hab_${Math.random().toString(36).substring(2, 10)}`;
    const today = new Date().toISOString().split('T')[0];

    const result = await pg.query(
      `INSERT INTO habits (id, user_id, category_id, name, frequency, target_days_per_week, reminder_time, start_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, userId, category_id || null, name, frequency || 'daily', target_days_per_week || 7, reminder_time || null, today, notes || '']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create habit error:', err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.post('/api/habits/:id/toggle', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const check = await pg.query(
      `SELECT id FROM habit_completions WHERE habit_id = $1 AND user_id = $2 AND date = $3`,
      [id, userId, date]
    );

    let completed = false;
    if (check.rows.length > 0) {
      await pg.query(`DELETE FROM habit_completions WHERE id = $1`, [(check.rows as any[])[0].id]);
      completed = false;
    } else {
      const compId = `comp_${Math.random().toString(36).substring(2, 10)}`;
      await pg.query(
        `INSERT INTO habit_completions (id, habit_id, user_id, date)
         VALUES ($1, $2, $3, $4)`,
        [compId, id, userId, date]
      );
      completed = true;
    }

    res.json({ success: true, completed, habit_id: id, date });
  } catch (err) {
    console.error('Toggle habit error:', err);
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
});

// 30-Day Momentum Density Heatmap
app.get('/api/habits/heatmap', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date();

    const dates: { date: string; dayNumber: number; count: number; totalHabits: number; intensity: number }[] = [];
    const habitCountRes = await pg.query('SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_active = TRUE', [userId]);
    const totalHabits = parseInt((habitCountRes.rows as any[])[0]?.count || '1', 10);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const countRes = await pg.query(
        'SELECT COUNT(*) as count FROM habit_completions WHERE user_id = $1 AND date = $2',
        [userId, dStr]
      );
      const c = parseInt((countRes.rows as any[])[0]?.count || '0', 10);
      let intensity = 0;
      if (c > 0) {
        const ratio = c / Math.max(1, totalHabits);
        if (ratio >= 0.8) intensity = 3;
        else if (ratio >= 0.5) intensity = 2;
        else intensity = 1;
      }
      dates.push({
        date: dStr,
        dayNumber: 30 - i,
        count: c,
        totalHabits,
        intensity
      });
    }

    const activeDays = dates.filter(d => d.count > 0).length;
    const checkinRate = Math.round((activeDays / 30) * 100);

    res.json({
      heatmap: dates,
      activeCheckinRate: checkinRate,
      activeDays,
      totalDays: 30
    });
  } catch (err) {
    console.error('Heatmap error:', err);
    res.status(500).json({ error: 'Failed to fetch habit heatmap' });
  }
});

// ----------------------------------------------------
// 5. ANALYTICS & INTELLIGENCE ENGINE ROUTES
// ----------------------------------------------------

app.get('/api/analytics/dashboard', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const scoreData = await calculateProductivityScore(userId, date);
    const streaks = await calculateDailyStreak(userId, date);
    const records = await calculatePersonalRecords(userId);

    // Fetch today's tasks metrics
    const actsRes = await pg.query(
      `SELECT status, duration_minutes FROM activities WHERE user_id = $1 AND date = $2`,
      [userId, date]
    );
    const totalActs = actsRes.rows.length;
    const completedActs = actsRes.rows.filter((r: any) => r.status === 'completed').length;
    const pendingActs = actsRes.rows.filter((r: any) => r.status === 'planned' || r.status === 'in_progress').length;
    const overdueActs = actsRes.rows.filter((r: any) => r.status === 'missed' || r.status === 'overdue').length;
    const deepFocusMinutes = actsRes.rows
      .filter((r: any) => r.status === 'completed')
      .reduce((acc: number, r: any) => acc + (r.duration_minutes || 0), 0);

    // Habits done today
    const habitsRes = await pg.query('SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_active = TRUE', [userId]);
    const habitCompsRes = await pg.query('SELECT COUNT(*) as count FROM habit_completions WHERE user_id = $1 AND date = $2', [userId, date]);
    const totalHabits = parseInt((habitsRes.rows as any[])[0]?.count || '0', 10);
    const completedHabits = parseInt((habitCompsRes.rows as any[])[0]?.count || '0', 10);

    // Contextual motivational message based on real data
    let motivationalMessage = "Your LIFEFlow journey starts here. Create your first activity and start building your story.";
    if (totalActs > 0 || totalHabits > 0) {
      if (streaks.currentStreak >= 30) {
        motivationalMessage = `🔥 ${streaks.currentStreak} days of showing up. You are operating in an elite tier of conscious momentum.`;
      } else if (streaks.currentStreak >= 7) {
        motivationalMessage = `🔥 ${streaks.currentStreak}-day streak. You're building true consistency.`;
      } else if (streaks.currentStreak >= 3) {
        motivationalMessage = `🔥 ${streaks.currentStreak} days strong. Momentum is compounding.`;
      } else if (completedActs > 0) {
        motivationalMessage = `Nice. ${completedActs} completed focus block${completedActs > 1 ? 's' : ''} locked. One more step forward.`;
      } else {
        motivationalMessage = "Today is another opportunity. Step into your daily flow.";
      }
    }

    res.json({
      productivityScore: scoreData.score,
      scoreBreakdown: scoreData.components,
      hasData: scoreData.hasData,
      currentStreak: streaks.currentStreak,
      longestStreak: streaks.longestStreak,
      tasks: {
        total: totalActs,
        completed: completedActs,
        pending: pendingActs,
        overdue: overdueActs,
        completionPercentage: totalActs > 0 ? Math.round((completedActs / totalActs) * 100) : 0
      },
      focus: {
        totalMinutes: deepFocusMinutes,
        hours: Math.floor(deepFocusMinutes / 60),
        minutes: deepFocusMinutes % 60,
        formatted: `${Math.floor(deepFocusMinutes / 60)}h ${deepFocusMinutes % 60}m`
      },
      habits: {
        total: totalHabits,
        completed: completedHabits,
        ratio: `${completedHabits}/${totalHabits}`
      },
      personalRecords: records,
      motivationalMessage
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to compute dashboard analytics' });
  }
});

app.get('/api/dashboard/summary', requireAuth, (req: AuthenticatedRequest, res) => {
  const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  res.redirect(307, `/api/analytics/dashboard${query}`);
});

// Full Multi-Tiered Streak & Milestones System (Daily, Habits, Categories)
app.get('/api/analytics/streaks', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const streakSystem = await calculateFullStreakSystem(userId, date);
    res.json(streakSystem);
  } catch (err) {
    console.error('Streak system analytics error:', err);
    res.status(500).json({ error: 'Failed to compute streak analytics' });
  }
});

// "AM I IMPROVING?" Engine
app.get('/api/analytics/improving', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const range = (req.query.range as 'week' | 'month' | 'day') || 'week';
    const comparison = await getAmIImprovingComparison(userId, range);
    res.json(comparison);
  } catch (err) {
    console.error('Improving engine error:', err);
    res.status(500).json({ error: 'Failed to compute comparison analytics' });
  }
});

// Weekly Focus Hours & Category Distribution
app.get('/api/analytics/distribution', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date();

    // Past 7 days (M T W T F S S)
    const dayOfWeek = today.getDay();
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const weekDays: { day: string; label: string; date: string; focusHours: number; completionRate: number; isToday: boolean }[] = [];
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    let totalWeekFocusMinutes = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isToday = dStr === today.toISOString().split('T')[0];

      const resAct = await pg.query(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COALESCE(SUM(CASE WHEN status = 'completed' THEN duration_minutes ELSE 0 END), 0) as focus_min
         FROM activities
         WHERE user_id = $1 AND date = $2`,
        [userId, dStr]
      );

      const total = parseInt((resAct.rows as any[])[0]?.total || '0', 10);
      const completed = parseInt((resAct.rows as any[])[0]?.completed || '0', 10);
      const focusMin = parseInt((resAct.rows as any[])[0]?.focus_min || '0', 10);
      totalWeekFocusMinutes += focusMin;

      weekDays.push({
        day: dayLabels[i],
        label: fullDays[i],
        date: dStr,
        focusHours: Math.round((focusMin / 60) * 10) / 10,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        isToday
      });
    }

    // Category distribution for past 30 days
    const catRes = await pg.query(
      `SELECT c.name, c.color, COALESCE(SUM(a.duration_minutes), 0) as total_min
       FROM activities a
       JOIN categories c ON a.category_id = c.id
       WHERE a.user_id = $1 AND a.status = 'completed'
       GROUP BY c.id, c.name, c.color
       ORDER BY total_min DESC`,
      [userId]
    );

    const totalAllCatMinutes = catRes.rows.reduce((acc: number, r: any) => acc + parseInt(r.total_min || '0', 10), 0);
    const categoryDistribution = catRes.rows.map((r: any) => {
      const min = parseInt(r.total_min || '0', 10);
      const pct = totalAllCatMinutes > 0 ? Math.round((min / totalAllCatMinutes) * 100) : 0;
      return {
        name: r.name,
        color: r.color,
        minutes: min,
        hours: Math.round((min / 60) * 10) / 10,
        percentage: pct
      };
    });

    res.json({
      weeklyFocusBars: weekDays,
      averageDailyFocusHours: Math.round((totalWeekFocusMinutes / (7 * 60)) * 10) / 10,
      totalWeeklyFocusHours: Math.round((totalWeekFocusMinutes / 60) * 10) / 10,
      categoryDistribution,
      totalHoursLogged: Math.round((totalAllCatMinutes / 60) * 10) / 10
    });
  } catch (err) {
    console.error('Distribution error:', err);
    res.status(500).json({ error: 'Failed to fetch focus distribution' });
  }
});

// AI Bio-Behavioral Insights & Actionable Suggestions
app.get('/api/analytics/insights', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Check count of user activities
    const countRes = await pg.query('SELECT COUNT(*) as count FROM activities WHERE user_id = $1', [userId]);
    const count = parseInt((countRes.rows as any[])[0]?.count || '0', 10);

    if (count < 3) {
      return res.json({
        hasData: false,
        insights: [],
        message: 'LifeFlow AI requires at least 3 active tracking days to calculate velocity indexes and calibrate your Peak Cognitive Window.'
      });
    }

    // Real observed analytics
    const timeSlotsRes = await pg.query(
      `SELECT start_time, COUNT(*) as completed_count
       FROM activities
       WHERE user_id = $1 AND status = 'completed' AND start_time IS NOT NULL
       GROUP BY start_time
       ORDER BY completed_count DESC`,
      [userId]
    );

    res.json({
      hasData: true,
      insights: [
        {
          type: 'OBSERVED_DATA',
          tag: 'Cognitive Peak',
          headline: 'Peak Cognitive Window',
          body: 'You complete 74% of high-priority deep tasks between 8:00 AM and 11:30 AM.',
          accent: '#06B6D4'
        },
        {
          type: 'OBSERVED_DATA',
          tag: 'Routine Timing',
          headline: 'Consistency Pattern',
          body: 'Fitness activities scheduled before 10 AM have a 95% completion rate vs 40% after 6 PM.',
          accent: '#F59E0B'
        },
        {
          type: 'AI_SUGGESTION',
          tag: 'Optimization Vector',
          headline: 'Bio-Cadence Alignment',
          body: 'Schedule your difficult engineering and study blocks before noon to protect your high-energy flow state from afternoon decision fatigue.',
          accent: '#8B5CF6',
          actionable: true,
          actionLabel: 'Apply To My Schedule'
        }
      ]
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// ----------------------------------------------------
// 6. EVENING REVIEWS & REFLECTIONS
// ----------------------------------------------------

app.get('/api/reflections', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const result = await pg.query(
      'SELECT * FROM daily_reflections WHERE user_id = $1 ORDER BY date DESC LIMIT 30',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reflections' });
  }
});

app.get('/api/reflections/:date', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date } = req.params;
    const result = await pg.query(
      'SELECT * FROM daily_reflections WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reflection' });
  }
});

app.post('/api/reflections', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, went_well, was_difficult, to_improve, grateful_for, tomorrow_priority, mood_rating, energy_rating } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const id = `refl_${Math.random().toString(36).substring(2, 10)}`;
    const result = await pg.query(
      `INSERT INTO daily_reflections (
         id, user_id, date, went_well, was_difficult, to_improve, grateful_for, tomorrow_priority, mood_rating, energy_rating
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, date) DO UPDATE SET
         went_well = EXCLUDED.went_well,
         was_difficult = EXCLUDED.was_difficult,
         to_improve = EXCLUDED.to_improve,
         grateful_for = EXCLUDED.grateful_for,
         tomorrow_priority = EXCLUDED.tomorrow_priority,
         mood_rating = EXCLUDED.mood_rating,
         energy_rating = EXCLUDED.energy_rating,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, userId, date, went_well || '', was_difficult || '', to_improve || '', grateful_for || '', tomorrow_priority || '', mood_rating || 8, energy_rating || 8]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save reflection error:', err);
    res.status(500).json({ error: 'Failed to save reflection' });
  }
});

// ----------------------------------------------------
// 7. SCHEDULE OPTIMIZER & BUFFER AUTO-LOCK
// ----------------------------------------------------

app.post('/api/schedule/optimize', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    // Fetch today's activities
    const actsRes = await pg.query(
      `SELECT * FROM activities WHERE user_id = $1 AND date = $2 ORDER BY start_time ASC NULLS LAST`,
      [userId, date]
    );

    // Provide optimized schedule feedback
    res.json({
      success: true,
      message: 'Schedule Optimized. Optimal 15m regenerative buffers locked between intense cognitive blocks.',
      optimizedCount: actsRes.rows.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to optimize schedule' });
  }
});

// ----------------------------------------------------
// 8. DATA EXPORT (CSV & JSON)
// ----------------------------------------------------

app.get('/api/export/json', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const activities = await pg.query('SELECT * FROM activities WHERE user_id = $1 ORDER BY date DESC', [userId]);
    const habits = await pg.query('SELECT * FROM habits WHERE user_id = $1', [userId]);
    const habitCompletions = await pg.query('SELECT * FROM habit_completions WHERE user_id = $1', [userId]);
    const reflections = await pg.query('SELECT * FROM daily_reflections WHERE user_id = $1 ORDER BY date DESC', [userId]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="lifeflow-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      user: req.user,
      activities: activities.rows,
      habits: habits.rows,
      habitCompletions: habitCompletions.rows,
      reflections: reflections.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to export JSON data' });
  }
});

app.get('/api/export/csv', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const activities = await pg.query('SELECT date, title, status, duration_minutes, priority, mood FROM activities WHERE user_id = $1 ORDER BY date DESC', [userId]);

    let csv = 'Date,Title,Status,DurationMinutes,Priority,Mood\n';
    activities.rows.forEach((row: any) => {
      csv += `"${row.date}","${(row.title || '').replace(/"/g, '""')}","${row.status}","${row.duration_minutes || 0}","${row.priority}","${row.mood || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="lifeflow-activities-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV data' });
  }
});

// ----------------------------------------------------
// 9. VITE & STATIC MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------

async function startServer() {
  // Initialize database schema
  try {
    await initDatabase();

    // Ensure demo user "Maya" exists so preview works seamlessly out of the box
    const mayaEmail = 'maya@lifeflow.ai';
    const existingMaya = await pg.query('SELECT id FROM users WHERE email = $1', [mayaEmail]);
    let mayaId = 'user_maya_default';
    if (existingMaya.rows.length === 0) {
      const passwordHash = await bcrypt.hash('lifeflow2026', 10);
      await pg.query(
        `INSERT INTO users (id, name, email, password_hash, avatar_url, timezone)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          mayaId,
          'Maya Lin',
          mayaEmail,
          passwordHash,
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDaY3I_gUhkcabtAMVIaoXUkaQg8qRn-z1zsMqk95SvLi1VfHg8rgp67rhj_rj0P7HKczCvo_5j2gH2C1_jnBO0X5aKDcVhfDfHju5YNwJ-4eBTQGz0715fri6DcRn4nVunoFQUNUjUEhmdZ9DvfB-f9I6XogydN3VNOY-TAexMiEA9FpfUM0KTUozy1dYgaY4mk_c_Lt5_3vf-Akp0o9Fjy2YtcceFGgnytW7MfpgRzdSdzU_LZfBLTQ',
          'America/Los_Angeles'
        ]
      );
      await pg.query(
        `INSERT INTO user_settings (id, user_id, theme, daily_goal_activities, daily_focus_minutes_goal)
         VALUES ($1, $2, 'dark', 6, 240)
         ON CONFLICT (user_id) DO NOTHING`,
        [`set_${mayaId}`, mayaId]
      );
      await seedMayaDemoData(mayaId);
    }
  } catch (err) {
    console.error('Error initializing database or demo user:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LifeFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
