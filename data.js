// =====================
// FITNESS TRACKER DATA
// =====================

const FOOD_DB = [
  { name: 'Grilled chicken breast',   emoji:'🍗', cal:165,  protein:31,   carbs:0,    fat:3.6,  per:'100g' },
  { name: 'Cooked white rice',  emoji:'🍚', cal:206,  protein:4.3,  carbs:44.5, fat:0.4,  per:'100g' },
  { name: 'Boiled eggs',        emoji:'🥚', cal:155,  protein:13,   carbs:1.1,  fat:11,   per:'100g' },
  { name: 'Toast bread',         emoji:'🍞', cal:265,  protein:9,    carbs:49,   fat:3.2,  per:'100g' },
  { name: 'Banana',              emoji:'🍌', cal:89,   protein:1.1,  carbs:23,   fat:0.3,  per:'100g' },
  { name: 'Apple',             emoji:'🍎', cal:52,   protein:0.3,  carbs:14,   fat:0.2,  per:'100g' },
  { name: 'Cow milk',         emoji:'🥛', cal:61,   protein:3.2,  carbs:4.8,  fat:3.3,  per:'100ml' },
  { name: 'Plain yogurt',       emoji:'🥣', cal:59,   protein:3.5,  carbs:5,    fat:3.3,  per:'100g' },
  { name: 'Salmon',        emoji:'🐟', cal:208,  protein:20,   carbs:0,    fat:13,   per:'100g' },
  { name: 'Cooked lentils',        emoji:'🫘', cal:116,  protein:9,    carbs:20,   fat:0.4,  per:'100g' },
  { name: 'Beef',         emoji:'🥩', cal:217,  protein:26,   carbs:0,    fat:12,   per:'100g' },
  { name: 'Walnuts',              emoji:'🥜', cal:654,  protein:15,   carbs:14,   fat:65,   per:'100g' },
  { name: 'Avocado',          emoji:'🥑', cal:160,  protein:2,    carbs:9,    fat:15,   per:'100g' },
  { name: 'Roasted potato',      emoji:'🥔', cal:77,   protein:2,    carbs:17,   fat:0.1,  per:'100g' },
  { name: 'Oatmeal',            emoji:'🥣', cal:389,  protein:17,   carbs:66,   fat:7,    per:'100g' },
  { name: 'Chocolate cake',     emoji:'🎂', cal:371,  protein:5,    carbs:52,   fat:17,   per:'100g' },
  { name: 'Green salad',       emoji:'🥗', cal:20,   protein:1.5,  carbs:3,    fat:0.3,  per:'100g' },
  { name: 'Cooked pasta',    emoji:'🍝', cal:131,  protein:5,    carbs:25,   fat:1.1,  per:'100g' },
  { name: 'Coca-Cola',        emoji:'🥤', cal:42,   protein:0,    carbs:11,   fat:0,    per:'100ml' },
  { name: 'Orange juice',      emoji:'🍊', cal:45,   protein:0.7,  carbs:10,   fat:0.2,  per:'100ml' },
  { name: 'Canned tuna',       emoji:'🐠', cal:132,  protein:29,   carbs:0,    fat:1,    per:'100g' },
  { name: 'Olive oil',        emoji:'🫒', cal:884,  protein:0,    carbs:0,    fat:100,  per:'100ml' },
  { name: 'Foul medames',         emoji:'🫘', cal:110,  protein:7.6,  carbs:19,   fat:0.4,  per:'100g' },
  { name: 'Cottage cheese',        emoji:'🧀', cal:98,   protein:11,   carbs:3.4,  fat:4.3,  per:'100g' },
  { name: 'Whey protein',       emoji:'💪', cal:120,  protein:24,   carbs:3,    fat:2,    per:'30g scoop' },
  { name: 'Tomato',            emoji:'🍅', cal:18,   protein:0.9,  carbs:3.9,  fat:0.2,  per:'100g' },
  { name: 'Cucumber',             emoji:'🥒', cal:15,   protein:0.7,  carbs:3.6,  fat:0.1,  per:'100g' },
  { name: 'Hummus',       emoji:'🫙', cal:166,  protein:7.9,  carbs:14,   fat:9.6,  per:'100g' },
];

