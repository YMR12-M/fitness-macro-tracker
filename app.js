// =====================
// FITTRACK PRO — APP LOGIC v2
// =====================

const API_BASE = '/api';
const CURRENT_USER_ID = 1;
let useBackend = false; // starts local; auto-enables if backend responds
const LOCAL_DATE = new Date().toISOString().split('T')[0];

// ─── API LAYER ────────────────────────────────
async function apiRequest(path, options = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    if (useBackend) { useBackend = false; showToast('App is running locally'); updateApiStatus(); }
    return null;
  }
}
const postJson = (path, data) => apiRequest(path, { method:'POST', body: JSON.stringify(data) });
const deleteResource = (path) => apiRequest(path, { method:'DELETE' });

// Probe backend on load
async function probeBackend() {
  const r = await apiRequest('/summary?user_id=1');
  if (r) { useBackend = true; await loadBackendData(); }
  updateApiStatus();
}

function updateApiStatus() {
  const dot = document.getElementById('apiDot');
  const label = document.getElementById('apiStatus');
  if (dot)   dot.style.background = useBackend ? 'var(--green)' : 'var(--orange)';
  if (label) label.textContent = useBackend ? 'Connected to server' : 'Running locally (server unreachable)';
}

async function loadBackendData() {
  if (!useBackend) return;
  const [meals, goals, weightEntries] = await Promise.all([
    apiRequest(`/meals?user_id=${CURRENT_USER_ID}&log_date=${LOCAL_DATE}`),
    apiRequest(`/goals?user_id=${CURRENT_USER_ID}`),
    apiRequest(`/weight?user_id=${CURRENT_USER_ID}`),
  ]);
  if (meals)   state.meals  = meals.map(m  => ({ id:m.id, name:m.name, emoji:m.emoji, type:m.meal_type, cal:m.calories, protein:m.protein, carbs:m.carbs, fat:m.fat }));
  if (goals)   state.goals  = goals.map(g  => ({ id:g.id, icon:g.icon, name:g.name, current:g.current_value, target:g.target_value, deadline:g.deadline, unit:g.unit, lower:false }));
  if (weightEntries?.entries?.length) {
    WEIGHT_DATA.labels  = weightEntries.entries.map(e => e.date);
    WEIGHT_DATA.weights = weightEntries.entries.map(e => e.weight_kg);
  }
}

// ─── NAVIGATION ──────────────────────────────
let currentPage = 'dashboard';

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  const ni = document.querySelector(`[data-page="${name}"]`);
  if (!pg) return;
  pg.classList.add('active');
  if (ni) ni.classList.add('active');
  currentPage = name;
  document.getElementById('sidebar').classList.remove('open');

  if (name === 'dashboard') { setTimeout(initCharts, 80); }
  if (name === 'progress')  { setTimeout(() => { weightChartInst = initWeightChart(); macroChartInst = initMacroChart(); }, 80); }
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => { e.preventDefault(); showPage(item.dataset.page); });
});

