// Reference training programs. These are the published structures of well-known
// routines, not invented filler — the exercise, set and rep prescriptions are
// what each program actually calls for.
//
// `day_index` is the position in the program's rotation, so "today's session"
// can be derived from the start date instead of being hardcoded.

export const PROGRAMS = [
  {
    slug: 'push-pull-legs',
    name: 'Push / Pull / Legs',
    emoji: '💪',
    level: 'intermediate',
    days_per_week: 6,
    accent: '#00E5A0',
    description:
      'Six sessions a week split by movement pattern, each muscle group trained twice. The standard intermediate hypertrophy split.',
    days: [
      {
        label: 'Push A — Chest focus',
        exercises: [
          { name: 'Barbell bench press', muscle: 'Chest', sets: 4, reps: '6-8' },
          { name: 'Overhead press', muscle: 'Shoulders', sets: 3, reps: '8-10' },
          { name: 'Incline dumbbell press', muscle: 'Chest', sets: 3, reps: '10-12' },
          { name: 'Lateral raise', muscle: 'Shoulders', sets: 3, reps: '12-15' },
          { name: 'Triceps pushdown', muscle: 'Triceps', sets: 3, reps: '10-12' },
          { name: 'Overhead triceps extension', muscle: 'Triceps', sets: 3, reps: '12-15' }
        ]
      },
      {
        label: 'Pull A — Back thickness',
        exercises: [
          { name: 'Deadlift', muscle: 'Back', sets: 3, reps: '5' },
          { name: 'Pull-up', muscle: 'Back', sets: 4, reps: '6-10' },
          { name: 'Barbell row', muscle: 'Back', sets: 3, reps: '8-10' },
          { name: 'Face pull', muscle: 'Rear delts', sets: 3, reps: '15' },
          { name: 'Barbell curl', muscle: 'Biceps', sets: 3, reps: '10-12' },
          { name: 'Hammer curl', muscle: 'Biceps', sets: 3, reps: '12' }
        ]
      },
      {
        label: 'Legs A — Squat focus',
        exercises: [
          { name: 'Back squat', muscle: 'Quads', sets: 4, reps: '6-8' },
          { name: 'Romanian deadlift', muscle: 'Hamstrings', sets: 3, reps: '8-10' },
          { name: 'Leg press', muscle: 'Quads', sets: 3, reps: '12' },
          { name: 'Leg curl', muscle: 'Hamstrings', sets: 3, reps: '12-15' },
          { name: 'Standing calf raise', muscle: 'Calves', sets: 4, reps: '15' }
        ]
      },
      {
        label: 'Push B — Shoulder focus',
        exercises: [
          { name: 'Overhead press', muscle: 'Shoulders', sets: 4, reps: '6-8' },
          { name: 'Incline barbell press', muscle: 'Chest', sets: 3, reps: '8-10' },
          { name: 'Dumbbell shoulder press', muscle: 'Shoulders', sets: 3, reps: '10-12' },
          { name: 'Cable fly', muscle: 'Chest', sets: 3, reps: '12-15' },
          { name: 'Close-grip bench press', muscle: 'Triceps', sets: 3, reps: '8-10' },
          { name: 'Rope pushdown', muscle: 'Triceps', sets: 3, reps: '15' }
        ]
      },
      {
        label: 'Pull B — Back width',
        exercises: [
          { name: 'Lat pulldown', muscle: 'Back', sets: 4, reps: '8-10' },
          { name: 'Seated cable row', muscle: 'Back', sets: 3, reps: '10-12' },
          { name: 'Single-arm dumbbell row', muscle: 'Back', sets: 3, reps: '10' },
          { name: 'Reverse fly', muscle: 'Rear delts', sets: 3, reps: '15' },
          { name: 'Incline dumbbell curl', muscle: 'Biceps', sets: 3, reps: '10-12' },
          { name: 'Cable curl', muscle: 'Biceps', sets: 3, reps: '15' }
        ]
      },
      {
        label: 'Legs B — Posterior chain',
        exercises: [
          { name: 'Front squat', muscle: 'Quads', sets: 4, reps: '6-8' },
          { name: 'Hip thrust', muscle: 'Glutes', sets: 3, reps: '10-12' },
          { name: 'Bulgarian split squat', muscle: 'Quads', sets: 3, reps: '10 each' },
          { name: 'Seated leg curl', muscle: 'Hamstrings', sets: 3, reps: '12-15' },
          { name: 'Seated calf raise', muscle: 'Calves', sets: 4, reps: '15-20' }
        ]
      }
    ]
  },
  {
    slug: 'starting-strength',
    name: 'Starting Strength',
    emoji: '🏋️',
    level: 'beginner',
    days_per_week: 3,
    accent: '#4A9EFF',
    description:
      "Rippetoe's linear-progression barbell novice program: two alternating full-body sessions, three days a week, adding weight every session.",
    days: [
      {
        label: 'Workout A',
        exercises: [
          { name: 'Back squat', muscle: 'Quads', sets: 3, reps: '5' },
          { name: 'Barbell bench press', muscle: 'Chest', sets: 3, reps: '5' },
          { name: 'Deadlift', muscle: 'Back', sets: 1, reps: '5' }
        ]
      },
      {
        label: 'Workout B',
        exercises: [
          { name: 'Back squat', muscle: 'Quads', sets: 3, reps: '5' },
          { name: 'Overhead press', muscle: 'Shoulders', sets: 3, reps: '5' },
          { name: 'Power clean', muscle: 'Full body', sets: 5, reps: '3' }
        ]
      },
      {
        label: 'Workout A (repeat)',
        exercises: [
          { name: 'Back squat', muscle: 'Quads', sets: 3, reps: '5' },
          { name: 'Barbell bench press', muscle: 'Chest', sets: 3, reps: '5' },
          { name: 'Deadlift', muscle: 'Back', sets: 1, reps: '5' }
        ]
      }
    ]
  },
  {
    slug: 'full-body-mobility',
    name: 'Full Body + Mobility',
    emoji: '🧘',
    level: 'beginner',
    days_per_week: 3,
    accent: '#6C63FF',
    description:
      'Three full-body sessions a week using machines and dumbbells, each finishing with mobility work. Built for a return to training after a layoff.',
    days: [
      {
        label: 'Full body A',
        exercises: [
          { name: 'Goblet squat', muscle: 'Quads', sets: 3, reps: '10-12' },
          { name: 'Dumbbell bench press', muscle: 'Chest', sets: 3, reps: '10-12' },
          { name: 'Lat pulldown', muscle: 'Back', sets: 3, reps: '12' },
          { name: 'Plank', muscle: 'Core', sets: 3, reps: '45s' },
          { name: 'Hip flexor stretch', muscle: 'Mobility', sets: 2, reps: '60s each' }
        ]
      },
      {
        label: 'Full body B',
        exercises: [
          { name: 'Romanian deadlift', muscle: 'Hamstrings', sets: 3, reps: '10' },
          { name: 'Dumbbell shoulder press', muscle: 'Shoulders', sets: 3, reps: '10-12' },
          { name: 'Seated cable row', muscle: 'Back', sets: 3, reps: '12' },
          { name: 'Dead bug', muscle: 'Core', sets: 3, reps: '10 each' },
          { name: 'Thoracic rotation', muscle: 'Mobility', sets: 2, reps: '10 each' }
        ]
      },
      {
        label: 'Full body C',
        exercises: [
          { name: 'Leg press', muscle: 'Quads', sets: 3, reps: '12-15' },
          { name: 'Incline dumbbell press', muscle: 'Chest', sets: 3, reps: '12' },
          { name: 'Assisted pull-up', muscle: 'Back', sets: 3, reps: '8-10' },
          { name: 'Side plank', muscle: 'Core', sets: 3, reps: '30s each' },
          { name: 'Ankle mobility drill', muscle: 'Mobility', sets: 2, reps: '10 each' }
        ]
      }
    ]
  },
  {
    slug: 'hiit-conditioning',
    name: 'HIIT & Conditioning',
    emoji: '🔥',
    level: 'advanced',
    days_per_week: 4,
    accent: '#FF6B35',
    description:
      'Four conditioning sessions a week alternating intervals and circuits, for athletes who already have a strength base.',
    days: [
      {
        label: 'Intervals — bike',
        exercises: [
          { name: 'Assault bike sprint', muscle: 'Conditioning', sets: 8, reps: '30s on / 90s off' },
          { name: 'Cool-down spin', muscle: 'Conditioning', sets: 1, reps: '5 min' }
        ]
      },
      {
        label: 'Circuit — full body',
        exercises: [
          { name: 'Kettlebell swing', muscle: 'Posterior chain', sets: 5, reps: '20' },
          { name: 'Burpee', muscle: 'Full body', sets: 5, reps: '12' },
          { name: 'Box jump', muscle: 'Legs', sets: 5, reps: '10' },
          { name: 'Battle rope', muscle: 'Conditioning', sets: 5, reps: '30s' }
        ]
      },
      {
        label: 'Intervals — running',
        exercises: [
          { name: 'Track 400 m repeat', muscle: 'Conditioning', sets: 6, reps: '400m' },
          { name: 'Walk recovery', muscle: 'Conditioning', sets: 6, reps: '2 min' }
        ]
      },
      {
        label: 'Circuit — carries and core',
        exercises: [
          { name: "Farmer's carry", muscle: 'Full body', sets: 4, reps: '40m' },
          { name: 'Sled push', muscle: 'Legs', sets: 4, reps: '20m' },
          { name: 'Hanging leg raise', muscle: 'Core', sets: 4, reps: '12' },
          { name: 'Russian twist', muscle: 'Core', sets: 4, reps: '20' }
        ]
      }
    ]
  },
  {
    slug: '5k-runner',
    name: '5K Runner Plan',
    emoji: '🏃',
    level: 'beginner',
    days_per_week: 5,
    accent: '#FFD700',
    description:
      'A run/walk progression from zero to a continuous 5K, with two rest-adjacent days for cross-training and mobility.',
    days: [
      {
        label: 'Run / walk intervals',
        exercises: [
          { name: 'Brisk walk warm-up', muscle: 'Conditioning', sets: 1, reps: '5 min' },
          { name: 'Run', muscle: 'Conditioning', sets: 8, reps: '60s' },
          { name: 'Walk recovery', muscle: 'Conditioning', sets: 8, reps: '90s' }
        ]
      },
      {
        label: 'Cross-training',
        exercises: [
          { name: 'Stationary bike', muscle: 'Conditioning', sets: 1, reps: '30 min' },
          { name: 'Calf raise', muscle: 'Calves', sets: 3, reps: '20' }
        ]
      },
      {
        label: 'Tempo run',
        exercises: [
          { name: 'Easy jog warm-up', muscle: 'Conditioning', sets: 1, reps: '10 min' },
          { name: 'Tempo run', muscle: 'Conditioning', sets: 1, reps: '15 min' },
          { name: 'Cool-down jog', muscle: 'Conditioning', sets: 1, reps: '5 min' }
        ]
      },
      {
        label: 'Strength for runners',
        exercises: [
          { name: 'Single-leg glute bridge', muscle: 'Glutes', sets: 3, reps: '12 each' },
          { name: 'Walking lunge', muscle: 'Quads', sets: 3, reps: '20 steps' },
          { name: 'Calf raise', muscle: 'Calves', sets: 3, reps: '20' },
          { name: 'Plank', muscle: 'Core', sets: 3, reps: '45s' }
        ]
      },
      {
        label: 'Long slow run',
        exercises: [{ name: 'Easy-pace run', muscle: 'Conditioning', sets: 1, reps: '35-45 min' }]
      }
    ]
  },
  {
    slug: 'calisthenics-basics',
    name: 'Calisthenics Basics',
    emoji: '🤸',
    level: 'beginner',
    days_per_week: 4,
    accent: '#FF4D8D',
    description:
      'Bodyweight progressions toward the pull-up, dip and pistol squat. No equipment beyond a bar.',
    days: [
      {
        label: 'Push day',
        exercises: [
          { name: 'Push-up progression', muscle: 'Chest', sets: 4, reps: '8-12' },
          { name: 'Pike push-up', muscle: 'Shoulders', sets: 3, reps: '8-10' },
          { name: 'Dip progression', muscle: 'Triceps', sets: 3, reps: '6-10' },
          { name: 'Hollow body hold', muscle: 'Core', sets: 3, reps: '30s' }
        ]
      },
      {
        label: 'Pull day',
        exercises: [
          { name: 'Australian row', muscle: 'Back', sets: 4, reps: '10-12' },
          { name: 'Negative pull-up', muscle: 'Back', sets: 4, reps: '5' },
          { name: 'Scapular pull-up', muscle: 'Back', sets: 3, reps: '10' },
          { name: 'Hanging knee raise', muscle: 'Core', sets: 3, reps: '12' }
        ]
      },
      {
        label: 'Legs day',
        exercises: [
          { name: 'Bodyweight squat', muscle: 'Quads', sets: 4, reps: '20' },
          { name: 'Split squat', muscle: 'Quads', sets: 3, reps: '12 each' },
          { name: 'Nordic curl negative', muscle: 'Hamstrings', sets: 3, reps: '5' },
          { name: 'Single-leg calf raise', muscle: 'Calves', sets: 3, reps: '15 each' }
        ]
      },
      {
        label: 'Skills and core',
        exercises: [
          { name: 'Handstand wall hold', muscle: 'Shoulders', sets: 4, reps: '30s' },
          { name: 'L-sit progression', muscle: 'Core', sets: 4, reps: '20s' },
          { name: 'Tuck front lever hold', muscle: 'Back', sets: 4, reps: '15s' },
          { name: 'Wrist mobility drill', muscle: 'Mobility', sets: 2, reps: '60s' }
        ]
      }
    ]
  }
];
