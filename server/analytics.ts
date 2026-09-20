import { pg } from './db.ts';

export interface ProductivityBreakdown {
  score: number;
  components: {
    completion: { score: number; max: number; label: string; detail: string };
    consistency: { score: number; max: number; label: string; detail: string };
    focusTime: { score: number; max: number; label: string; detail: string };
    routines: { score: number; max: number; label: string; detail: string };
  };
  hasData: boolean;
}

export async function calculateProductivityScore(userId: string, targetDate: string): Promise<ProductivityBreakdown> {
  // 1. Activities for the date
  const actRes = await pg.query(
    `SELECT status, duration_minutes FROM activities WHERE user_id = $1 AND date = $2`,
    [userId, targetDate]
  );
  const totalActivities = actRes.rows.length;
  const completedActivities = actRes.rows.filter((r: any) => r.status === 'completed').length;
  const totalFocusMinutes = actRes.rows
    .filter((r: any) => r.status === 'completed')
    .reduce((acc: number, r: any) => acc + (r.duration_minutes || 0), 0);

  // 2. Habits for the date
  const habitRes = await pg.query(
    `SELECT id FROM habits WHERE user_id = $1 AND is_active = TRUE`,
    [userId]
  );
  const totalHabits = habitRes.rows.length;

  const compRes = await pg.query(
    `SELECT habit_id FROM habit_completions WHERE user_id = $1 AND date = $2`,
    [userId, targetDate]
  );
  const completedHabits = compRes.rows.length;

  // 3. User streaks
  const streak = await calculateDailyStreak(userId, targetDate);

  if (totalActivities === 0 && totalHabits === 0 && completedHabits === 0) {
    return {
      score: 0,
      components: {
        completion: { score: 0, max: 40, label: 'Completion Depth', detail: '0/0 planned activities' },
        consistency: { score: 0, max: 30, label: 'Consistency Habit Index', detail: '0-day streak' },
        focusTime: { score: 0, max: 20, label: 'Focus Density Engine', detail: '0m / 240m logged' },
        routines: { score: 0, max: 10, label: 'Routine Adherence', detail: '0 active routines' }
      },
      hasData: false
    };
  }

  // Formula components
  const completionScore = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 40)
    : 0;

  const consistencyScore = Math.min(30, Math.round((streak.currentStreak / 7) * 30));

  const targetFocusMin = 240; // 4 hours
  const focusScore = Math.min(20, Math.round((totalFocusMinutes / targetFocusMin) * 20));

  const routineScore = totalHabits > 0
    ? Math.round((completedHabits / totalHabits) * 10)
    : 0;

  const totalScore = Math.min(100, Math.max(0, completionScore + consistencyScore + focusScore + routineScore));

  return {
    score: totalScore,
    components: {
      completion: {
        score: completionScore,
        max: 40,
        label: 'Completion Depth',
        detail: `${completedActivities}/${totalActivities} tasks completed`
      },
      consistency: {
        score: consistencyScore,
        max: 30,
        label: 'Consistency Habit Index',
        detail: `${streak.currentStreak}-day continuous streak`
      },
      focusTime: {
        score: focusScore,
        max: 20,
        label: 'Focus Density Engine',
        detail: `${totalFocusMinutes}m / ${targetFocusMin}m deep focus target`
      },
      routines: {
        score: routineScore,
        max: 10,
        label: 'Routine Adherence',
        detail: `${completedHabits}/${totalHabits} anchor habits locked`
      }
    },
    hasData: true
  };
}

