import { Capacitor } from '@capacitor/core';
import {
  Activity,
  Category,
  Habit,
  HabitHeatmapDay,
  DashboardSummary,
  ImprovingComparison,
  DistributionData,
  BioInsight,
  DailyReflection,
  User,
  StreakSystemData
} from './types';

let authToken: string | null = localStorage.getItem('lifeflow_token');
const isNativeApp = Capacitor.isNativePlatform();
const apiBaseUrl = (import.meta.env.VITE_API_URL || (isNativeApp ? 'http://10.0.2.2:3000' : '')).replace(/\/$/, '');

export function setClientToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('lifeflow_token', token);
  } else {
    localStorage.removeItem('lifeflow_token');
  }
}

export function getClientToken() {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers
  });

  const responseText = await response.text();
  let responseData: T | { error?: string };

  try {
    responseData = JSON.parse(responseText) as T | { error?: string };
  } catch {
    throw new Error(
      `The API returned an invalid response. Check that the backend is running and reachable at ${apiBaseUrl || 'this address'}.`
    );
  }

  if (!response.ok) {
    const errorData = responseData as { error?: string };
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return responseData as T;
}

export const api = {
  // Auth
  async signup(data: { name: string; email: string; password: string; seedSample?: boolean }) {
    const res = await request<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setClientToken(res.token);
    return res;
  },

  async login(data: { name?: string; email?: string; password?: string }) {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setClientToken(res.token);
    return res;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async seedDemo() {
    return request<{ success: boolean; message: string }>('/api/auth/seed-demo', { method: 'POST' });
  },

  async resetData() {
    return request<{ success: boolean; message: string }>('/api/auth/reset-data', { method: 'POST' });
  },

  // Activities
  async getActivities(params?: { date?: string; category_id?: string; status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.date) q.set('date', params.date);
    if (params?.category_id) q.set('category_id', params.category_id);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    return request<Activity[]>(`/api/activities?${q.toString()}`);
  },

  async createActivity(data: Partial<Activity>) {
    return request<{ activity: Activity; warning?: string | null }>('/api/activities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateActivity(id: string, data: Partial<Activity>) {
    return request<Activity>(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async updateActivityStatus(id: string, status: Activity['status']) {
    return request<Activity>(`/api/activities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async deleteActivity(id: string) {
    return request<{ success: boolean }>(`/api/activities/${id}`, {
      method: 'DELETE'
    });
  },

  // Categories
  async getCategories() {
    return request<Category[]>('/api/categories');
  },

  async createCategory(data: Partial<Category>) {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Habits
  async getHabits() {
    return request<{ habits: Habit[]; week_dates: string[]; today: string }>('/api/habits');
  },

  async createHabit(data: Partial<Habit>) {
    return request<Habit>('/api/habits', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async toggleHabit(id: string, date?: string) {
    return request<{ success: boolean; completed: boolean; habit_id: string; date: string }>(
      `/api/habits/${id}/toggle`,
      {
        method: 'POST',
        body: JSON.stringify({ date })
      }
    );
  },

  async getHabitHeatmap() {
    return request<{
      heatmap: HabitHeatmapDay[];
      activeCheckinRate: number;
      activeDays: number;
      totalDays: number;
    }>('/api/habits/heatmap');
  },

  // Analytics
  async getDashboardSummary(date?: string) {
    const q = date ? `?date=${date}` : '';
    return request<DashboardSummary>(`/api/analytics/dashboard${q}`);
  },

  async getStreaks(date?: string) {
    const q = date ? `?date=${date}` : '';
    return request<StreakSystemData>(`/api/analytics/streaks${q}`);
  },

  async getImprovingComparison(range: 'week' | 'month' | 'day' = 'week') {
    return request<ImprovingComparison>(`/api/analytics/improving?range=${range}`);
  },

  async getDistribution() {
    return request<DistributionData>('/api/analytics/distribution');
  },

  async getInsights() {
    return request<{ hasData: boolean; insights: BioInsight[]; message?: string }>('/api/analytics/insights');
  },

  // Reflections
  async getReflection(date: string) {
    return request<DailyReflection | null>(`/api/reflections/${date}`);
  },

  async saveReflection(reflection: Partial<DailyReflection>) {
    return request<DailyReflection>('/api/reflections', {
      method: 'POST',
      body: JSON.stringify(reflection)
    });
  },

  async getReflectionsList() {
    return request<DailyReflection[]>('/api/reflections');
  },

  // Schedule optimizer
  async optimizeSchedule(date?: string) {
    return request<{ success: boolean; message: string; optimizedCount: number }>('/api/schedule/optimize', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
  }
};