const WORKOUT_PROGRAMS = [
  { emoji: '💪', name: 'PPL – Push Pull Legs', days: '6 days / week', tag: 'Intermediate',   color: '#00E5A0' },
  { emoji: '🏋️', name: 'Starting Strength',     days: '3 days / week', tag: 'Beginner',   color: '#4A9EFF' },
  { emoji: '🔥', name: 'HIIT & Cardio',          days: '4 days / week', tag: 'Advanced',   color: '#FF6B35' },
  { emoji: '🧘', name: 'Full Body + Mobility',   days: '3 days / week', tag: 'Beginner',   color: '#6C63FF' },
  { emoji: '🏃', name: '5K Runner Plan',         days: '5 days / week', tag: 'Intermediate',   color: '#FFD700' },
  { emoji: '🤸', name: 'Calisthenics Basics',   days: '4 days / week', tag: 'Beginner',   color: '#FF4D8D' },
];

const EXERCISES_TODAY = [
  { name: 'Barbell Chest Press',   sets: '4×8 @ 80kg',  done: true,  muscle: 'Chest' },
  { name: 'Incline Dumbbell Press',     sets: '3×10 @ 22kg', done: true,  muscle: 'Chest' },
  { name: 'Cable fly',        sets: '3×12',         done: false, muscle: 'Chest' },
  { name: 'Ground tricep pull',   sets: '3×10',         done: false, muscle: 'Triceps' },
  { name: 'Dumbbell tricep',        sets: '4×12 @ 16kg', done: false, muscle: 'Triceps' },
];

const WEEKLY_DATA = {
  labels: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  eaten:  [1820, 2100, 1650, 1900, 2050, 1750, 1480],
  burned: [320,  450,  280,  500,  0,    350,  200],
  goal:   [2000, 2000, 2000, 2000, 2000, 2000, 2000],
};

const WEIGHT_DATA = {
  labels:  ['January','February','March','April','May'],
  weights: [87.0, 85.5, 84.2, 83.1, 82.5],
};

// ─── MACRO HISTORY (7 days) ───────────────────
const MACRO_HISTORY = {
  labels:  ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  protein: [120, 148, 102, 135, 158, 112, 98],
  carbs:   [200, 220, 165, 195, 215, 178, 180],
  fat:     [55,  70,  48,  60,  72,  52,  42],
};

let state = {
  meals: [
    { id:1, name:'Oats with milk', emoji:'🥣', type:'breakfast', cal:310, protein:12, carbs:48, fat:7 },
    { id:2, name:'Chicken breast and rice', emoji:'🍗', type:'lunch', cal:580, protein:52, carbs:64, fat:8 },
    { id:3, name:'Boiled eggs ×3', emoji:'🥚', type:'snack', cal:210, protein:18, carbs:2, fat:14 },
    { id:4, name:'Grilled salmon', emoji:'🐟', type:'dinner', cal:380, protein:34, carbs:5, fat:22 },
  ],
  goals: [
    { id:1, icon:'⚖️', name:'Reach 77 kg', current:82.5, target:77, deadline:'2025-08-01', unit:'kg', lower:true },
    { id:2, icon:'💪', name:'Bench 100kg', current:80, target:100, deadline:'2025-09-01', unit:'kg', lower:false },
    { id:3, icon:'🏃', name:'10km in 50 min', current:62, target:50, deadline:'2025-07-01', unit:'min', lower:true },
    { id:4, icon:'🔥', name:'Burn 300 kcal daily', current:220, target:300, deadline:'2025-06-15', unit:'kcal', lower:false },
  ],
  workouts: [],
  water: 1.8,
  selectedMealType: 'breakfast',
  selectedGoalIcon: '🏋️',
  calorieGoal: 2000,
  streak: 12,
  steps: 7420,
  activeProgram: null,
  theme: 'dark',
  notifications: [
    { id:1, text:'Drink a glass of water 💧', time:'10 minutes ago', read:false },
    { id:2, text:'Your workout is in one hour 🏋️', time:'30 minutes ago', read:false },
    { id:3, text:"You reached 80% of today's protein goal 💪", time:'1 hour ago', read:true },
  ],
};