document.getElementById('menuBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Close sidebar on overlay tap (mobile)
document.addEventListener('click', e => {
  const sb = document.getElementById('sidebar');
  if (sb.classList.contains('open') && !sb.contains(e.target) && !document.getElementById('menuBtn').contains(e.target)) {
    sb.classList.remove('open');
  }
});

// ─── DATE ────────────────────────────────────
function setDate() {
  const d = new Date();
  const dateText = d.toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const todayDate = document.getElementById('todayDate');
  if (todayDate) todayDate.textContent = dateText;
  const todayDate2 = document.getElementById('todayDate2');
  if (todayDate2) todayDate2.textContent = dateText;
  const wDate = document.getElementById('wDate');
  if (wDate) wDate.value = LOCAL_DATE;
}

// ─── CALORIE RING ────────────────────────────
function updateRing() {
  const totalEaten   = state.meals.reduce((a,m) => a + m.cal,     0);
  const totalProtein = state.meals.reduce((a,m) => a + m.protein, 0);
  const totalCarbs   = state.meals.reduce((a,m) => a + m.carbs,   0);
  const totalFat     = state.meals.reduce((a,m) => a + m.fat,     0);

  const pct    = Math.min(totalEaten / state.calorieGoal, 1);
  const circumf = 515; // 2π×82
  const offset = circumf - (circumf * pct);
  const arc = document.getElementById('calorieArc');
  if (arc) {
    arc.setAttribute('stroke-dashoffset', offset.toFixed(1));
    arc.setAttribute('stroke', totalEaten > state.calorieGoal ? '#FF6B35' : '#00E5A0');
  }

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('caloriesEaten', totalEaten.toLocaleString('ar'));
  set('caloriesLeft',  Math.max(0, state.calorieGoal - totalEaten).toLocaleString('ar') + ' remaining');
  set('legEaten', totalEaten.toLocaleString('ar'));
  set('ringPercent', Math.round(pct * 100) + '%');

  // Macros progress
  const macroTargets = { protein:150, carbs:200, fat:65 };
  [['proteinVal','proteinPct','proteinBar',Math.round(totalProtein),macroTargets.protein],
   ['carbsVal',  'carbsPct',  'carbsBar',  Math.round(totalCarbs),  macroTargets.carbs],
   ['fatVal',    'fatPct',    'fatBar',    Math.round(totalFat),    macroTargets.fat],
  ].forEach(([valId, pctId, barId, val, target]) => {
    const p = Math.min(Math.round(val / target * 100), 100);
    set(valId, val);
    set(pctId, p + '%');
    const bar = document.getElementById(barId);
    if (bar) { bar.style.width = p + '%'; bar.className = `macro-fill ${barId.replace('Bar','-fill')} ${p >= 100 ? 'over' : ''}`; }
  });

  // Water
  const wPct = Math.min(Math.round(state.water / 2.5 * 100), 100);
  set('waterVal', state.water.toFixed(1));
  set('waterPct', wPct + '%');
  const wb = document.getElementById('waterBar');
  if (wb) wb.style.width = wPct + '%';

  updateDonut();
  renderNetCalories(totalEaten);
}

function renderNetCalories(eaten) {
  const burned = state.workouts.reduce((a,w) => a + (w.calories_burned || 0), 0) || 320;
  const net = eaten - burned;
  const el = document.getElementById('netCalStat') || document.getElementById('netCalories');
  if (el) el.textContent = net.toLocaleString('en') + ' net';
  const lb = document.getElementById('legBurned');
  if (lb) lb.textContent = burned.toLocaleString('ar');
}

// ─── MEALS LIST ──────────────────────────────
function renderMeals() {
  const list = document.getElementById('mealsList');
  if (!list) return;
  const groups = { 'breakfast':[], 'lunch':[], 'dinner':[], 'snack':[] };
  state.meals.forEach(m => (groups[m.type] || groups['snack']).push(m));
  const icons = { 'breakfast':'☀️', 'lunch':'🌤️', 'dinner':'🌙', 'snack':'⚡' };
  list.innerHTML = Object.entries(groups).filter(([,ms]) => ms.length).map(([type, ms]) => {
    const typeTotal = ms.reduce((a,m) => a+m.cal, 0);
    return `
    <div class="meal-group">
      <div class="meal-group-header">
        <span class="meal-group-icon">${icons[type]}</span>
        <span class="meal-group-name">${type}</span>
        <span class="meal-group-total">${typeTotal} kcal</span>
      </div>
      ${ms.map(m => `
        <div class="meal-item" id="meal-${m.id}">
          <span class="meal-emoji">${m.emoji}</span>
          <div class="meal-info">
            <p class="meal-name">${m.name}</p>
            <div class="meal-macro-chips">
              <span class="chip chip-p">P ${m.protein}g</span>
              <span class="chip chip-c">C ${m.carbs}g</span>
              <span class="chip chip-f">F ${m.fat}g</span>
            </div>
          </div>
          <span class="meal-cals">${m.cal}<small>kcal</small></span>
          <button class="del-btn" onclick="deleteMeal(${m.id})" aria-label="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('')}
    </div>`;
  }).join('') || '<div class="empty-state"><span>🍽️</span><p>No meals logged today</p><button class="btn-primary" onclick="showPage(\'log\')">Log your first meal</button></div>';

  const logged = document.getElementById('loggedFoods');
  if (logged) logged.innerHTML = list.innerHTML;
}

async function deleteMeal(id) {
  if (useBackend) await deleteResource(`/meals?id=${id}`);
  state.meals = state.meals.filter(m => m.id !== id);
  renderMeals(); updateRing();
  showToast('Meal deleted successfully');
}

// ─── WATER ───────────────────────────────────
function addWater(amount) {
  state.water = Math.min(+(state.water + amount).toFixed(2), 2.5);
  updateRing();
  // Animate water fill
  const bar = document.getElementById('waterBar');
  if (bar) bar.classList.add('pulse');
  setTimeout(() => bar?.classList.remove('pulse'), 600);
}

// ─── FOOD SEARCH ─────────────────────────────
let searchDebounce;
function searchFood(query) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => _doSearch(query), 150);
}

function _doSearch(query) {
  const results = document.getElementById('searchResults');
  if (!query.trim()) { results.innerHTML = renderQuickAdd(); return; }
  const q = query.toLowerCase();
  const matches = FOOD_DB.filter(f => f.name.includes(q) || f.emoji.includes(query));
  if (!matches.length) {
    results.innerHTML = `<div class="search-empty"><span>🔍</span><p>No results for "${query}"</p><button class="btn-ghost small-btn" onclick="openModal('foodModal')">Add manually</button></div>`;
    return;
  }
  results.innerHTML = `<div class="search-count">${matches.length} result</div>` +
    matches.map(f => `
    <div class="food-result" onclick="addFoodFromDB('${f.name}','${f.emoji}',${f.cal},${f.protein},${f.carbs},${f.fat})">
      <div class="food-result-left">
        <span class="food-result-emoji">${f.emoji}</span>
        <div>
          <p class="food-result-name">${f.name}</p>
          <p class="food-result-meta">${f.per} · P:${f.protein}g · C:${f.carbs}g · F:${f.fat}g</p>
        </div>
      </div>
      <div class="food-result-right">
        <span class="food-result-cal">${f.cal}</span>
        <small>kcal</small>
      </div>
    </div>
  `).join('');
}

function renderQuickAdd() {
  const suggested = FOOD_DB.slice(0, 6);
  return `<p class="search-hint">Quick suggestions:</p>` +
    suggested.map(f => `
    <div class="food-result" onclick="addFoodFromDB('${f.name}','${f.emoji}',${f.cal},${f.protein},${f.carbs},${f.fat})">
      <div class="food-result-left"><span class="food-result-emoji">${f.emoji}</span><div><p class="food-result-name">${f.name}</p><p class="food-result-meta">${f.per}</p></div></div>
      <span class="food-result-cal">${f.cal} kcal</span>
    </div>`).join('');
}

function selectMealType(btn, type) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedMealType = type;
}

async function addFoodFromDB(name, emoji, cal, protein, carbs, fat) {
  const payload = { user_id:CURRENT_USER_ID, name, emoji, meal_type:state.selectedMealType, calories:cal, protein, carbs, fat, date:LOCAL_DATE };
  const created = await postJson('/meals', payload);
  const id = created?.id ?? Date.now();
  state.meals.push({ id, name, emoji, type:state.selectedMealType, cal, protein, carbs, fat });
  renderMeals(); updateRing();
  document.getElementById('foodSearch').value = '';
  document.getElementById('searchResults').innerHTML = renderQuickAdd();
  showToast(`✓ ${name} — ${cal} kcal`);
  showPage('dashboard');
}

// ─── ADD FOOD MODAL ──────────────────────────
document.getElementById('addFoodBtn').addEventListener('click', () => openModal('foodModal'));

async function addFood() {
  const name  = document.getElementById('fName').value.trim();
  const cal   = parseInt(document.getElementById('fCal').value)   || 0;
  const prot  = parseFloat(document.getElementById('fProt').value) || 0;
  const carbs = parseFloat(document.getElementById('fCarbs').value) || 0;
  const fat   = parseFloat(document.getElementById('fFat').value)  || 0;
  const meal  = document.getElementById('fMeal').value;
  if (!name || !cal) { shakeField('fName'); return; }
  const payload = { user_id:CURRENT_USER_ID, name, emoji:'🍽️', meal_type:meal, calories:cal, protein:prot, carbs, fat, date:LOCAL_DATE };
  const created = await postJson('/meals', payload);
  state.meals.push({ id: created?.id ?? Date.now(), name, emoji:'🍽️', type:meal, cal, protein:prot, carbs, fat });
  renderMeals(); updateRing();
  closeModal('foodModal');
  clearForm(['fName','fCal','fProt','fCarbs','fFat']);
  showToast(`✓ ${name} added`);
}

// ─── WORKOUTS ────────────────────────────────
function renderWorkoutPrograms() {
  const cont = document.getElementById('workoutPrograms');
  if (!cont) return;
  cont.innerHTML = WORKOUT_PROGRAMS.map((p, i) => `
    <div class="program-card ${state.activeProgram === i ? 'active-program' : ''}" onclick="selectProgram(${i})" style="--prog-color:${p.color}">
      <div class="program-emoji">${p.emoji}</div>
      <p class="program-name">${p.name}</p>
      <p class="program-days">${p.days}</p>
      <span class="program-tag" style="background:${p.color}22;color:${p.color}">${p.tag}</span>
      ${state.activeProgram === i ? '<div class="program-active-badge">✓ Active</div>' : ''}
    </div>
  `).join('');
}

function selectProgram(i) {
  state.activeProgram = state.activeProgram === i ? null : i;
  renderWorkoutPrograms();
  if (state.activeProgram !== null) showToast(`Selected: ${WORKOUT_PROGRAMS[i].name}`);
}

function renderExercises() {
  const cont = document.getElementById('todayExercises');
  if (!cont) return;
  const done = EXERCISES_TODAY.filter(e => e.done).length;
  const total = EXERCISES_TODAY.length;
  cont.innerHTML = `
    <div class="exercise-progress-header">
      <span>${done}/${total} exercises</span>
      <div class="exercise-prog-bar"><div class="exercise-prog-fill" style="width:${done/total*100}%"></div></div>
    </div>
    ${EXERCISES_TODAY.map((ex, i) => `
    <div class="exercise-item ${ex.done ? 'done' : ''}">
      <button class="exercise-check ${ex.done ? 'checked' : ''}" onclick="toggleExercise(${i})">
        ${ex.done ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
      </button>
      <div class="exercise-info">
        <p class="exercise-name">${ex.name}</p>
        <p class="exercise-sets">${ex.sets}</p>
      </div>
      <span class="exercise-muscle-tag">${ex.muscle}</span>
    </div>
  `).join('')}`;
}

function toggleExercise(i) {
  EXERCISES_TODAY[i].done = !EXERCISES_TODAY[i].done;
  renderExercises();
}

function openWorkoutModal() { openModal('workoutModal'); }

async function logWorkout() {
  const type      = document.getElementById('wType').value;
  const dur       = parseInt(document.getElementById('wDuration').value, 10);
  const cal       = parseInt(document.getElementById('wCalBurned').value, 10) || 0;
  const intensity = document.querySelector('.intens-btn.active')?.dataset.val || 'moderate';
  if (!dur) { shakeField('wDuration'); return; }
  const payload = { user_id:CURRENT_USER_ID, workout_type:type, duration_minutes:dur, calories_burned:cal, intensity, notes:'', date:LOCAL_DATE };
  const created = await postJson('/workouts', payload);
  state.workouts.push({ id: created?.id ?? Date.now(), ...payload });
  closeModal('workoutModal');
  clearForm(['wDuration','wCalBurned']);
  showToast(`✓ ${type} — ${dur} min`);
  updateRing();
  // Update stats
  const wStat = document.getElementById('workoutMinStat');
  if (wStat) wStat.textContent = state.workouts.reduce((a,w)=>a+w.duration_minutes,0) + ' min';
}

// ─── WEIGHT ──────────────────────────────────
function openWeightModal() {
  document.getElementById('wDate').value = LOCAL_DATE;
  openModal('weightModal');
}

async function logWeight() {
  const w     = parseFloat(document.getElementById('wWeight').value);
  const d     = document.getElementById('wDate').value || LOCAL_DATE;
  const notes = document.getElementById('wNotes').value || '';
  if (!w) { shakeField('wWeight'); return; }
  const payload = { user_id:CURRENT_USER_ID, weight_kg:w, notes, date:d };
  const created = await postJson('/weight', payload);
  WEIGHT_DATA.labels.push(d);
  WEIGHT_DATA.weights.push(w);
  if (weightChartInst) {
    weightChartInst.data.labels   = WEIGHT_DATA.labels;
    weightChartInst.data.datasets[0].data = WEIGHT_DATA.weights;
    weightChartInst.update('active');
  }
  // Update progress stats
  const el = document.getElementById('currentWeightStat');
  if (el) el.textContent = w + ' kg';
  closeModal('weightModal');
  clearForm(['wWeight','wNotes']);
  showToast(`✓ ${w} kg logged`);
}

// ─── GOALS ───────────────────────────────────
function calcGoalPct(g) {
  if (g.lower) {
    const range  = g.current - g.target; // should decrease
    const start  = Math.max(g.current + 5, g.current);
    const reduce = start - g.current;
    const full   = start - g.target;
    return Math.min(Math.max(Math.round(reduce / full * 100), 0), 100);
  } else {
    return Math.min(Math.max(Math.round(g.current / g.target * 100), 0), 100);
  }
}

function renderGoals() {
  const grid = document.getElementById('goalsGrid');
  if (!grid) return;
  grid.innerHTML = state.goals.map(g => {
    const pct  = calcGoalPct(g);
    const days = Math.ceil((new Date(g.deadline) - new Date()) / 86400000);
    const color = pct >= 100 ? '#00E5A0' : pct >= 60 ? '#4A9EFF' : pct >= 30 ? '#FFD700' : '#FF6B35';
    return `
    <div class="goal-card">
      <div class="goal-header">
        <span class="goal-icon">${g.icon}</span>
        <div class="goal-title-wrap">
          <p class="goal-name">${g.name}</p>
          <p class="goal-deadline ${days < 0 ? 'expired' : ''}">${days > 0 ? days + ' days left' : days === 0 ? 'Today!' : 'Expired'}</p>
        </div>
        <button class="del-btn" onclick="deleteGoal(${g.id})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="goal-values">
        <span class="goal-current">${g.current} ${g.unit}</span>
        <span class="goal-arrow">→</span>
        <span class="goal-target">${g.target} ${g.unit}</span>
      </div>
      <div class="goal-bar">
        <div class="goal-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="goal-footer">
        <span class="goal-pct" style="color:${color}">${pct}%</span>
        ${pct >= 100 ? '<span class="goal-complete-badge">✓ Complete</span>' : ''}
      </div>
    </div>`;
  }).join('') + `
  <div class="goal-add-card" onclick="openGoalModal()">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
    <p>New goal</p>
  </div>`;
}

function openGoalModal()  { openModal('goalModal'); }
function deleteGoal(id)   {
  state.goals = state.goals.filter(g => g.id !== id);
  renderGoals();
  if (useBackend) deleteResource(`/goals?id=${id}`);
  showToast('Goal deleted successfully');
}

function selectIcon(btn, icon) {
  document.querySelectorAll('.icon-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedGoalIcon = icon;
}

async function addGoal() {
  const name    = document.getElementById('gName').value.trim();
  const current = parseFloat(document.getElementById('gCurrent').value) || 0;
  const target  = parseFloat(document.getElementById('gTarget').value)  || 0;
  const deadline = document.getElementById('gDeadline').value;
  const unit    = document.getElementById('gUnit').value.trim();
  const lower   = document.getElementById('gLower').checked;
  if (!name || !deadline) { shakeField('gName'); return; }
  const payload = { user_id:CURRENT_USER_ID, name, icon:state.selectedGoalIcon, current_value:current, target_value:target, unit, deadline };
  const created = await postJson('/goals', payload);
  state.goals.push({ id: created?.id ?? Date.now(), icon:state.selectedGoalIcon, name, current, target, deadline, unit, lower });
  renderGoals();
  closeModal('goalModal');
  clearForm(['gName','gCurrent','gTarget','gDeadline','gUnit']);
  showToast(`✓ Goal "${name}" added`);
}

// ─── NOTIFICATIONS ────────────────────────────
function toggleNotifications() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) renderNotifications();
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  const unread = state.notifications.filter(n=>!n.read).length;
  document.getElementById('notifBadge').textContent = unread || '';
  document.getElementById('notifBadge').style.display = unread ? 'flex' : 'none';
  list.innerHTML = state.notifications.length
    ? state.notifications.map(n => `
      <div class="notif-item ${n.read ? 'read' : ''}" onclick="markRead(${n.id})">
        <p class="notif-text">${n.text}</p>
        <p class="notif-time">${n.time}</p>
      </div>`).join('')
    : '<p class="notif-empty">No new notifications</p>';
}

function markRead(id) {
  const n = state.notifications.find(n=>n.id===id);
  if (n) n.read = true;
  renderNotifications();
}

document.addEventListener('click', e => {
  const panel = document.getElementById('notifPanel');
  const btn   = document.getElementById('notifBtn');
  if (panel?.classList.contains('open') && !panel.contains(e.target) && !btn?.contains(e.target)) {
    panel.classList.remove('open');
  }
});

// ─── TDEE CALCULATOR ─────────────────────────
function calcTDEE() {
  const weight = parseFloat(document.getElementById('tdeeWeight').value) || 82;
  const height = parseFloat(document.getElementById('tdeeHeight').value) || 178;
  const age    = parseInt(document.getElementById('tdeeAge').value)    || 28;
  const gender = document.getElementById('tdeeGender').value;
  const activity = parseFloat(document.getElementById('tdeeActivity').value);
  const goal   = document.getElementById('tdeeGoal').value;

  // Mifflin-St Jeor
  let bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee   = Math.round(bmr * activity);
  const target = goal === 'cut' ? tdee - 500 : goal === 'bulk' ? tdee + 300 : tdee;
  const protein = Math.round(weight * 2.2);
  const fat     = Math.round(target * 0.25 / 9);
  const carbs   = Math.round((target - protein * 4 - fat * 9) / 4);

  document.getElementById('tdeeBMR').textContent    = Math.round(bmr).toLocaleString('ar');
  document.getElementById('tdeeTDEE').textContent   = tdee.toLocaleString('ar');
  document.getElementById('tdeeTarget').textContent = target.toLocaleString('ar');
  document.getElementById('tdeeProtein').textContent = protein + 'g';
  document.getElementById('tdeeCarbs').textContent   = carbs + 'g';
  document.getElementById('tdeeFat').textContent     = fat + 'g';

  document.getElementById('tdeeResults').classList.add('visible');
  document.getElementById('applyTdeeBtn').style.display = 'block';
  window._tdeeTarget = target;
}

function applyTDEE() {
  if (!window._tdeeTarget) return;
  state.calorieGoal = window._tdeeTarget;
  updateRing();
  showToast(`✓ Daily target: ${window._tdeeTarget.toLocaleString('en')} kcal`);
}

// ─── SETTINGS ─────────────────────────────────
function updateCalGoal() {
  const v = parseInt(document.getElementById('calGoalInput').value);
  if (v > 500 && v < 10000) {
    state.calorieGoal = v;
    updateRing();
    showToast('✓ Daily goal updated');
  }
}

// ─── MODAL HELPERS ───────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
});

document.querySelectorAll('.intens-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.intens-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ─── TOAST ───────────────────────────────────
function showToast(msg, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

// ─── UTILS ───────────────────────────────────
function clearForm(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

// ─── INIT ────────────────────────────────────
async function init() {
  setDate();
  await probeBackend();
  renderMeals();
  updateRing();
  renderWorkoutPrograms();
  renderExercises();
  renderGoals();
  renderNotifications();
  setTimeout(initCharts, 200);
  // Animate stats on load
  document.querySelectorAll('.stat-val, .big-num').forEach((el, i) => {
    el.style.animationDelay = (i * 0.08) + 's';
    el.classList.add('count-in');
  });
}

document.addEventListener('DOMContentLoaded', init);
