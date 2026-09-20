import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.error('Could not create data dir, using memory', e);
  }
}

const dbPath = path.join(dataDir, 'lifeflow.db');

export let pg: PGlite;
try {
  pg = new PGlite(dbPath);
} catch (err) {
  console.warn('Falling back to in-memory PGlite:', err);
  pg = new PGlite();
}

export async function initDatabase() {
  console.log('Initializing PostgreSQL database schema with PGlite...');

  // 1. Users table
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      timezone TEXT DEFAULT 'UTC',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER DEFAULT 30,
      priority TEXT DEFAULT 'medium',
      is_recurring BOOLEAN DEFAULT FALSE,
      recurrence_pattern TEXT,
      status TEXT DEFAULT 'planned',
      notes TEXT,
      mood TEXT,
      energy_level TEXT,
      tags TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      target_days_per_week INTEGER DEFAULT 7,
      reminder_time TEXT,
      start_date TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_reflections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      went_well TEXT,
      was_difficult TEXT,
      to_improve TEXT,
      grateful_for TEXT,
      tomorrow_priority TEXT,
      mood_rating INTEGER,
      energy_rating INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      scheduled_for TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT DEFAULT 'dark',
      notification_prefs TEXT DEFAULT '{"activities":true,"habits":true,"evening_review":true,"streaks":true}',
      daily_goal_activities INTEGER DEFAULT 5,
      daily_focus_minutes_goal INTEGER DEFAULT 240,
      start_of_week TEXT DEFAULT 'monday',
      timezone TEXT DEFAULT 'America/Los_Angeles',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      badge_icon TEXT NOT NULL,
      category TEXT NOT NULL,
      criteria_type TEXT NOT NULL,
      criteria_threshold INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      current_progress INTEGER DEFAULT 0,
      UNIQUE(user_id, achievement_id)
    );

    CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_activities_user_status ON activities(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON daily_reflections(user_id, date);
  `);

  // Seed default achievements
  const defaultAchievements = [
    { id: 'ach_1', code: 'first_activity', title: 'First Spark', description: 'Log and complete your first activity in LifeFlow.', badge_icon: 'sparkles', category: 'Activities', criteria_type: 'activities_completed', criteria_threshold: 1 },
    { id: 'ach_2', code: 'streak_3', title: 'Momentum Ignited', description: 'Maintain a 3-day active habit or activity streak.', badge_icon: 'flame', category: 'Streaks', criteria_type: 'streak_days', criteria_threshold: 3 },
    { id: 'ach_3', code: 'streak_7', title: 'Flow Master (7 Days)', description: 'Reach a 7-day consistency streak across your life.', badge_icon: 'military_tech', category: 'Streaks', criteria_type: 'streak_days', criteria_threshold: 7 },
    { id: 'ach_4', code: 'streak_14', title: 'Fortnight of Focus', description: '14 uninterrupted days of conscious routine execution.', badge_icon: 'shield_check', category: 'Streaks', criteria_type: 'streak_days', criteria_threshold: 14 },
    { id: 'ach_5', code: 'streak_30', title: '30-Day Momentum Titan', description: 'Complete a full month with unbroken daily cadence.', badge_icon: 'crown', category: 'Streaks', criteria_type: 'streak_days', criteria_threshold: 30 },
    { id: 'ach_6', code: 'streak_100', title: 'Century of Intent', description: '100 days of showing up and crafting your story.', badge_icon: 'award', category: 'Streaks', criteria_type: 'streak_days', criteria_threshold: 100 },
    { id: 'ach_7', code: 'deep_diver_4h', title: 'Deep Work Champion', description: 'Log 4+ hours of deep focus in a single calendar day.', badge_icon: 'timer', category: 'Focus', criteria_type: 'single_day_focus_min', criteria_threshold: 240 },
    { id: 'ach_8', code: 'first_reflection', title: 'Introspective Mind', description: 'Complete your first Evening Reflection review.', badge_icon: 'moon', category: 'Reflections', criteria_type: 'reflections_completed', criteria_threshold: 1 },
    { id: 'ach_9', code: 'perfect_habit_day', title: 'Zero Drift Day', description: 'Complete 100% of your daily habits in one day.', badge_icon: 'check_check', category: 'Habits', criteria_type: 'perfect_habit_day', criteria_threshold: 1 },
  ];

  for (const ach of defaultAchievements) {
    await pg.query(
      `INSERT INTO achievements (id, code, title, description, badge_icon, category, criteria_type, criteria_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (code) DO NOTHING;`,
      [ach.id, ach.code, ach.title, ach.description, ach.badge_icon, ach.category, ach.criteria_type, ach.criteria_threshold]
    );
  }

  console.log('PostgreSQL database initialized successfully!');
}
