// Every API call the app makes, in one place. Components import from here
// rather than assembling URLs, so a route change is a one-line edit.
import { api } from './client.js';

export const auth = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (payload) => api.post('/auth/change-password', payload)
};

export const users = {
  profile: () => api.get('/users/me'),
  updateProfile: (patch) => api.patch('/users/me', patch),
  recalculateTargets: () => api.post('/users/me/recalculate-targets'),
  exportUrl: () => `${import.meta.env.VITE_API_URL || '/api'}/users/me/export`,
  deleteAccount: (confirm) => api.delete('/users/me', undefined, { confirm })
};

export const summary = {
  dashboard: () => api.get('/summary/dashboard'),
  daily: (date) => api.get('/summary', { date }),
  series: (days) => api.get('/summary/series', { days }),
  streak: () => api.get('/summary/streak'),
  adherence: (days) => api.get('/summary/adherence', { days })
};

export const meals = {
  list: (params) => api.get('/meals', params),
  frequent: () => api.get('/meals/frequent'),
  create: (payload) => api.post('/meals', payload),
  update: (id, patch) => api.patch(`/meals/${id}`, patch),
  remove: (id) => api.delete(`/meals/${id}`)
};

export const foods = {
  search: (q, limit, signal) => api.get('/foods/search', { q, limit }, signal),
  stats: () => api.get('/foods/stats'),
  create: (payload) => api.post('/foods', payload),
  remove: (id) => api.delete(`/foods/${id}`)
};

export const water = {
  get: (date) => api.get('/water', { date }),
  add: (amount_ml) => api.post('/water', { amount_ml }),
  undo: (date) => api.delete('/water/last', { date })
};

export const weight = {
  list: (params) => api.get('/weight', params),
  trend: (days) => api.get('/weight/trend', { days }),
  create: (payload) => api.post('/weight', payload),
  remove: (id) => api.delete(`/weight/${id}`)
};

export const goals = {
  list: (params) => api.get('/goals', params),
  create: (payload) => api.post('/goals', payload),
  update: (id, patch) => api.patch(`/goals/${id}`, patch),
  remove: (id) => api.delete(`/goals/${id}`)
};

export const workouts = {
  list: (params) => api.get('/workouts', params),
  stats: (days) => api.get('/workouts/stats', { days }),
  today: () => api.get('/workouts/today'),
  create: (payload) => api.post('/workouts', payload),
  remove: (id) => api.delete(`/workouts/${id}`),
  toggleSet: (workoutId, setId, completed) => api.patch(`/workouts/${workoutId}/sets/${setId}`, { completed })
};

export const programs = {
  list: () => api.get('/programs'),
  select: (programId) => api.post(`/programs/${programId}/select`)
};

export const tdee = {
  calculate: (params) => api.get('/tdee', params)
};
