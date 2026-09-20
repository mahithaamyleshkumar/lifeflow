import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pg } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'lifeflow_secure_jwt_token_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
}

export function generateToken(payload: { id: string; email: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    const userRes = await pg.query('SELECT id, name, email, avatar_url, timezone FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = userRes.rows[0] as any;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function seedDefaultCategories(userId: string) {
  const defaultCats = [
    { name: 'Health', icon: 'self_improvement', color: '#06B6D4', description: 'Mindfulness, sleep, hydration and physical recovery' },
    { name: 'Work', icon: 'laptop', color: '#8B5CF6', description: 'Engineering, deep problem solving and career focus' },
    { name: 'Fitness', icon: 'directions_run', color: '#F59E0B', description: 'Strength, cardio, VO2 intervals and mobility' },
    { name: 'Study', icon: 'menu_book', color: '#3B82F6', description: 'Reading, learning research and skill acquisition' },
    { name: 'Personal', icon: 'person', color: '#EC4899', description: 'Decompression, friends, relationships and life ops' },
    { name: 'Projects', icon: 'folder_open', color: '#10B981', description: 'Creative and high craft technical initiatives' },
    { name: 'Sleep', icon: 'bedtime', color: '#6366F1', description: 'Circadian alignment and restorative wind-down' },
    { name: 'Hobbies', icon: 'palette', color: '#F97316', description: 'Passions, creative experiments and art' },
    { name: 'Other', icon: 'more_horiz', color: '#94A3B8', description: 'General reminders and misc activities' }
  ];

  for (const cat of defaultCats) {
    const id = `cat_${Math.random().toString(36).substring(2, 9)}`;
    await pg.query(
      `INSERT INTO categories (id, user_id, name, icon, color, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [id, userId, cat.name, cat.icon, cat.color, cat.description]
    );
  }
}
