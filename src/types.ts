export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'missed' | 'overdue';
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  is_active: boolean;
}

export interface Activity {
  id: string;
  user_id: string;
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  title: string;
  description?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  priority: ActivityPriority;
  status: ActivityStatus;
  notes?: string;
  mood?: string;
  energy_level?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface Habit {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  frequency: string;
  target_days_per_week: number;
  reminder_time?: string;
  start_date: string;
  is_active: boolean;
  notes?: string;
  current_streak: number;
  week_status: Record<string, boolean>;
  week_completed_count: number;
  completion_rate: number;
}

export interface HabitHeatmapDay {
  date: string;
  dayNumber: number;
  count: number;
  totalHabits: number;
  intensity: number;
}

export interface ProductivityScoreBreakdown {
  score: number;
  hasData: boolean;
  components: {
    completion: { score: number; max: number; label: string; detail: string };
    consistency: { score: number; max: number; label: string; detail: string };
    focusTime: { score: number; max: number; label: string; detail: string };
    routines: { score: number; max: number; label: string; detail: string };
  };
}

export interface DashboardSummary {
  productivityScore: number;
  scoreBreakdown: ProductivityScoreBreakdown['components'];
  hasData: boolean;
  currentStreak: number;
  longestStreak: number;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionPercentage: number;
  };
  focus: {
    totalMinutes: number;
    hours: number;
    minutes: number;
    formatted: string;
  };
  habits: {
    total: number;
    completed: number;
    ratio: string;
  };
  personalRecords: {
    longestStreakDays: number;
    currentStreakDays: number;
    peakDayFocusHours: number;
    mostActivitiesCompletedInDay: number;
    bestCompletionRatePercent: number;
    mostConsistentHabit: { name: string; completions: number } | null;
    hasData: boolean;
  };
  motivationalMessage: string;
}

export interface ImprovingComparison {
  hasSufficientData: boolean;
  message?: string;
  subMessage?: string;
  distinctDays?: number;
  requiredDays?: number;
  isImproving?: boolean;
  headline?: string;
  progressVelocityPercent?: number;
  current?: {
    completionRate: number;
    focusHours: number;
    completedTasks: number;
    missedTasks: number;
    habitCheckins: number;
  };
  prior?: {
    completionRate: number;
    focusHours: number;
    completedTasks: number;
    missedTasks: number;
    habitCheckins: number;
  };
  deltas?: {
    completionRateDelta: number;
    focusHoursDelta: number;
    missedTasksDelta: number;
    habitCheckinsDelta: number;
  };
}

export interface WeeklyFocusBar {
  day: string;
  label: string;
  date: string;
  focusHours: number;
  completionRate: number;
  isToday: boolean;
}

export interface CategoryAllocation {
  name: string;
  color: string;
  minutes: number;
  hours: number;
  percentage: number;
}

export interface DistributionData {
  weeklyFocusBars: WeeklyFocusBar[];
  averageDailyFocusHours: number;
  totalWeeklyFocusHours: number;
  categoryDistribution: CategoryAllocation[];
  totalHoursLogged: number;
}

export interface BioInsight {
  type: 'OBSERVED_DATA' | 'AI_SUGGESTION';
  tag: string;
  headline: string;
  body: string;
  accent: string;
  actionable?: boolean;
  actionLabel?: string;
}

export interface DailyReflection {
  id?: string;
  user_id?: string;
  date: string;
  went_well: string;
  was_difficult: string;
  to_improve: string;
  grateful_for: string;
  tomorrow_priority: string;
  mood_rating?: number;
  energy_rating?: number;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  timezone: string;
}

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  badge: string;
  unlocked: boolean;
  unlockedDate: string | null;
  progressPercent: number;
}

export interface NextStreakMilestone {
  target: number;
  remaining: number;
  title: string;
  progressPercent: number;
}

export interface DailyStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  milestones: StreakMilestone[];
  nextMilestone: NextStreakMilestone | null;
  activeDates: string[];
}

export interface HabitStreakInfo {
  id: string;
  name: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  milestones: StreakMilestone[];
  nextMilestone: NextStreakMilestone | null;
}

export interface CategoryStreakInfo {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  milestones: StreakMilestone[];
  nextMilestone: NextStreakMilestone | null;
}

export interface StreakAchievement {
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
}

export interface StreakSystemData {
  daily: DailyStreakInfo;
  habits: HabitStreakInfo[];
  categories: CategoryStreakInfo[];
  allMilestones: StreakAchievement[];
}