export async function calculateDailyStreak(userId: string, asOfDate: string): Promise<{ currentStreak: number; longestStreak: number }> {
  // Query all dates where user had at least one completed activity OR one habit completion
  const datesRes = await pg.query(
    `SELECT DISTINCT date FROM (
       SELECT date FROM activities WHERE user_id = $1 AND status = 'completed'
       UNION
       SELECT date FROM habit_completions WHERE user_id = $1
     ) combined
     ORDER BY date ASC`,
    [userId]
  );

  const activeDates = new Set(datesRes.rows.map((r: any) => r.date));
  if (activeDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate current streak backwards from asOfDate
  let currentStreak = 0;
  let curr = new Date(asOfDate + 'T00:00:00Z');
  
  // If asOfDate is not in activeDates, check if yesterday was active (streak active until today's end)
  const asOfStr = curr.toISOString().split('T')[0];
  if (!activeDates.has(asOfStr)) {
    curr.setUTCDate(curr.getUTCDate() - 1);
  }

  while (true) {
    const dStr = curr.toISOString().split('T')[0];
    if (activeDates.has(dStr)) {
      currentStreak++;
      curr.setUTCDate(curr.getUTCDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak historically
  const sortedDates = Array.from(activeDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    lastDate = d;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak)
  };
}

export async function calculatePersonalRecords(userId: string) {
  const streak = await calculateDailyStreak(userId, new Date().toISOString().split('T')[0]);

  // Peak day focus minutes & most activities in one day
  const dayStatsRes = await pg.query(
    `SELECT date,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
            COUNT(*) as total_count,
            SUM(CASE WHEN status = 'completed' THEN duration_minutes ELSE 0 END) as focus_minutes
     FROM activities
     WHERE user_id = $1
     GROUP BY date`,
    [userId]
  );

  let peakFocusHours = 0;
  let mostActivitiesDay = 0;
  let bestCompletionRate = 0;

  for (const row of dayStatsRes.rows as any[]) {
    const focusHrs = Math.round(((row.focus_minutes || 0) / 60) * 10) / 10;
    if (focusHrs > peakFocusHours) peakFocusHours = focusHrs;

    const completed = parseInt(row.completed_count || '0', 10);
    if (completed > mostActivitiesDay) mostActivitiesDay = completed;

    const total = parseInt(row.total_count || '0', 10);
    if (total > 0) {
      const rate = Math.round((completed / total) * 100);
      if (rate > bestCompletionRate) bestCompletionRate = rate;
    }
  }

  // Most consistent habit
  const habitRes = await pg.query(
    `SELECT h.name, COUNT(c.id) as completions_count
     FROM habits h
     LEFT JOIN habit_completions c ON h.id = c.habit_id
     WHERE h.user_id = $1
     GROUP BY h.id, h.name
     ORDER BY completions_count DESC
     LIMIT 1`,
    [userId]
  );

  const topHabit = (habitRes.rows as any[])[0];

  return {
    longestStreakDays: streak.longestStreak,
    currentStreakDays: streak.currentStreak,
    peakDayFocusHours: peakFocusHours,
    mostActivitiesCompletedInDay: mostActivitiesDay,
    bestCompletionRatePercent: bestCompletionRate,
    mostConsistentHabit: topHabit ? { name: topHabit.name, completions: parseInt(topHabit.completions_count, 10) } : null,
    hasData: dayStatsRes.rows.length > 0 || (topHabit && parseInt(topHabit.completions_count, 10) > 0)
  };
}

export async function getAmIImprovingComparison(userId: string, range: 'week' | 'month' | 'day') {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Check how many days of recorded data exist
  const countDaysRes = await pg.query(
    `SELECT COUNT(DISTINCT date) as days_count
     FROM (
       SELECT date FROM activities WHERE user_id = $1
       UNION
       SELECT date FROM habit_completions WHERE user_id = $1
     ) d`,
    [userId]
  );

  const distinctDays = parseInt((countDaysRes.rows as any[])[0]?.days_count || '0', 10);
  if (distinctDays < 2) {
    return {
      hasSufficientData: false,
      message: "Keep using LIFEFlow. We'll show meaningful comparisons once enough data is available.",
      subMessage: "LifeFlow requires at least 2 active tracking days to compute progress velocity and comparison metrics.",
      distinctDays,
      requiredDays: 3
    };
  }

  // Calculate current period vs prior period
  let periodDays = range === 'month' ? 30 : range === 'week' ? 7 : 1;

  const currentStartDate = new Date(today.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const priorEndDate = new Date(today.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const priorStartDate = new Date(today.getTime() - (periodDays * 2 - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Current period stats
  const currRes = await pg.query(
    `SELECT 
       COUNT(*) as total_tasks,
       COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
       COUNT(*) FILTER (WHERE status = 'missed' OR status = 'overdue') as missed_tasks,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN duration_minutes ELSE 0 END), 0) as focus_min
     FROM activities
     WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, currentStartDate, dateStr]
  );

  // Prior period stats
  const priorRes = await pg.query(
    `SELECT 
       COUNT(*) as total_tasks,
       COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
       COUNT(*) FILTER (WHERE status = 'missed' OR status = 'overdue') as missed_tasks,
       COALESCE(SUM(CASE WHEN status = 'completed' THEN duration_minutes ELSE 0 END), 0) as focus_min
     FROM activities
     WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, priorStartDate, priorEndDate]
  );

  // Habits consistency
  const currHabitsRes = await pg.query(
    `SELECT COUNT(*) as count FROM habit_completions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, currentStartDate, dateStr]
  );
  const priorHabitsRes = await pg.query(
    `SELECT COUNT(*) as count FROM habit_completions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, priorStartDate, priorEndDate]
  );

  const currTotal = parseInt((currRes.rows as any[])[0]?.total_tasks || '0', 10);
  const currCompleted = parseInt((currRes.rows as any[])[0]?.completed_tasks || '0', 10);
  const currMissed = parseInt((currRes.rows as any[])[0]?.missed_tasks || '0', 10);
  const currFocusHrs = Math.round((parseInt((currRes.rows as any[])[0]?.focus_min || '0', 10) / 60) * 10) / 10;
  const currCompletionRate = currTotal > 0 ? Math.round((currCompleted / currTotal) * 100) : 0;

  const priorTotal = parseInt((priorRes.rows as any[])[0]?.total_tasks || '0', 10);
  const priorCompleted = parseInt((priorRes.rows as any[])[0]?.completed_tasks || '0', 10);
  const priorMissed = parseInt((priorRes.rows as any[])[0]?.missed_tasks || '0', 10);
  const priorFocusHrs = Math.round((parseInt((priorRes.rows as any[])[0]?.focus_min || '0', 10) / 60) * 10) / 10;
  const priorCompletionRate = priorTotal > 0 ? Math.round((priorCompleted / priorTotal) * 100) : 0;

  const completionDelta = currCompletionRate - priorCompletionRate;
  const focusDelta = Math.round((currFocusHrs - priorFocusHrs) * 10) / 10;
  const missedDelta = currMissed - priorMissed;

  const currHabitsCount = parseInt((currHabitsRes.rows as any[])[0]?.count || '0', 10);
  const priorHabitsCount = parseInt((priorHabitsRes.rows as any[])[0]?.count || '0', 10);
  const habitDelta = currHabitsCount - priorHabitsCount;

  const isImproving = (completionDelta >= 0 && focusDelta >= 0) || (completionDelta > 5);
  const overallVelocity = Math.max(-50, Math.min(100, Math.round(completionDelta * 0.5 + (focusDelta > 0 ? 8 : -8))));

  return {
    hasSufficientData: true,
    isImproving,
    headline: isImproving ? "YES, YOU ARE IMPROVING" : "MAINTAINING MOMENTUM",
    progressVelocityPercent: overallVelocity,
    current: {
      completionRate: currCompletionRate,
      focusHours: currFocusHrs,
      completedTasks: currCompleted,
      missedTasks: currMissed,
      habitCheckins: currHabitsCount
    },
    prior: {
      completionRate: priorCompletionRate,
      focusHours: priorFocusHrs,
      completedTasks: priorCompleted,
      missedTasks: priorMissed,
      habitCheckins: priorHabitsCount
    },
    deltas: {
      completionRateDelta: completionDelta,
      focusHoursDelta: focusDelta,
      missedTasksDelta: missedDelta,
      habitCheckinsDelta: habitDelta
    }
  };
}

// ---------------------------------------------------------------------------
// 5. ROBUST STREAK & MILESTONES CALCULATION ENGINE
// Real completion records ONLY (Activities & Habit completions)
// ---------------------------------------------------------------------------

export const STREAK_MILESTONES_CONFIG = [
  { days: 7, title: '7-Day Anchor', description: 'One unbroken week of conscious discipline', badge: 'flame' },
  { days: 14, title: 'Fortnight Momentum', description: 'Two continuous weeks of conscious flow', badge: 'shield' },
  { days: 30, title: 'Monthly Mastery', description: 'One full calendar cycle without a broken chain', badge: 'crown' },
  { days: 60, title: '60-Day Neuro-Lock', description: 'Neural automaticity: habit loop fundamentally locked in', badge: 'sparkles' },
  { days: 100, title: 'Centurion Flow', description: 'Triple-digit milestone: 100 days of relentless dedication', badge: 'award' },
  { days: 365, title: 'Titan of Consistency', description: 'A complete orbit around the sun in continuous unbroken intent', badge: 'trophy' }
];

function findConsecutiveStats(sortedDates: string[], asOfDate: string): { currentStreak: number; longestStreak: number } {
  const activeDates = new Set(sortedDates);
  if (activeDates.size === 0) return { currentStreak: 0, longestStreak: 0 };

  // Current streak backwards from asOfDate
  let currentStreak = 0;
  let curr = new Date(asOfDate + 'T00:00:00Z');
  const asOfStr = curr.toISOString().split('T')[0];
  if (!activeDates.has(asOfStr)) {
    curr.setUTCDate(curr.getUTCDate() - 1);
  }

  while (true) {
    const dStr = curr.toISOString().split('T')[0];
    if (activeDates.has(dStr)) {
      currentStreak++;
      curr.setUTCDate(curr.getUTCDate() - 1);
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr + 'T00:00:00Z');
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    lastDate = d;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak)
  };
}

function findMilestoneUnlockDate(sortedDates: string[], targetDays: number): string | null {
  if (sortedDates.length < targetDays) return null;
  let run = 0;
  let prevDate: Date | null = null;
  for (const dStr of sortedDates) {
    const d = new Date(dStr + 'T00:00:00Z');
    if (!prevDate) {
      run = 1;
    } else {
      const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        run++;
      } else if (diff > 1) {
        run = 1;
      }
    }
    prevDate = d;
    if (run >= targetDays) {
      return dStr;
    }
  }
  return null;
}

function buildMilestones(sortedDates: string[], currentStreak: number, longestStreak: number) {
  return STREAK_MILESTONES_CONFIG.map((m) => {
    const unlocked = longestStreak >= m.days;
    const unlockedDate = unlocked ? findMilestoneUnlockDate(sortedDates, m.days) : null;
    const progressPercent = Math.min(100, Math.round((currentStreak / m.days) * 100));
    return {
      days: m.days,
      title: m.title,
      description: m.description,
      badge: m.badge,
      unlocked,
      unlockedDate,
      progressPercent
    };
  });
}

function getNextMilestone(milestones: any[], currentStreak: number) {
  const next = milestones.find((m) => m.days > currentStreak);
  if (!next) return null;
  return {
    target: next.days,
    remaining: next.days - currentStreak,
    title: next.title,
    progressPercent: Math.min(100, Math.round((currentStreak / next.days) * 100))
  };
}

export async function calculateFullStreakSystem(userId: string, asOfDate: string) {
  // 1. Daily Streak Calculation
  const dailyDatesRes = await pg.query(
    `SELECT DISTINCT date FROM (
       SELECT date FROM activities WHERE user_id = $1 AND status = 'completed'
       UNION
       SELECT date FROM habit_completions WHERE user_id = $1
     ) combined
     ORDER BY date ASC`,
    [userId]
  );
  const dailySortedDates = (dailyDatesRes.rows as any[]).map((r) => r.date);
  const dailyStats = findConsecutiveStats(dailySortedDates, asOfDate);
  const dailyMilestones = buildMilestones(dailySortedDates, dailyStats.currentStreak, dailyStats.longestStreak);
  const dailyNext = getNextMilestone(dailyMilestones, dailyStats.currentStreak);

  // 2. Habit Streaks Calculation
  const habitsRes = await pg.query(
    `SELECT h.*, c.name as category_name, c.color as category_color, c.icon as category_icon
     FROM habits h
     LEFT JOIN categories c ON h.category_id = c.id
     WHERE h.user_id = $1 AND h.is_active = TRUE
     ORDER BY h.created_at ASC`,
    [userId]
  );

  const habitCompletionsRes = await pg.query(
    `SELECT habit_id, date FROM habit_completions WHERE user_id = $1 ORDER BY date ASC`,
    [userId]
  );

  const habitCompletionsMap: Record<string, string[]> = {};
  for (const row of habitCompletionsRes.rows as any[]) {
    if (!habitCompletionsMap[row.habit_id]) habitCompletionsMap[row.habit_id] = [];
    habitCompletionsMap[row.habit_id].push(row.date);
  }

  const habitStreaks = habitsRes.rows.map((h: any) => {
    const dates = habitCompletionsMap[h.id] || [];
    const stats = findConsecutiveStats(dates, asOfDate);
    const milestones = buildMilestones(dates, stats.currentStreak, stats.longestStreak);
    const next = getNextMilestone(milestones, stats.currentStreak);

    return {
      id: h.id,
      name: h.name,
      categoryName: h.category_name || 'General',
      categoryColor: h.category_color || '#06B6D4',
      categoryIcon: h.category_icon || 'Zap',
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalCompletions: dates.length,
      milestones,
      nextMilestone: next
    };
  });

  // 3. Category Streaks Calculation
  const categoriesRes = await pg.query(
    `SELECT id, name, color, icon FROM categories 
     WHERE (user_id = $1 OR user_id IS NULL) AND is_active = TRUE
     ORDER BY name ASC`,
    [userId]
  );

  const actCatRes = await pg.query(
    `SELECT category_id, date FROM activities 
     WHERE user_id = $1 AND status = 'completed' AND category_id IS NOT NULL`,
    [userId]
  );

  const habCatRes = await pg.query(
    `SELECT h.category_id, hc.date 
     FROM habit_completions hc
     JOIN habits h ON hc.habit_id = h.id
     WHERE hc.user_id = $1 AND h.category_id IS NOT NULL`,
    [userId]
  );

  const catDatesMap: Record<string, Set<string>> = {};
  const catTotalCompletions: Record<string, number> = {};

  for (const row of actCatRes.rows as any[]) {
    if (!catDatesMap[row.category_id]) catDatesMap[row.category_id] = new Set();
    catDatesMap[row.category_id].add(row.date);
    catTotalCompletions[row.category_id] = (catTotalCompletions[row.category_id] || 0) + 1;
  }

  for (const row of habCatRes.rows as any[]) {
    if (!catDatesMap[row.category_id]) catDatesMap[row.category_id] = new Set();
    catDatesMap[row.category_id].add(row.date);
    catTotalCompletions[row.category_id] = (catTotalCompletions[row.category_id] || 0) + 1;
  }

  const categoryStreaks = (categoriesRes.rows as any[]).map((cat) => {
    const datesSet = catDatesMap[cat.id] || new Set();
    const sortedDates = Array.from(datesSet).sort();
    const stats = findConsecutiveStats(sortedDates, asOfDate);
    const milestones = buildMilestones(sortedDates, stats.currentStreak, stats.longestStreak);
    const next = getNextMilestone(milestones, stats.currentStreak);

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color || '#06B6D4',
      categoryIcon: cat.icon || 'Folder',
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalCompletions: catTotalCompletions[cat.id] || 0,
      milestones,
      nextMilestone: next
    };
  });

  // 4. Flat Unified Achievement Milestones (for Journey view & Celebration checks)
  const allMilestones: Array<{
    id: string;
    type: 'daily' | 'habit' | 'category';
    entityName: string;
    targetDays: number;
    title: string;
    description: string;
    badge: string;
    unlocked: boolean;
    unlockedDate: string | null;
    currentStreak: number;
    longestStreak: number;
  }> = [];

  // Daily milestones
  dailyMilestones.forEach((m) => {
    allMilestones.push({
      id: `daily_${m.days}`,
      type: 'daily',
      entityName: 'Daily Flow Rhythm',
      targetDays: m.days,
      title: m.title,
      description: m.description,
      badge: m.badge,
      unlocked: m.unlocked,
      unlockedDate: m.unlockedDate,
      currentStreak: dailyStats.currentStreak,
      longestStreak: dailyStats.longestStreak
    });
  });

  // Habit milestones
  habitStreaks.forEach((h) => {
    h.milestones.forEach((m: any) => {
      allMilestones.push({
        id: `habit_${h.id}_${m.days}`,
        type: 'habit',
        entityName: h.name,
        targetDays: m.days,
        title: `${h.name}: ${m.title}`,
        description: `${m.days} consecutive days of ${h.name}`,
        badge: m.badge,
        unlocked: m.unlocked,
        unlockedDate: m.unlockedDate,
        currentStreak: h.currentStreak,
        longestStreak: h.longestStreak
      });
    });
  });

  // Category milestones
  categoryStreaks.forEach((c) => {
    c.milestones.forEach((m: any) => {
      allMilestones.push({
        id: `cat_${c.categoryId}_${m.days}`,
        type: 'category',
        entityName: c.categoryName,
        targetDays: m.days,
        title: `${c.categoryName}: ${m.title}`,
        description: `${m.days} consecutive days in ${c.categoryName}`,
        badge: m.badge,
        unlocked: m.unlocked,
        unlockedDate: m.unlockedDate,
        currentStreak: c.currentStreak,
        longestStreak: c.longestStreak
      });
    });
  });

  return {
    daily: {
      currentStreak: dailyStats.currentStreak,
      longestStreak: dailyStats.longestStreak,
      totalActiveDays: dailySortedDates.length,
      milestones: dailyMilestones,
      nextMilestone: dailyNext,
      activeDates: dailySortedDates
    },
    habits: habitStreaks,
    categories: categoryStreaks,
    allMilestones
  };
}
