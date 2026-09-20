import { pg } from './db.ts';

export async function seedMayaDemoData(userId: string) {
  console.log('Seeding Maya demonstration dataset for user:', userId);

  // Clear existing data for this user
  await pg.query('DELETE FROM activities WHERE user_id = $1', [userId]);
  await pg.query('DELETE FROM habits WHERE user_id = $1', [userId]);
  await pg.query('DELETE FROM habit_completions WHERE user_id = $1', [userId]);
  await pg.query('DELETE FROM daily_reflections WHERE user_id = $1', [userId]);
  await pg.query('DELETE FROM categories WHERE user_id = $1', [userId]);

  // Categories
  const categories = [
    { id: `cat_health_${userId}`, name: 'Health', icon: 'self_improvement', color: '#06B6D4', description: 'Mindfulness & physical recovery' },
    { id: `cat_work_${userId}`, name: 'Work', icon: 'laptop', color: '#8B5CF6', description: 'Deep architecture and engineering' },
    { id: `cat_fitness_${userId}`, name: 'Fitness', icon: 'directions_run', color: '#F59E0B', description: 'VO2 intervals and functional strength' },
    { id: `cat_study_${userId}`, name: 'Study', icon: 'menu_book', color: '#3B82F6', description: 'Novel systems research & reading' },
    { id: `cat_personal_${userId}`, name: 'Personal', icon: 'person', color: '#EC4899', description: 'Mindful decompression & life ops' },
    { id: `cat_projects_${userId}`, name: 'Projects', icon: 'folder_open', color: '#10B981', description: 'Sprint sync & roadmap builds' },
    { id: `cat_routine_${userId}`, name: 'Routine', icon: 'psychology', color: '#A855F7', description: 'Daily mental clarity and debriefs' },
  ];

  for (const c of categories) {
    await pg.query(
      `INSERT INTO categories (id, user_id, name, icon, color, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [c.id, userId, c.name, c.icon, c.color, c.description]
    );
  }

  // Calculate dates for past 30 days up to today
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // 5 Signature Habits
  const habits = [
    { id: `hab_1_${userId}`, name: 'Morning Meditation (15m)', category_id: `cat_health_${userId}`, target: 7, streak: 7 },
    { id: `hab_2_${userId}`, name: 'Deep Reading (30m)', category_id: `cat_personal_${userId}`, target: 7, streak: 5 },
    { id: `hab_3_${userId}`, name: 'Daily 10k Steps / Cardio', category_id: `cat_fitness_${userId}`, target: 7, streak: 12 },
    { id: `hab_4_${userId}`, name: 'Evening Brain Dump & Reflection', category_id: `cat_routine_${userId}`, target: 7, streak: 7 },
    { id: `hab_5_${userId}`, name: 'Zero Sugar After 8 PM', category_id: `cat_health_${userId}`, target: 7, streak: 4 },
  ];

  for (const h of habits) {
    await pg.query(
      `INSERT INTO habits (id, user_id, category_id, name, frequency, target_days_per_week, start_date, is_active)
       VALUES ($1, $2, $3, $4, 'daily', $5, $6, TRUE)`,
      [h.id, userId, h.category_id, h.name, h.target, '2026-08-01']
    );

    // Populate habit completions for the past 30 days with high consistency (matching heatmap & weekly matrix)
    for (let i = 0; i < 30; i++) {
      const pastDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const pStr = pastDate.toISOString().split('T')[0];
      const dayOfWeek = pastDate.getDay(); // 0 is Sunday, 3 is Wed

      let complete = true;
      // Habit 2 misses Wed and today pending
      if (h.name.includes('Deep Reading')) {
        if (dayOfWeek === 3 || i === 0) complete = false;
      }
      // Habit 5 misses Mon, Tue, Wed
      if (h.name.includes('Zero Sugar')) {
        if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3) complete = false;
      }

      // Random small miss in week 3 for realism
      if (i === 18 || i === 6) complete = false;

      if (complete) {
        await pg.query(
          `INSERT INTO habit_completions (id, habit_id, user_id, date, completed_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [`comp_${h.id}_${pStr}`, h.id, userId, pStr]
        );
      }
    }
  }

  // Today's schedule activities (matching Image 5 and 7!)
  const todayActivities = [
    {
      id: `act_1_${userId}`,
      title: 'Morning Sun & Hydration Routine',
      category_id: `cat_health_${userId}`,
      description: 'Hydration & early optical daylight protocol. 1L water with sea salt and lemon.',
      date: dateStr,
      start_time: '07:00',
      end_time: '07:45',
      duration_minutes: 45,
      priority: 'high',
      status: 'completed',
      mood: 'Serene',
      energy_level: 'Rising (60%)',
      notes: '1L water with sea salt and fresh lemon. 20 min direct retino-hypothalamic daylight protocol on terrace.'
    },
    {
      id: `act_2_${userId}`,
      title: 'Deep System Architecture Design',
      category_id: `cat_work_${userId}`,
      description: 'No-distraction monad implementation. Telemetry event loop schema.',
      date: dateStr,
      start_time: '08:00',
      end_time: '09:30',
      duration_minutes: 90,
      priority: 'high',
      status: 'completed',
      mood: 'Hyper-Focus',
      energy_level: 'Peak (95%)',
      notes: 'Completed unified telemetry event loop schema. Documented state machine invariants and memory boundaries.'
    },
    {
      id: `act_3_${userId}`,
      title: 'High-Intensity Functional Training',
      category_id: `cat_fitness_${userId}`,
      description: 'Heart rate zone 4/5 VO2 interval block. Kettlebell complex.',
      date: dateStr,
      start_time: '10:00',
      end_time: '10:45',
      duration_minutes: 45,
      priority: 'medium',
      status: 'completed',
      mood: 'Pumped',
      energy_level: 'High (85%)',
      notes: 'Kettlebell complex: 5 rounds of clean & press, pull-ups, assault bike sprints. HR max 174 bpm.'
    },
    {
      id: `act_4_${userId}`,
      title: 'Sprint Sync & Product Architecture',
      category_id: `cat_projects_${userId}`,
      description: 'Schema telemetry validation & reactive store sync with core engineering team.',
      date: dateStr,
      start_time: '11:30',
      end_time: '12:45',
      duration_minutes: 75,
      priority: 'high',
      status: 'in_progress',
      mood: 'Collaborative',
      energy_level: 'Sustained High (80%)',
      notes: 'Reviewing Q3 architectural bottlenecks. Focus strictly on API gateway thread contention and latency traces.'
    },
    {
      id: `act_5_${userId}`,
      title: 'Mindful Nutrition & Break',
      category_id: `cat_personal_${userId}`,
      description: 'Cognitive decompression interval and healthy nutrition.',
      date: dateStr,
      start_time: '13:00',
      end_time: '14:00',
      duration_minutes: 60,
      priority: 'medium',
      status: 'planned',
      mood: 'Mindful',
      energy_level: 'Replenishing',
      notes: 'High-protein, low glycemic lunch. 15 minutes offline stroll without smartphone or wearables.'
    },
    {
      id: `act_6_${userId}`,
      title: 'Machine Learning Systems Paper',
      category_id: `cat_study_${userId}`,
      description: 'Deep review of novel kernel architectures and memory access patterns.',
      date: dateStr,
      start_time: '15:00',
      end_time: '16:30',
      duration_minutes: 90,
      priority: 'medium',
      status: 'planned',
      mood: 'Analytical',
      energy_level: 'Deep Cognitive',
      notes: 'Analyze FlashAttention-3 algorithm paper and Triton kernel memory access patterns.'
    },
    {
      id: `act_7_${userId}`,
      title: 'Daily Reading: Atomic Habits',
      category_id: `cat_health_${userId}`,
      description: '20 pages reflective pacing and journaling.',
      date: dateStr,
      start_time: '18:00',
      end_time: '18:30',
      duration_minutes: 30,
      priority: 'low',
      status: 'planned',
      mood: 'Reflective',
      energy_level: 'Wind Down',
      notes: 'Read Chapter 9: The Role of Family and Friends in Shaping Your Habits. Highlight and journal 1 takeaway.'
    }
  ];

  for (const a of todayActivities) {
    await pg.query(
      `INSERT INTO activities (id, user_id, category_id, title, description, date, start_time, end_time, duration_minutes, priority, status, mood, energy_level, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [a.id, userId, a.category_id, a.title, a.description, a.date, a.start_time, a.end_time, a.duration_minutes, a.priority, a.status, a.mood, a.energy_level, a.notes]
    );
  }

  // Populate past 14 days of historical activities so charts & "AM I IMPROVING?" have genuine historical records
  for (let d = 1; d <= 14; d++) {
    const pastDate = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
    const pStr = pastDate.toISOString().split('T')[0];

    // 4 to 5 activities per day
    const pastActs = [
      { title: 'Morning Focus & Solar Protocol', cat: `cat_health_${userId}`, dur: 45, status: 'completed' },
      { title: 'System Engine Coding', cat: `cat_work_${userId}`, dur: 120, status: 'completed' },
      { title: 'Strength Training / Cardio', cat: `cat_fitness_${userId}`, dur: 60, status: 'completed' },
      { title: 'Technical Research Paper', cat: `cat_study_${userId}`, dur: 90, status: d === 8 ? 'missed' : 'completed' },
      { title: 'Evening Reading & Reflection', cat: `cat_routine_${userId}`, dur: 30, status: 'completed' }
    ];

    for (let idx = 0; idx < pastActs.length; idx++) {
      const pa = pastActs[idx];
      await pg.query(
        `INSERT INTO activities (id, user_id, category_id, title, description, date, duration_minutes, status, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'medium')`,
        [`past_${userId}_${d}_${idx}`, userId, pa.cat, pa.title, 'Historical focus session', pStr, pa.dur, pa.status]
      );
    }
  }

  // Add 1 historical evening reflection
  const ystd = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await pg.query(
    `INSERT INTO daily_reflections (id, user_id, date, went_well, was_difficult, to_improve, grateful_for, tomorrow_priority, mood_rating, energy_rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 9, 8)
     ON CONFLICT DO NOTHING`,
    [
      `refl_${userId}_${ystd}`,
      userId,
      ystd,
      'Maintained deep uninterrupted focus during morning architecture session. Locked all planned habits.',
      'Slight afternoon energy dip around 15:30. Stared at the monitor a bit too long.',
      'Take a brisk 10-minute sunlight stroll before the 15:00 study block.',
      'Clean workspace, high-clarity telemetry, and supportive teammates.',
      'Finalize sprint backlog and complete high-intensity VO2 interval.',
    ]
  );

  console.log('Seeding Maya demo data complete!');
}
