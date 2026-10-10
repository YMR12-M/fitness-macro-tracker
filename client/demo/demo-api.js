/* ============================================
   النسخة التجريبية (عرض فقط) - النواة المشتركة

   بتعترض طلبات fetch لمسار الـ API وبترد عليها من بيانات وهمية متخزنة في
   localStorage عند الزائر نفسه. مفيش سيرفر ولا قاعدة بيانات: كل زائر معاه
   نسخته الخاصة، ومفيش أي حاجة بتتبعت لأي مكان.

   الملف ده مش بيتحمّل في النسخة الحقيقية خالص - بيتحط في index.html بتاع
   النسخة التجريبية بس (demo/inject.mjs). ومفيش أي تعديل على كود الواجهة.
   ============================================ */

function createDemo(cfg) {
  'use strict';

  var pad = function (n) {
    return String(n).padStart(2, '0');
  };

  var H = {
    pad: pad,
    now: function () {
      return Date.now();
    },
    // "YYYY-MM-DD HH:MM:SS" بتوقيت UTC (زي DATETIME من MySQL)
    utc: function (ms) {
      var d = new Date(ms);
      return (
        d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' +
        pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds())
      );
    },
    day: function (ms) {
      return H.utc(ms).slice(0, 10);
    },
    iso: function (ms) {
      return new Date(ms).toISOString();
    },
    // أيام نسبية لـ "النهارده" بتوقيت الزائر (YYYY-MM-DD)
    localDay: function (offset) {
      var d = new Date();
      d.setDate(d.getDate() + (offset || 0));
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    },
    // رقم ثابت 0..999 من نص: عشان البيانات المتولّدة تبقى متكررة مش عشوائية
    hash: function (str) {
      var h = 2166136261;
      str = String(str);
      for (var i = 0; i < str.length; i += 1) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0) % 1000;
    },
    code: function (length, alphabet) {
      alphabet = alphabet || 'abcdefghijklmnopqrstuvwxyz0123456789';
      var out = '';
      for (var i = 0; i < length; i += 1) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      return out;
    },
    ok: function (body, status) {
      return { status: status || 200, body: body };
    },
    seq: function (db, kind) {
      db.seq = db.seq || {};
      db.seq[kind] = (db.seq[kind] || 0) + 1;
      return db.seq[kind];
    },
    clone: function (value) {
      return JSON.parse(JSON.stringify(value));
    },
  };

  var db = null;

  function load() {
    try {
      var raw = localStorage.getItem(cfg.key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.__v === cfg.version) return parsed;
      }
    } catch (e) {
      /* التخزين المحلي مقفول - هنكمّل من الذاكرة */
    }
    return null;
  }

  function save() {
    try {
      localStorage.setItem(cfg.key, JSON.stringify(db));
    } catch (e) {
      /* الكوتا خلصت أو التخزين مقفول - الجلسة الحالية شغّالة من الذاكرة */
    }
  }

  function reset() {
    db = { __v: cfg.version, seq: {} };
    cfg.seed(db, H);
    save();
  }

  db = load();
  if (!db) reset();

  /* ---------- اعتراض fetch ---------- */

  var prefixes = [].concat(cfg.prefix);
  var realFetch = window.fetch.bind(window);

  function matchPrefix(pathname) {
    for (var i = 0; i < prefixes.length; i += 1) {
      var p = prefixes[i];
      if (pathname === p || pathname.indexOf(p + '/') === 0) return pathname.slice(p.length) || '/';
    }
    return null;
  }

  function headerValue(headers, name) {
    if (!headers) return undefined;
    if (typeof headers.get === 'function') return headers.get(name);
    var lower = name.toLowerCase();
    for (var k in headers) if (k.toLowerCase() === lower) return headers[k];
    return undefined;
  }

  window.fetch = function (input, init) {
    var raw = typeof input === 'string' ? input : input && (input.url || input.href);
    var parsed;
    try {
      parsed = new URL(raw, window.location.origin);
    } catch (e) {
      return realFetch(input, init);
    }
    var path = parsed.origin === window.location.origin ? matchPrefix(parsed.pathname) : null;
    if (path === null) return realFetch(input, init);

    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var headers = (init && init.headers) || (input && input.headers) || {};
    var body = null;
    var rawBody = init && init.body;
    if (typeof rawBody === 'string' && rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch (e) {
        body = null;
      }
    }
    var query = {};
    parsed.searchParams.forEach(function (v, k) {
      query[k] = v;
    });

    var result;
    try {
      result = cfg.handle({ method: method, path: path, query: query, body: body, headers: headers, header: function (n) { return headerValue(headers, n); } }, db, H);
      if (!result) result = { status: 404, body: cfg.notFound ? cfg.notFound(path) : { message: 'المسار ده مش موجود في النسخة التجريبية' } };
      save();
    } catch (e) {
      if (window.console) console.error('[demo]', e);
      result = { status: 500, body: cfg.serverError ? cfg.serverError() : { message: 'حصل خطأ في النسخة التجريبية' } };
    }

    return new Promise(function (resolve) {
      setTimeout(function () {
        var h = Object.assign({ 'Content-Type': 'application/json' }, result.headers || {});
        var payload = result.status === 204 ? null : result.raw ? result.body : JSON.stringify(result.body);
        resolve(new Response(payload, { status: result.status, headers: h }));
      }, 40 + Math.floor(Math.random() * 80));
    });
  };

  /* ---------- شريط التجربة ---------- */

  var API = {
    db: function () {
      return db;
    },
    H: H,
    save: save,
    reset: function () {
      try {
        localStorage.removeItem(cfg.key);
      } catch (e) {
        /* لا شيء */
      }
      if (cfg.onReset) cfg.onReset();
      window.location.href = cfg.home || '/';
    },
    go: function (url) {
      save();
      window.location.href = url || cfg.home || '/';
    },
  };

  function mountBar() {
    if (document.getElementById('demo-bar')) return;
    var bar = cfg.bar || {};
    var style = document.createElement('style');
    style.textContent =
      '#demo-bar{position:fixed;left:10px;bottom:10px;z-index:2147483000;font-family:inherit;direction:rtl;font-size:13px;line-height:1.5}' +
      '#demo-bar *{box-sizing:border-box}' +
      '#demo-toggle{display:flex;align-items:center;gap:6px;background:#1c1c24;color:#fff;border:1px solid rgba(255,255,255,.28);' +
      'border-radius:999px;padding:7px 13px;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.35)}' +
      '#demo-toggle i{width:8px;height:8px;border-radius:50%;background:#f5b93a;display:inline-block}' +
      '#demo-panel{display:none;position:absolute;left:0;bottom:calc(100% + 8px);width:min(290px,calc(100vw - 20px));' +
      'background:#fff;color:#1c1c24;border:1px solid #d6d6dc;border-radius:14px;padding:12px;box-shadow:0 12px 32px rgba(0,0,0,.3)}' +
      '#demo-panel p{margin:0 0 8px;font-size:12.5px;color:#454552}' +
      '#demo-panel button{display:block;width:100%;margin-top:6px;padding:9px 11px;border-radius:10px;border:1px solid #1c1c24;' +
      'background:#fff;color:#1c1c24;font:inherit;font-weight:700;text-align:right;cursor:pointer}' +
      '#demo-panel button.primary{background:#1c1c24;color:#fff}' +
      '#demo-panel small{display:block;margin-top:9px;font-size:11.5px;color:#6a6a78}';
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'demo-bar';
    var actions = (bar.actions || [])
      .map(function (a, i) {
        return '<button type="button" class="' + (a.primary ? 'primary' : '') + '" data-i="' + i + '"></button>';
      })
      .join('');
    wrap.innerHTML =
      '<div id="demo-panel" role="dialog" aria-label="خيارات النسخة التجريبية">' +
      '<p></p>' + actions +
      '<button type="button" data-reset="1">إعادة ضبط البيانات</button><small></small></div>' +
      '<button id="demo-toggle" type="button" aria-expanded="false" aria-controls="demo-panel"><i></i><span></span></button>';
    document.body.appendChild(wrap);

    var panel = wrap.querySelector('#demo-panel');
    var toggle = wrap.querySelector('#demo-toggle');
    toggle.querySelector('span').textContent = bar.label || 'نسخة تجريبية';
    panel.querySelector('p').textContent =
      bar.intro || 'ده عرض للتطبيق ببيانات وهمية متخزنة على جهازك بس.';
    panel.querySelector('small').textContent = bar.note || '';
    (bar.actions || []).forEach(function (a, i) {
      panel.querySelector('button[data-i="' + i + '"]').textContent = a.label;
    });

    function setOpen(open) {
      panel.style.display = open ? 'block' : 'none';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () {
      setOpen(panel.style.display !== 'block');
    });
    panel.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      if (t.getAttribute('data-reset')) return API.reset();
      var idx = t.getAttribute('data-i');
      if (idx !== null && bar.actions[Number(idx)]) bar.actions[Number(idx)].run(API);
    });
    if (bar.openFirst && !sessionStorage.getItem(cfg.key + ':seen')) {
      try {
        sessionStorage.setItem(cfg.key + ':seen', '1');
      } catch (e) {
        /* لا شيء */
      }
      setOpen(true);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountBar);
  else mountBar();

  return API;
}

/* ============================================
   FitTrack - the in-browser demo backend
   Response shapes mirror server/src/modules/* (plain JSON, errors as
   { error: { message, details } }). The food catalog and the training
   programs are the project's real seed data (server/src/db/seeds).
   ============================================ */

(function () {
  'use strict';

  const DEMO_EMAIL = 'demo@fittrack.demo';
  const DEMO_PASSWORD = 'Demo1234';
  const DAY = 86400000;

  const PROGRAMS = [{"slug":"push-pull-legs","name":"Push / Pull / Legs","emoji":"💪","level":"intermediate","days_per_week":6,"accent":"#00E5A0","description":"Six sessions a week split by movement pattern, each muscle group trained twice. The standard intermediate hypertrophy split.","days":[{"label":"Push A — Chest focus","exercises":[{"name":"Barbell bench press","muscle":"Chest","sets":4,"reps":"6-8"},{"name":"Overhead press","muscle":"Shoulders","sets":3,"reps":"8-10"},{"name":"Incline dumbbell press","muscle":"Chest","sets":3,"reps":"10-12"},{"name":"Lateral raise","muscle":"Shoulders","sets":3,"reps":"12-15"},{"name":"Triceps pushdown","muscle":"Triceps","sets":3,"reps":"10-12"},{"name":"Overhead triceps extension","muscle":"Triceps","sets":3,"reps":"12-15"}]},{"label":"Pull A — Back thickness","exercises":[{"name":"Deadlift","muscle":"Back","sets":3,"reps":"5"},{"name":"Pull-up","muscle":"Back","sets":4,"reps":"6-10"},{"name":"Barbell row","muscle":"Back","sets":3,"reps":"8-10"},{"name":"Face pull","muscle":"Rear delts","sets":3,"reps":"15"},{"name":"Barbell curl","muscle":"Biceps","sets":3,"reps":"10-12"},{"name":"Hammer curl","muscle":"Biceps","sets":3,"reps":"12"}]},{"label":"Legs A — Squat focus","exercises":[{"name":"Back squat","muscle":"Quads","sets":4,"reps":"6-8"},{"name":"Romanian deadlift","muscle":"Hamstrings","sets":3,"reps":"8-10"},{"name":"Leg press","muscle":"Quads","sets":3,"reps":"12"},{"name":"Leg curl","muscle":"Hamstrings","sets":3,"reps":"12-15"},{"name":"Standing calf raise","muscle":"Calves","sets":4,"reps":"15"}]},{"label":"Push B — Shoulder focus","exercises":[{"name":"Overhead press","muscle":"Shoulders","sets":4,"reps":"6-8"},{"name":"Incline barbell press","muscle":"Chest","sets":3,"reps":"8-10"},{"name":"Dumbbell shoulder press","muscle":"Shoulders","sets":3,"reps":"10-12"},{"name":"Cable fly","muscle":"Chest","sets":3,"reps":"12-15"},{"name":"Close-grip bench press","muscle":"Triceps","sets":3,"reps":"8-10"},{"name":"Rope pushdown","muscle":"Triceps","sets":3,"reps":"15"}]},{"label":"Pull B — Back width","exercises":[{"name":"Lat pulldown","muscle":"Back","sets":4,"reps":"8-10"},{"name":"Seated cable row","muscle":"Back","sets":3,"reps":"10-12"},{"name":"Single-arm dumbbell row","muscle":"Back","sets":3,"reps":"10"},{"name":"Reverse fly","muscle":"Rear delts","sets":3,"reps":"15"},{"name":"Incline dumbbell curl","muscle":"Biceps","sets":3,"reps":"10-12"},{"name":"Cable curl","muscle":"Biceps","sets":3,"reps":"15"}]},{"label":"Legs B — Posterior chain","exercises":[{"name":"Front squat","muscle":"Quads","sets":4,"reps":"6-8"},{"name":"Hip thrust","muscle":"Glutes","sets":3,"reps":"10-12"},{"name":"Bulgarian split squat","muscle":"Quads","sets":3,"reps":"10 each"},{"name":"Seated leg curl","muscle":"Hamstrings","sets":3,"reps":"12-15"},{"name":"Seated calf raise","muscle":"Calves","sets":4,"reps":"15-20"}]}]},{"slug":"starting-strength","name":"Starting Strength","emoji":"🏋️","level":"beginner","days_per_week":3,"accent":"#4A9EFF","description":"Rippetoe's linear-progression barbell novice program: two alternating full-body sessions, three days a week, adding weight every session.","days":[{"label":"Workout A","exercises":[{"name":"Back squat","muscle":"Quads","sets":3,"reps":"5"},{"name":"Barbell bench press","muscle":"Chest","sets":3,"reps":"5"},{"name":"Deadlift","muscle":"Back","sets":1,"reps":"5"}]},{"label":"Workout B","exercises":[{"name":"Back squat","muscle":"Quads","sets":3,"reps":"5"},{"name":"Overhead press","muscle":"Shoulders","sets":3,"reps":"5"},{"name":"Power clean","muscle":"Full body","sets":5,"reps":"3"}]},{"label":"Workout A (repeat)","exercises":[{"name":"Back squat","muscle":"Quads","sets":3,"reps":"5"},{"name":"Barbell bench press","muscle":"Chest","sets":3,"reps":"5"},{"name":"Deadlift","muscle":"Back","sets":1,"reps":"5"}]}]},{"slug":"full-body-mobility","name":"Full Body + Mobility","emoji":"🧘","level":"beginner","days_per_week":3,"accent":"#6C63FF","description":"Three full-body sessions a week using machines and dumbbells, each finishing with mobility work. Built for a return to training after a layoff.","days":[{"label":"Full body A","exercises":[{"name":"Goblet squat","muscle":"Quads","sets":3,"reps":"10-12"},{"name":"Dumbbell bench press","muscle":"Chest","sets":3,"reps":"10-12"},{"name":"Lat pulldown","muscle":"Back","sets":3,"reps":"12"},{"name":"Plank","muscle":"Core","sets":3,"reps":"45s"},{"name":"Hip flexor stretch","muscle":"Mobility","sets":2,"reps":"60s each"}]},{"label":"Full body B","exercises":[{"name":"Romanian deadlift","muscle":"Hamstrings","sets":3,"reps":"10"},{"name":"Dumbbell shoulder press","muscle":"Shoulders","sets":3,"reps":"10-12"},{"name":"Seated cable row","muscle":"Back","sets":3,"reps":"12"},{"name":"Dead bug","muscle":"Core","sets":3,"reps":"10 each"},{"name":"Thoracic rotation","muscle":"Mobility","sets":2,"reps":"10 each"}]},{"label":"Full body C","exercises":[{"name":"Leg press","muscle":"Quads","sets":3,"reps":"12-15"},{"name":"Incline dumbbell press","muscle":"Chest","sets":3,"reps":"12"},{"name":"Assisted pull-up","muscle":"Back","sets":3,"reps":"8-10"},{"name":"Side plank","muscle":"Core","sets":3,"reps":"30s each"},{"name":"Ankle mobility drill","muscle":"Mobility","sets":2,"reps":"10 each"}]}]},{"slug":"hiit-conditioning","name":"HIIT & Conditioning","emoji":"🔥","level":"advanced","days_per_week":4,"accent":"#FF6B35","description":"Four conditioning sessions a week alternating intervals and circuits, for athletes who already have a strength base.","days":[{"label":"Intervals — bike","exercises":[{"name":"Assault bike sprint","muscle":"Conditioning","sets":8,"reps":"30s on / 90s off"},{"name":"Cool-down spin","muscle":"Conditioning","sets":1,"reps":"5 min"}]},{"label":"Circuit — full body","exercises":[{"name":"Kettlebell swing","muscle":"Posterior chain","sets":5,"reps":"20"},{"name":"Burpee","muscle":"Full body","sets":5,"reps":"12"},{"name":"Box jump","muscle":"Legs","sets":5,"reps":"10"},{"name":"Battle rope","muscle":"Conditioning","sets":5,"reps":"30s"}]},{"label":"Intervals — running","exercises":[{"name":"Track 400 m repeat","muscle":"Conditioning","sets":6,"reps":"400m"},{"name":"Walk recovery","muscle":"Conditioning","sets":6,"reps":"2 min"}]},{"label":"Circuit — carries and core","exercises":[{"name":"Farmer's carry","muscle":"Full body","sets":4,"reps":"40m"},{"name":"Sled push","muscle":"Legs","sets":4,"reps":"20m"},{"name":"Hanging leg raise","muscle":"Core","sets":4,"reps":"12"},{"name":"Russian twist","muscle":"Core","sets":4,"reps":"20"}]}]},{"slug":"5k-runner","name":"5K Runner Plan","emoji":"🏃","level":"beginner","days_per_week":5,"accent":"#FFD700","description":"A run/walk progression from zero to a continuous 5K, with two rest-adjacent days for cross-training and mobility.","days":[{"label":"Run / walk intervals","exercises":[{"name":"Brisk walk warm-up","muscle":"Conditioning","sets":1,"reps":"5 min"},{"name":"Run","muscle":"Conditioning","sets":8,"reps":"60s"},{"name":"Walk recovery","muscle":"Conditioning","sets":8,"reps":"90s"}]},{"label":"Cross-training","exercises":[{"name":"Stationary bike","muscle":"Conditioning","sets":1,"reps":"30 min"},{"name":"Calf raise","muscle":"Calves","sets":3,"reps":"20"}]},{"label":"Tempo run","exercises":[{"name":"Easy jog warm-up","muscle":"Conditioning","sets":1,"reps":"10 min"},{"name":"Tempo run","muscle":"Conditioning","sets":1,"reps":"15 min"},{"name":"Cool-down jog","muscle":"Conditioning","sets":1,"reps":"5 min"}]},{"label":"Strength for runners","exercises":[{"name":"Single-leg glute bridge","muscle":"Glutes","sets":3,"reps":"12 each"},{"name":"Walking lunge","muscle":"Quads","sets":3,"reps":"20 steps"},{"name":"Calf raise","muscle":"Calves","sets":3,"reps":"20"},{"name":"Plank","muscle":"Core","sets":3,"reps":"45s"}]},{"label":"Long slow run","exercises":[{"name":"Easy-pace run","muscle":"Conditioning","sets":1,"reps":"35-45 min"}]}]},{"slug":"calisthenics-basics","name":"Calisthenics Basics","emoji":"🤸","level":"beginner","days_per_week":4,"accent":"#FF4D8D","description":"Bodyweight progressions toward the pull-up, dip and pistol squat. No equipment beyond a bar.","days":[{"label":"Push day","exercises":[{"name":"Push-up progression","muscle":"Chest","sets":4,"reps":"8-12"},{"name":"Pike push-up","muscle":"Shoulders","sets":3,"reps":"8-10"},{"name":"Dip progression","muscle":"Triceps","sets":3,"reps":"6-10"},{"name":"Hollow body hold","muscle":"Core","sets":3,"reps":"30s"}]},{"label":"Pull day","exercises":[{"name":"Australian row","muscle":"Back","sets":4,"reps":"10-12"},{"name":"Negative pull-up","muscle":"Back","sets":4,"reps":"5"},{"name":"Scapular pull-up","muscle":"Back","sets":3,"reps":"10"},{"name":"Hanging knee raise","muscle":"Core","sets":3,"reps":"12"}]},{"label":"Legs day","exercises":[{"name":"Bodyweight squat","muscle":"Quads","sets":4,"reps":"20"},{"name":"Split squat","muscle":"Quads","sets":3,"reps":"12 each"},{"name":"Nordic curl negative","muscle":"Hamstrings","sets":3,"reps":"5"},{"name":"Single-leg calf raise","muscle":"Calves","sets":3,"reps":"15 each"}]},{"label":"Skills and core","exercises":[{"name":"Handstand wall hold","muscle":"Shoulders","sets":4,"reps":"30s"},{"name":"L-sit progression","muscle":"Core","sets":4,"reps":"20s"},{"name":"Tuck front lever hold","muscle":"Back","sets":4,"reps":"15s"},{"name":"Wrist mobility drill","muscle":"Mobility","sets":2,"reps":"60s"}]}]}];
  const FOODS = [{"name":"Chicken breast, roasted, skinless","emoji":"🍗","category":"Poultry","calories":165,"protein_g":31,"carbs_g":0,"fat_g":3.6,"sodium_mg":74},{"name":"Chicken thigh, roasted, skinless","emoji":"🍗","category":"Poultry","calories":209,"protein_g":26,"carbs_g":0,"fat_g":10.9,"sodium_mg":88},{"name":"Turkey breast, roasted","emoji":"🦃","category":"Poultry","calories":135,"protein_g":30.1,"carbs_g":0,"fat_g":0.7,"sodium_mg":1015},{"name":"Ground beef, 85% lean, cooked","emoji":"🥩","category":"Beef","calories":250,"protein_g":26,"carbs_g":0,"fat_g":15.4,"sodium_mg":75},{"name":"Beef sirloin steak, grilled","emoji":"🥩","category":"Beef","calories":201,"protein_g":29.8,"carbs_g":0,"fat_g":8,"sodium_mg":55},{"name":"Lamb, lean, roasted","emoji":"🍖","category":"Lamb","calories":258,"protein_g":25.6,"carbs_g":0,"fat_g":16.5,"sodium_mg":72},{"name":"Salmon, Atlantic, farmed, cooked","emoji":"🐟","category":"Fish","calories":206,"protein_g":22.1,"carbs_g":0,"fat_g":12.4,"sodium_mg":61},{"name":"Tilapia, cooked","emoji":"🐟","category":"Fish","calories":128,"protein_g":26.2,"carbs_g":0,"fat_g":2.7,"sodium_mg":56},{"name":"Tuna, canned in water, drained","emoji":"🐠","category":"Fish","calories":116,"protein_g":25.5,"carbs_g":0,"fat_g":0.8,"sodium_mg":247},{"name":"Shrimp, cooked","emoji":"🦐","category":"Seafood","calories":99,"protein_g":24,"carbs_g":0.2,"fat_g":0.3,"sodium_mg":111},{"name":"Egg, whole, hard-boiled","emoji":"🥚","category":"Eggs","calories":155,"protein_g":12.6,"carbs_g":1.1,"fat_g":10.6,"sodium_mg":124},{"name":"Egg white, raw","emoji":"🥚","category":"Eggs","calories":52,"protein_g":10.9,"carbs_g":0.7,"fat_g":0.2,"sodium_mg":166},{"name":"Milk, whole, 3.25%","emoji":"🥛","category":"Dairy","unit":"ml","calories":61,"protein_g":3.15,"carbs_g":4.8,"fat_g":3.25,"sugar_g":5.05,"sodium_mg":43},{"name":"Milk, skimmed","emoji":"🥛","category":"Dairy","unit":"ml","calories":34,"protein_g":3.37,"carbs_g":4.96,"fat_g":0.08,"sugar_g":5.09,"sodium_mg":42},{"name":"Greek yogurt, plain, nonfat","emoji":"🥣","category":"Dairy","calories":59,"protein_g":10.2,"carbs_g":3.6,"fat_g":0.39,"sugar_g":3.24,"sodium_mg":36},{"name":"Yogurt, plain, whole milk","emoji":"🥣","category":"Dairy","calories":61,"protein_g":3.47,"carbs_g":4.66,"fat_g":3.25,"sugar_g":4.66,"sodium_mg":46},{"name":"Cottage cheese, 2% fat","emoji":"🧀","category":"Dairy","calories":84,"protein_g":11.1,"carbs_g":4.3,"fat_g":2.3,"sodium_mg":321},{"name":"Cheddar cheese","emoji":"🧀","category":"Dairy","calories":403,"protein_g":24.9,"carbs_g":1.28,"fat_g":33.1,"sodium_mg":621},{"name":"Mozzarella, part skim","emoji":"🧀","category":"Dairy","calories":254,"protein_g":24.3,"carbs_g":2.8,"fat_g":15.9,"sodium_mg":619},{"name":"Butter, salted","emoji":"🧈","category":"Dairy","calories":717,"protein_g":0.85,"carbs_g":0.06,"fat_g":81.1,"sodium_mg":643},{"name":"White rice, long-grain, cooked","emoji":"🍚","category":"Grains","calories":130,"protein_g":2.69,"carbs_g":28.2,"fat_g":0.28,"fiber_g":0.4},{"name":"Brown rice, cooked","emoji":"🍚","category":"Grains","calories":123,"protein_g":2.74,"carbs_g":25.6,"fat_g":0.97,"fiber_g":1.6},{"name":"Pasta, enriched, cooked","emoji":"🍝","category":"Grains","calories":158,"protein_g":5.8,"carbs_g":30.9,"fat_g":0.93,"fiber_g":1.8},{"name":"Oats, rolled, dry","emoji":"🥣","category":"Grains","calories":389,"protein_g":16.9,"carbs_g":66.3,"fat_g":6.9,"fiber_g":10.6},{"name":"Quinoa, cooked","emoji":"🌾","category":"Grains","calories":120,"protein_g":4.4,"carbs_g":21.3,"fat_g":1.92,"fiber_g":2.8},{"name":"Bread, white, commercial","emoji":"🍞","category":"Grains","calories":266,"protein_g":9,"carbs_g":49,"fat_g":3.3,"fiber_g":2.7,"sodium_mg":490},{"name":"Bread, whole wheat","emoji":"🍞","category":"Grains","calories":247,"protein_g":13,"carbs_g":41,"fat_g":3.5,"fiber_g":7,"sodium_mg":450},{"name":"Pita bread, white","emoji":"🫓","category":"Grains","calories":275,"protein_g":9.1,"carbs_g":55.7,"fat_g":1.2,"fiber_g":2.2,"sodium_mg":536},{"name":"Potato, baked, with skin","emoji":"🥔","category":"Vegetables","calories":93,"protein_g":2.5,"carbs_g":21.1,"fat_g":0.13,"fiber_g":2.2},{"name":"Sweet potato, baked","emoji":"🍠","category":"Vegetables","calories":90,"protein_g":2,"carbs_g":20.7,"fat_g":0.15,"fiber_g":3.3,"sugar_g":6.5},{"name":"Lentils, cooked","emoji":"🫘","category":"Legumes","calories":116,"protein_g":9.02,"carbs_g":20.1,"fat_g":0.38,"fiber_g":7.9},{"name":"Chickpeas, cooked","emoji":"🫘","category":"Legumes","calories":164,"protein_g":8.86,"carbs_g":27.4,"fat_g":2.59,"fiber_g":7.6},{"name":"Black beans, cooked","emoji":"🫘","category":"Legumes","calories":132,"protein_g":8.86,"carbs_g":23.7,"fat_g":0.54,"fiber_g":8.7},{"name":"Fava beans (ful medames), cooked","emoji":"🫘","category":"Legumes","calories":110,"protein_g":7.6,"carbs_g":19.6,"fat_g":0.4,"fiber_g":5.4},{"name":"Hummus, commercial","emoji":"🫙","category":"Legumes","calories":166,"protein_g":7.9,"carbs_g":14.3,"fat_g":9.6,"fiber_g":6,"sodium_mg":379},{"name":"Falafel, fried","emoji":"🧆","category":"Legumes","calories":333,"protein_g":13.3,"carbs_g":31.8,"fat_g":17.8,"fiber_g":4.9,"sodium_mg":294},{"name":"Tofu, firm","emoji":"🍲","category":"Legumes","calories":144,"protein_g":15.8,"carbs_g":4.3,"fat_g":8.7,"fiber_g":2.3},{"name":"Banana, raw","emoji":"🍌","category":"Fruit","calories":89,"protein_g":1.09,"carbs_g":22.8,"fat_g":0.33,"fiber_g":2.6,"sugar_g":12.2},{"name":"Apple, raw, with skin","emoji":"🍎","category":"Fruit","calories":52,"protein_g":0.26,"carbs_g":13.8,"fat_g":0.17,"fiber_g":2.4,"sugar_g":10.4},{"name":"Orange, raw","emoji":"🍊","category":"Fruit","calories":47,"protein_g":0.94,"carbs_g":11.8,"fat_g":0.12,"fiber_g":2.4,"sugar_g":9.35},{"name":"Strawberries, raw","emoji":"🍓","category":"Fruit","calories":32,"protein_g":0.67,"carbs_g":7.68,"fat_g":0.3,"fiber_g":2,"sugar_g":4.89},{"name":"Grapes, raw","emoji":"🍇","category":"Fruit","calories":69,"protein_g":0.72,"carbs_g":18.1,"fat_g":0.16,"fiber_g":0.9,"sugar_g":15.5},{"name":"Watermelon, raw","emoji":"🍉","category":"Fruit","calories":30,"protein_g":0.61,"carbs_g":7.55,"fat_g":0.15,"fiber_g":0.4,"sugar_g":6.2},{"name":"Dates, medjool","emoji":"🌴","category":"Fruit","calories":277,"protein_g":1.81,"carbs_g":75,"fat_g":0.15,"fiber_g":6.7,"sugar_g":66.5},{"name":"Avocado, raw","emoji":"🥑","category":"Fruit","calories":160,"protein_g":2,"carbs_g":8.53,"fat_g":14.7,"fiber_g":6.7},{"name":"Broccoli, raw","emoji":"🥦","category":"Vegetables","calories":34,"protein_g":2.82,"carbs_g":6.64,"fat_g":0.37,"fiber_g":2.6},{"name":"Spinach, raw","emoji":"🥬","category":"Vegetables","calories":23,"protein_g":2.86,"carbs_g":3.63,"fat_g":0.39,"fiber_g":2.2,"sodium_mg":79},{"name":"Tomato, raw","emoji":"🍅","category":"Vegetables","calories":18,"protein_g":0.88,"carbs_g":3.89,"fat_g":0.2,"fiber_g":1.2},{"name":"Cucumber, with peel, raw","emoji":"🥒","category":"Vegetables","calories":15,"protein_g":0.65,"carbs_g":3.63,"fat_g":0.11,"fiber_g":0.5},{"name":"Carrot, raw","emoji":"🥕","category":"Vegetables","calories":41,"protein_g":0.93,"carbs_g":9.58,"fat_g":0.24,"fiber_g":2.8,"sodium_mg":69},{"name":"Onion, raw","emoji":"🧅","category":"Vegetables","calories":40,"protein_g":1.1,"carbs_g":9.34,"fat_g":0.1,"fiber_g":1.7},{"name":"Romaine lettuce, raw","emoji":"🥗","category":"Vegetables","calories":17,"protein_g":1.23,"carbs_g":3.29,"fat_g":0.3,"fiber_g":2.1},{"name":"Almonds, raw","emoji":"🥜","category":"Nuts","calories":579,"protein_g":21.2,"carbs_g":21.6,"fat_g":49.9,"fiber_g":12.5},{"name":"Walnuts, raw","emoji":"🥜","category":"Nuts","calories":654,"protein_g":15.2,"carbs_g":13.7,"fat_g":65.2,"fiber_g":6.7},{"name":"Peanut butter, smooth","emoji":"🥜","category":"Nuts","calories":588,"protein_g":25.1,"carbs_g":19.6,"fat_g":50.4,"fiber_g":6,"sodium_mg":429},{"name":"Olive oil","emoji":"🫒","category":"Fats","unit":"ml","calories":884,"protein_g":0,"carbs_g":0,"fat_g":100},{"name":"Orange juice, raw","emoji":"🍊","category":"Beverages","unit":"ml","calories":45,"protein_g":0.7,"carbs_g":10.4,"fat_g":0.2,"sugar_g":8.4},{"name":"Cola, carbonated","emoji":"🥤","category":"Beverages","unit":"ml","calories":37,"protein_g":0.07,"carbs_g":9.56,"fat_g":0.02,"sugar_g":8.96,"sodium_mg":4},{"name":"Coffee, brewed, black","emoji":"☕","category":"Beverages","unit":"ml","calories":1,"protein_g":0.12,"carbs_g":0,"fat_g":0.02},{"name":"Tea, black, brewed","emoji":"🍵","category":"Beverages","unit":"ml","calories":1,"protein_g":0,"carbs_g":0.3,"fat_g":0},{"name":"Honey","emoji":"🍯","category":"Sweets","calories":304,"protein_g":0.3,"carbs_g":82.4,"fat_g":0,"sugar_g":82.1},{"name":"Dark chocolate, 70-85% cacao","emoji":"🍫","category":"Sweets","calories":598,"protein_g":7.79,"carbs_g":45.9,"fat_g":42.6,"fiber_g":10.9,"sugar_g":24},{"name":"Whey protein isolate powder","emoji":"💪","category":"Supplements","calories":370,"protein_g":80,"carbs_g":7,"fat_g":3,"sodium_mg":400}];

  const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const ADJUST = { cut: -500, maintain: 0, bulk: 300 };
  const PROTEIN_PER_KG = { cut: 2.2, maintain: 1.8, bulk: 1.8 };

  const round = (n, dp) => { const f = 10 ** (dp || 0); return Math.round(n * f) / f; };
  const r1 = (n) => round(Number(n), 1);
  const fail = (status, message, details) => ({ status, body: { error: { message, ...(details ? { details } : {}) } } });
  const ok = (body, status) => ({ status: status || 200, body });
  const noContent = () => ({ status: 204, body: null });

  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const range = (a, b) => { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push(d); return out; };
  const today = (H) => H.localDay(0);

  function energy({ sex, weightKg, heightCm, age, activityLevel, goalType }) {
    if (!weightKg || !heightCm || age == null) return null;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    const bmr = sex === 'female' ? base - 161 : base + 5;
    const mult = ACTIVITY[activityLevel] || 1.55;
    const tdee = bmr * mult;
    const target = Math.max(1200, tdee + (ADJUST[goalType] || 0));
    const protein = weightKg * (PROTEIN_PER_KG[goalType] || 1.8);
    const fat = (target * 0.25) / 9;
    const carbs = Math.max(0, (target - protein * 4 - fat * 9) / 4);
    return {
      age, bmr: round(bmr), tdee: round(tdee), activity_multiplier: mult, target_calories: round(target),
      macros: { protein_g: round(protein), carbs_g: round(carbs), fat_g: round(fat) },
      macro_split: { protein_pct: round((protein * 400) / target), carbs_pct: round((carbs * 400) / target), fat_pct: round((fat * 900) / target) },
    };
  }

  /* ---------- seed ---------- */

  function seed(db, H) {
    const now = H.now();
    const t = today(H);
    db.session = null;
    db.users = [{
      id: 1, email: DEMO_EMAIL, password: DEMO_PASSWORD, name: 'Alex Morgan', created_at: new Date(now - 70 * DAY).toISOString(),
      sex: 'male', birth_date: '1994-05-12', height_cm: 178, activity_level: 'moderate', goal_type: 'cut',
      calorie_goal: 2200, protein_goal_g: 170, carbs_goal_g: 230, fat_goal_g: 65, water_goal_ml: 3000, units: 'metric', theme: 'dark', timezone: 'UTC',
    }];
    db.foods = FOODS.map((f, i) => ({
      id: i + 1, source: 'seed', fdc_id: null, name: f.name, brand: null, category: f.category || null, emoji: f.emoji || null,
      serving_size: 100, serving_unit: f.unit || 'g', calories: f.calories, protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g,
      fiber_g: f.fiber_g ?? null, sugar_g: f.sugar_g ?? null, sodium_mg: f.sodium_mg ?? null, created_by: null,
    }));
    db.seqFood = db.foods.length;
    db.programs = PROGRAMS.map((p, i) => ({ id: i + 1, slug: p.slug, name: p.name, emoji: p.emoji, description: p.description, days_per_week: p.days_per_week, level: p.level, accent: p.accent }));
    db.programExercises = [];
    PROGRAMS.forEach((p, pi) => p.days.forEach((d, di) => d.exercises.forEach((e, pos) => {
      db.programExercises.push({ id: db.programExercises.length + 1, program_id: pi + 1, day_index: di, day_label: d.label, name: e.name, muscle: e.muscle || null, target_sets: e.sets, target_reps: String(e.reps), position: pos });
    })));
    db.userPrograms = [{ user_id: 1, program_id: 1, started_on: addDays(t, -9), active: 1 }];

    const find = (needle) => db.foods.find((f) => f.name.toLowerCase().startsWith(needle.toLowerCase())) || db.foods[0];
    const plan = {
      breakfast: [['Oats, rolled', 60, 'g'], ['Milk, whole', 250, 'ml'], ['Egg, whole', 100, 'g']],
      lunch: [['Chicken breast', 180, 'g'], ['White rice', 200, 'g'], ['Broccoli', 120, 'g']],
      dinner: [['Salmon', 160, 'g'], ['Potato', 220, 'g'], ['Olive oil', 10, 'g']],
      snack: [['Greek yogurt', 170, 'g'], ['Banana', 118, 'g'], ['Almonds', 25, 'g']],
    };
    db.meals = [];
    db.seqMeal = 0;
    const nowHour = new Date().getHours();
    for (let back = 20; back >= 0; back -= 1) {
      const day = addDays(t, -back);
      Object.keys(plan).forEach((type, ti) => {
        if (back === 0 && ((type === 'dinner' && nowHour < 18) || (type === 'lunch' && nowHour < 12) || (type === 'snack' && nowHour < 15))) return;
        const skip = H.hash(day + type) % 11 === 0 && back > 0; // some days skipped entries
        if (skip) return;
        plan[type].slice(0, 2 + (H.hash(day + type + 'n') % 2)).forEach(([name, qty, unit], k) => {
          const f = find(name);
          const scale = (0.85 + (H.hash(day + name) % 30) / 100) * qty;
          const factor = scale / 100;
          db.meals.push({
            id: ++db.seqMeal, food_id: f.id, name: f.name, emoji: f.emoji, meal_type: type, quantity: round(scale, 0), unit: unit,
            calories: round(f.calories * factor, 1), protein_g: round(f.protein_g * factor, 1), carbs_g: round(f.carbs_g * factor, 1), fat_g: round(f.fat_g * factor, 1),
            logged_on: day, logged_at: new Date(Date.parse(day + 'T00:00:00Z') + (7 + ti * 5 + k * 0.2) * 3600000).toISOString(),
          });
        });
      });
    }

    db.water = [];
    db.seqWater = 0;
    for (let back = 14; back >= 0; back -= 1) {
      const day = addDays(t, -back);
      const n = back === 0 ? 3 : 5 + (H.hash(day + 'w') % 4);
      for (let k = 0; k < n; k += 1) db.water.push({ id: ++db.seqWater, amount_ml: k % 3 === 0 ? 500 : 250, logged_on: day, logged_at: new Date(Date.parse(day + 'T08:00:00Z') + k * 5400000).toISOString() });
    }

    db.weights = [];
    db.seqWeight = 0;
    for (let back = 60; back >= 0; back -= 1) {
      if (H.hash('w' + back) % 3 === 0 && back !== 0) continue;
      const day = addDays(t, -back);
      const w = 80.4 - (60 - back) * 0.062 + ((H.hash('n' + back) % 9) - 4) / 20;
      db.weights.push({ id: ++db.seqWeight, weight_kg: round(w, 1), body_fat_pct: back % 10 === 0 ? round(19.5 - (60 - back) * 0.03, 1) : null, notes: null, recorded_on: day });
    }

    db.workouts = [];
    db.sets = [];
    db.seqWorkout = 0;
    db.seqSet = 0;
    const prog = PROGRAMS[0];
    for (let back = 34; back >= 1; back -= 1) {
      const day = addDays(t, -back);
      const dow = new Date(day + 'T00:00:00Z').getUTCDay();
      if (![1, 2, 4, 5, 6].includes(dow)) continue;
      const dayIdx = (34 - back) % prog.days.length;
      const d = prog.days[dayIdx];
      const w = { id: ++db.seqWorkout, program_id: 1, workout_type: d.label, duration_minutes: 48 + (H.hash(day) % 25), calories_burned: 280 + (H.hash(day + 'c') % 180), intensity: ['moderate', 'high', 'moderate'][H.hash(day + 'i') % 3], notes: null, performed_on: day, created_at: new Date(Date.parse(day + 'T17:30:00Z')).toISOString() };
      db.workouts.push(w);
      d.exercises.slice(0, 4).forEach((e) => {
        for (let s = 1; s <= Math.min(e.sets, 3); s += 1) {
          db.sets.push({ id: ++db.seqSet, workout_id: w.id, exercise_name: e.name, muscle: e.muscle || null, set_number: s, reps: 6 + (H.hash(day + e.name + s) % 7), weight_kg: 40 + (H.hash(e.name) % 50) + (34 - back) * 0.4, completed: 1 });
        }
      });
    }

    db.goals = [
      { id: 1, title: 'Reach 75 kg', icon: '⚖️', direction: 'decrease', start_value: 80.4, current_value: 0, target_value: 75, unit: 'kg', deadline: addDays(t, 40), completed_at: null, created_at: new Date(now - 50 * DAY).toISOString(), updated_at: new Date(now).toISOString() },
      { id: 2, title: 'Bench press 100 kg', icon: '💪', direction: 'increase', start_value: 70, current_value: 87.5, target_value: 100, unit: 'kg', deadline: addDays(t, 75), completed_at: null, created_at: new Date(now - 40 * DAY).toISOString(), updated_at: new Date(now).toISOString() },
      { id: 3, title: 'Train 4 times a week', icon: '🏋️', direction: 'increase', start_value: 0, current_value: 3, target_value: 4, unit: 'sessions', deadline: null, completed_at: null, created_at: new Date(now - 30 * DAY).toISOString(), updated_at: new Date(now).toISOString() },
      { id: 4, title: 'Log meals 14 days in a row', icon: '📒', direction: 'increase', start_value: 0, current_value: 14, target_value: 14, unit: 'days', deadline: null, completed_at: new Date(now - 6 * DAY).toISOString(), created_at: new Date(now - 25 * DAY).toISOString(), updated_at: new Date(now - 6 * DAY).toISOString() },
    ];
    db.seqGoal = 4;
    const latest = db.weights[db.weights.length - 1];
    db.goals[0].current_value = latest.weight_kg;
  }

  /* ---------- reads ---------- */

  function handle(req, db, H) {
    const { method, path, query, body } = req;
    const b = body || {};
    const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
    const t = today(H);
    const user = db.session ? db.users.find((u) => u.id === db.session.userId) : null;

    const publicUser = (u) => ({
      id: u.id, email: u.email, name: u.name, created_at: u.created_at, sex: u.sex, birth_date: u.birth_date, height_cm: u.height_cm,
      activity_level: u.activity_level, goal_type: u.goal_type, calorie_goal: u.calorie_goal, protein_goal_g: u.protein_goal_g,
      carbs_goal_g: u.carbs_goal_g, fat_goal_g: u.fat_goal_g, water_goal_ml: u.water_goal_ml, units: u.units, theme: u.theme, timezone: u.timezone,
    });
    const ageOf = (birth) => {
      if (!birth) return null;
      const bd = new Date(birth + 'T00:00:00Z');
      const on = new Date(t + 'T00:00:00Z');
      let a = on.getUTCFullYear() - bd.getUTCFullYear();
      const m = on.getUTCMonth() - bd.getUTCMonth();
      if (m < 0 || (m === 0 && on.getUTCDate() < bd.getUTCDate())) a -= 1;
      return a;
    };

    /* --- auth (open) --- */
    if (method === 'GET' && path === '/health') return ok({ status: 'ok', database: 'demo', uptime_seconds: 0, timestamp: new Date().toISOString() });
    if (method === 'POST' && path === '/auth/login') {
      const email = String(b.email || '').trim().toLowerCase();
      const u = db.users.find((x) => x.email === email);
      if (!u || u.password !== String(b.password)) return fail(401, 'Incorrect email or password');
      db.session = { userId: u.id };
      return ok({ user: publicUser(u) });
    }
    if (method === 'POST' && path === '/auth/register') {
      const email = String(b.email || '').trim().toLowerCase();
      const errs = [];
      if (!b.name || String(b.name).trim().length < 2) errs.push({ field: 'name', message: 'Name must be at least 2 characters' });
      if (!/^\S+@\S+\.\S+$/.test(email)) errs.push({ field: 'email', message: 'Enter a valid email address' });
      if (!b.password || String(b.password).length < 8 || !/[a-zA-Z]/.test(b.password) || !/\d/.test(b.password)) errs.push({ field: 'password', message: 'Password must be at least 8 characters with a letter and a number' });
      if (errs.length) return fail(422, 'Please correct the highlighted fields', errs);
      if (db.users.some((x) => x.email === email)) return fail(409, 'An account with that email already exists');
      const targets = energy({ sex: b.sex || 'male', weightKg: b.weight_kg, heightCm: b.height_cm, age: ageOf(b.birth_date), activityLevel: b.activity_level || 'moderate', goalType: b.goal_type || 'maintain' });
      const u = {
        id: Math.max(...db.users.map((x) => x.id)) + 1, email, password: String(b.password), name: String(b.name).trim(), created_at: new Date().toISOString(),
        sex: b.sex || null, birth_date: b.birth_date || null, height_cm: b.height_cm || null, activity_level: b.activity_level || 'moderate', goal_type: b.goal_type || 'maintain',
        calorie_goal: targets ? targets.target_calories : 2000, protein_goal_g: targets ? targets.macros.protein_g : 150, carbs_goal_g: targets ? targets.macros.carbs_g : 220,
        fat_goal_g: targets ? targets.macros.fat_g : 65, water_goal_ml: 2500, units: 'metric', theme: 'dark', timezone: b.timezone || 'UTC',
      };
      db.users.push(u);
      if (b.weight_kg) db.weights.push({ id: ++db.seqWeight, weight_kg: Number(b.weight_kg), body_fat_pct: null, notes: null, recorded_on: t, user_id: u.id });
      db.session = { userId: u.id };
      return ok({ user: publicUser(u) }, 201);
    }
    if (method === 'POST' && path === '/auth/refresh') {
      if (!user) return fail(401, 'No refresh token supplied');
      return ok({ user: publicUser(user) });
    }
    if (method === 'POST' && path === '/auth/logout') {
      db.session = null;
      return noContent();
    }
    if (!user) return fail(401, 'Authentication required');

    const uid = user.id;
    // الحسابات الجديدة بتشوف بياناتها هي بس: كل صف من بيانات البداية متعلّم لمستخدم 1
    const mine = (rows) => rows.filter((r) => (r.user_id === undefined ? uid === 1 : r.user_id === uid));
    const own = (row) => { if (uid !== 1 && row.user_id === undefined) row.user_id = uid; return row; };
    const targets = () => ({ calories: Number(user.calorie_goal ?? 2000), protein_g: Number(user.protein_goal_g ?? 150), carbs_g: Number(user.carbs_goal_g ?? 220), fat_g: Number(user.fat_goal_g ?? 65), water_ml: Number(user.water_goal_ml ?? 2500) });
    const pct = (v, tg) => (tg > 0 ? Math.round((v / tg) * 100) : 0);

    const mealsOn = (day) => mine(db.meals).filter((m) => m.logged_on === day);
    const sum = (rows, k) => rows.reduce((a, r) => a + Number(r[k] || 0), 0);

    function dailySummary(day) {
      const tg = targets();
      const meals = mealsOn(day);
      const works = mine(db.workouts).filter((w) => w.performed_on === day);
      const water = mine(db.water).filter((w) => w.logged_on === day);
      const eaten = r1(sum(meals, 'calories'));
      const burned = r1(sum(works, 'calories_burned'));
      const types = {};
      meals.forEach((m) => { types[m.meal_type] = types[m.meal_type] || { meal_type: m.meal_type, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, entries: 0 }; ['calories', 'protein_g', 'carbs_g', 'fat_g'].forEach((k) => { types[m.meal_type][k] += Number(m[k]); }); types[m.meal_type].entries += 1; });
      return {
        date: day, targets: tg,
        calories: { eaten, burned, net: r1(eaten - burned), goal: tg.calories, remaining: Math.round(tg.calories - eaten + burned), percent: pct(eaten, tg.calories) },
        macros: { protein_g: r1(sum(meals, 'protein_g')), carbs_g: r1(sum(meals, 'carbs_g')), fat_g: r1(sum(meals, 'fat_g')), protein_percent: pct(sum(meals, 'protein_g'), tg.protein_g), carbs_percent: pct(sum(meals, 'carbs_g'), tg.carbs_g), fat_percent: pct(sum(meals, 'fat_g'), tg.fat_g) },
        water: { amount_ml: sum(water, 'amount_ml'), goal_ml: tg.water_ml, percent: pct(sum(water, 'amount_ml'), tg.water_ml) },
        workout: { minutes: sum(works, 'duration_minutes'), sessions: works.length, calories_burned: burned },
        meal_entries: meals.length,
        by_meal_type: Object.values(types).map((x) => ({ ...x, calories: r1(x.calories), protein_g: r1(x.protein_g), carbs_g: r1(x.carbs_g), fat_g: r1(x.fat_g) })),
      };
    }
    function series(days) {
      const end = t;
      const start = addDays(t, -(days - 1));
      const tg = targets();
      return {
        from: start, to: end, targets: tg,
        days: range(start, end).map((d) => {
          const meals = mealsOn(d);
          const works = mine(db.workouts).filter((w) => w.performed_on === d);
          return { date: d, calories_eaten: r1(sum(meals, 'calories')), calories_burned: r1(sum(works, 'calories_burned')), calorie_goal: tg.calories, protein_g: r1(sum(meals, 'protein_g')), carbs_g: r1(sum(meals, 'carbs_g')), fat_g: r1(sum(meals, 'fat_g')), workout_minutes: sum(works, 'duration_minutes'), water_ml: sum(mine(db.water).filter((w) => w.logged_on === d), 'amount_ml') };
        }),
      };
    }
    function streak() {
      const logged = new Set(mine(db.meals).filter((m) => m.logged_on <= t).map((m) => m.logged_on));
      if (!logged.size) return { current: 0, longest: 0, logged_today: false };
      const loggedToday = logged.has(t);
      let cur = 0;
      let cursor = loggedToday ? t : addDays(t, -1);
      while (logged.has(cursor)) { cur += 1; cursor = addDays(cursor, -1); }
      let longest = 0; let run = 0; let prev = null;
      [...logged].sort().forEach((d) => { run = prev && addDays(prev, 1) === d ? run + 1 : 1; longest = Math.max(longest, run); prev = d; });
      return { current: cur, longest, logged_today: loggedToday };
    }
    function adherence(days) {
      const s = series(days);
      const logs = s.days.filter((d) => d.calories_eaten > 0);
      if (!logs.length) return { window_days: days, days_logged: 0, avg_calories: 0, avg_protein_g: 0, avg_carbs_g: 0, avg_fat_g: 0, on_target_days: 0 };
      const mean = (k) => Math.round(logs.reduce((a, d) => a + d[k], 0) / logs.length);
      return { window_days: days, days_logged: logs.length, avg_calories: mean('calories_eaten'), avg_protein_g: mean('protein_g'), avg_carbs_g: mean('carbs_g'), avg_fat_g: mean('fat_g'), on_target_days: logs.filter((d) => Math.abs(d.calories_eaten - s.targets.calories) <= s.targets.calories * 0.1).length };
    }
    function weightEntries(from, to) {
      return mine(db.weights).filter((w) => w.recorded_on >= from && w.recorded_on <= to).sort((a, c) => (a.recorded_on < c.recorded_on ? -1 : 1))
        .map((w) => ({ id: w.id, weight_kg: w.weight_kg, body_fat_pct: w.body_fat_pct, notes: w.notes, recorded_on: w.recorded_on }));
    }
    function weightTrend(days) {
      const entries = weightEntries(addDays(t, -(days - 1)), t);
      if (!entries.length) return { entries: [], first: null, latest: null, change_kg: null, weekly_rate_kg: null, moving_average: [] };
      const first = entries[0];
      const latest = entries[entries.length - 1];
      const change = +(latest.weight_kg - first.weight_kg).toFixed(2);
      const span = Math.max(1, (new Date(latest.recorded_on) - new Date(first.recorded_on)) / DAY);
      return {
        entries, first, latest, change_kg: change, weekly_rate_kg: +((change / span) * 7).toFixed(2),
        moving_average: entries.map((e, i) => { const w = entries.slice(Math.max(0, i - 6), i + 1); return { recorded_on: e.recorded_on, weight_kg: +(w.reduce((a, x) => a + Number(x.weight_kg), 0) / w.length).toFixed(2) }; }),
      };
    }
    function goalView(g) {
      const start = Number(g.start_value); const cur = Number(g.current_value); const tgt = Number(g.target_value);
      const span = Math.abs(tgt - start);
      const travelled = g.direction === 'decrease' ? start - cur : cur - start;
      const percent = span === 0 ? 100 : Math.max(0, Math.min(100, Math.round((travelled / span) * 100)));
      const left = g.deadline ? Math.ceil((new Date(String(g.deadline).slice(0, 10) + 'T00:00:00Z') - Date.now()) / DAY) : null;
      return { ...g, progress_percent: percent, completed: Boolean(g.completed_at), days_remaining: left, overdue: left !== null && left < 0 && !g.completed_at };
    }
    const reached = (g) => (g.direction === 'decrease' ? Number(g.current_value) <= Number(g.target_value) : Number(g.current_value) >= Number(g.target_value));
    function workoutView(w) {
      return { id: w.id, program_id: w.program_id, workout_type: w.workout_type, duration_minutes: w.duration_minutes, calories_burned: w.calories_burned, intensity: w.intensity, notes: w.notes, performed_on: w.performed_on, created_at: w.created_at, sets: db.sets.filter((s) => s.workout_id === w.id).map((s) => ({ id: s.id, workout_id: s.workout_id, exercise_name: s.exercise_name, muscle: s.muscle, set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg, completed: s.completed })) };
    }
    function workoutStats(days) {
      const start = addDays(t, -(days - 1));
      const ws = mine(db.workouts).filter((w) => w.performed_on >= start);
      const setIds = new Set(ws.map((w) => w.id));
      const vol = db.sets.filter((s) => setIds.has(s.workout_id) && s.completed).reduce((a, s) => a + (s.reps || 0) * (s.weight_kg || 0), 0);
      return { window_days: days, sessions: ws.length, total_minutes: sum(ws, 'duration_minutes'), total_calories: sum(ws, 'calories_burned'), active_days: new Set(ws.map((w) => w.performed_on)).size, total_volume_kg: Math.round(vol) };
    }
    function activeProgram() {
      const up = db.userPrograms.find((x) => x.user_id === uid && x.active);
      if (!up) return null;
      const p = db.programs.find((x) => x.id === up.program_id);
      return { id: p.id, slug: p.slug, name: p.name, emoji: p.emoji, days_per_week: p.days_per_week, level: p.level, accent: p.accent, started_on: up.started_on };
    }
    function todaysSession() {
      const program = activeProgram();
      if (!program) return { program: null, day_label: null, exercises: [], logged_today: false };
      const since = Math.floor((new Date(t + 'T00:00:00Z') - new Date(program.started_on + 'T00:00:00Z')) / DAY);
      const dayIndex = ((since % program.days_per_week) + program.days_per_week) % program.days_per_week;
      const ex = db.programExercises.filter((e) => e.program_id === program.id && e.day_index === dayIndex).sort((a, c) => a.position - c.position)
        .map((e) => ({ id: e.id, day_label: e.day_label, name: e.name, muscle: e.muscle, target_sets: e.target_sets, target_reps: e.target_reps, position: e.position }));
      return { program, day_index: dayIndex, day_label: ex[0] ? ex[0].day_label : null, exercises: ex, logged_today: mine(db.workouts).some((w) => w.performed_on === t) };
    }

    /* --- summary --- */
    if (method === 'GET' && path === '/summary') return ok(dailySummary(query.date || t));
    if (method === 'GET' && path === '/summary/series') return ok(series(Math.min(Math.max(num(query.days, 7), 1), 365)));
    if (method === 'GET' && path === '/summary/streak') return ok(streak());
    if (method === 'GET' && path === '/summary/adherence') return ok(adherence(Math.min(Math.max(num(query.days, 7), 1), 365)));
    if (method === 'GET' && path === '/summary/dashboard') {
      return ok({
        today: dailySummary(t), week: series(7), streak: streak(), weight: weightTrend(30), training: workoutStats(7),
        goals: mine(db.goals).map(goalView).filter((g) => !g.completed).slice(0, 4), session: todaysSession(),
      });
    }
    if (method === 'GET' && path === '/tdee') {
      const r = energy({ sex: query.sex || 'male', weightKg: num(query.weight_kg), heightCm: num(query.height_cm), age: num(query.age), activityLevel: query.activity_level || 'moderate', goalType: query.goal_type || 'maintain' });
      return r ? ok(r) : fail(422, 'Weight, height and age are required');
    }

    /* --- profile --- */
    if (method === 'GET' && path === '/auth/me') return ok({ user: publicUser(user) });
    if (method === 'GET' && path === '/auth/sessions') return ok({ sessions: [{ id: 1, user_agent: 'This browser', ip_address: null, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * DAY).toISOString() }] });
    if (method === 'POST' && path === '/auth/change-password') {
      if (user.password !== String(b.current_password)) return fail(401, 'Current password is incorrect');
      user.password = String(b.new_password);
      db.session = null;
      return noContent();
    }
    if (method === 'GET' && path === '/users/me') return ok({ profile: publicUser(user) });
    if (method === 'PATCH' && path === '/users/me') {
      ['name', 'sex', 'birth_date', 'height_cm', 'activity_level', 'goal_type', 'calorie_goal', 'protein_goal_g', 'carbs_goal_g', 'fat_goal_g', 'water_goal_ml', 'units', 'theme', 'timezone'].forEach((k) => { if (b[k] !== undefined) user[k] = b[k]; });
      return ok({ profile: publicUser(user) });
    }
    if (method === 'POST' && path === '/users/me/recalculate-targets') {
      const w = weightEntries('0000-01-01', t).slice(-1)[0];
      const e = energy({ sex: user.sex, weightKg: w ? w.weight_kg : null, heightCm: user.height_cm, age: ageOf(user.birth_date), activityLevel: user.activity_level, goalType: user.goal_type });
      const applied = e ? { calories: e.target_calories, protein_g: e.macros.protein_g, carbs_g: e.macros.carbs_g, fat_g: e.macros.fat_g } : { calories: 2000, protein_g: 150, carbs_g: 220, fat_g: 65 };
      user.calorie_goal = applied.calories; user.protein_goal_g = applied.protein_g; user.carbs_goal_g = applied.carbs_g; user.fat_goal_g = applied.fat_g;
      return ok({ profile: publicUser(user), applied, based_on_weight_kg: w ? w.weight_kg : null });
    }
    if (method === 'GET' && path === '/users/me/export') {
      return { status: 200, raw: true, headers: { 'Content-Disposition': 'attachment; filename="fittrack-export.json"' }, body: JSON.stringify({ exported_at: new Date().toISOString(), user: publicUser(user), meals: mine(db.meals), weight: mine(db.weights), goals: mine(db.goals), workouts: mine(db.workouts) }) };
    }
    if (method === 'DELETE' && path === '/users/me') {
      if (uid === 1) return fail(403, 'The demo account cannot be deleted — use "Reset demo data" instead');
      db.users = db.users.filter((u) => u.id !== uid);
      db.session = null;
      return noContent();
    }

    /* --- meals --- */
    if (method === 'GET' && path === '/meals') {
      let list = mine(db.meals);
      if (query.from && query.to) list = list.filter((m) => m.logged_on >= query.from && m.logged_on <= query.to);
      else list = list.filter((m) => m.logged_on === (query.date || t));
      if (query.meal_type) list = list.filter((m) => m.meal_type === query.meal_type);
      return ok({ meals: list.sort((a, c) => (a.logged_at < c.logged_at ? 1 : -1) || c.id - a.id).map(({ user_id, ...m }) => m) });
    }
    if (method === 'GET' && path === '/meals/frequent') {
      const groups = {};
      mine(db.meals).forEach((m) => { const k = [m.name, m.meal_type, m.food_id, m.unit].join('|'); (groups[k] = groups[k] || []).push(m); });
      const rows = Object.values(groups).map((g) => {
        const avg = (k, d) => round(sum(g, k) / g.length, d);
        return { name: g[0].name, emoji: g[0].emoji, meal_type: g[0].meal_type, food_id: g[0].food_id, unit: g[0].unit, quantity: avg('quantity', 0), calories: avg('calories', 0), protein_g: avg('protein_g', 1), carbs_g: avg('carbs_g', 1), fat_g: avg('fat_g', 1), times_logged: g.length, last_logged_at: g.map((m) => m.logged_at).sort().pop() };
      }).sort((a, c) => c.times_logged - a.times_logged || (a.last_logged_at < c.last_logged_at ? 1 : -1)).slice(0, 8);
      return ok({ meals: rows });
    }
    if (method === 'POST' && path === '/meals') {
      let v = { food_id: b.food_id || null, name: b.name, emoji: b.emoji || null, calories: b.calories, protein_g: b.protein_g || 0, carbs_g: b.carbs_g || 0, fat_g: b.fat_g || 0 };
      const quantity = num(b.quantity, 100);
      if (b.food_id) {
        const f = db.foods.find((x) => x.id === Number(b.food_id) && (f_visible(x)));
        if (!f) return fail(422, 'That food is not in the catalog');
        const factor = quantity / Number(f.serving_size || 100);
        const sc = (n) => round(Number(n || 0) * factor, 2);
        v = { food_id: f.id, name: b.name || f.name, emoji: b.emoji || f.emoji, calories: b.calories !== undefined ? b.calories : sc(f.calories), protein_g: b.calories !== undefined ? b.protein_g || 0 : sc(f.protein_g), carbs_g: b.calories !== undefined ? b.carbs_g || 0 : sc(f.carbs_g), fat_g: b.calories !== undefined ? b.fat_g || 0 : sc(f.fat_g) };
      } else if (!b.name || b.calories === undefined) {
        return fail(422, 'Please correct the highlighted fields', [{ field: 'name', message: 'Provide either food_id, or both name and calories' }]);
      }
      const m = own({ id: ++db.seqMeal, ...v, meal_type: b.meal_type || 'lunch', quantity, unit: b.unit || 'g', logged_on: b.logged_on || t, logged_at: new Date().toISOString() });
      db.meals.push(m);
      const { user_id, ...pub } = m;
      return ok({ meal: pub }, 201);
    }
    let m = /^\/meals\/(\d+)$/.exec(path);
    if (m) {
      const meal = mine(db.meals).find((x) => x.id === Number(m[1]));
      if (!meal) return fail(404, 'Meal not found');
      if (method === 'PATCH') {
        ['name', 'emoji', 'meal_type', 'quantity', 'unit', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'logged_on'].forEach((k) => { if (b[k] !== undefined) meal[k] = b[k]; });
        const { user_id, ...pub } = meal;
        return ok({ meal: pub });
      }
      if (method === 'DELETE') { db.meals = db.meals.filter((x) => x.id !== meal.id); return noContent(); }
    }

    /* --- foods --- */
    function f_visible(f) { return f.created_by === null || f.created_by === uid; }
    if (method === 'GET' && path === '/foods/search') {
      const q = String(query.q || '').trim().toLowerCase();
      if (!q) return ok({ foods: [], source: 'local' });
      const limit = Math.min(Math.max(num(query.limit, 20), 1), 50);
      const hits = db.foods.filter((f) => f_visible(f) && (f.name.toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q)))
        .sort((a, c) => (a.name.toLowerCase().startsWith(q) ? 0 : 1) - (c.name.toLowerCase().startsWith(q) ? 0 : 1) || (c.source === 'custom') - (a.source === 'custom') || a.name.length - c.name.length).slice(0, limit);
      return ok({ foods: hits, source: 'local' });
    }
    if (method === 'GET' && path === '/foods/stats') {
      const by = { seed: 0, usda: 0, custom: 0 };
      db.foods.forEach((f) => { by[f.source] += 1; });
      return ok({ total: db.foods.length, usda: by.usda, seed: by.seed, custom: by.custom, usda_api_enabled: false });
    }
    if (method === 'POST' && path === '/foods') {
      if (!b.name || b.calories === undefined) return fail(422, 'Please correct the highlighted fields', [{ field: 'name', message: 'Name and calories are required' }]);
      const f = { id: ++db.seqFood, source: 'custom', fdc_id: null, name: b.name, brand: b.brand || null, category: b.category || null, emoji: b.emoji || null, serving_size: num(b.serving_size, 100), serving_unit: b.serving_unit || 'g', calories: num(b.calories, 0), protein_g: num(b.protein_g, 0), carbs_g: num(b.carbs_g, 0), fat_g: num(b.fat_g, 0), fiber_g: b.fiber_g ?? null, sugar_g: b.sugar_g ?? null, sodium_mg: b.sodium_mg ?? null, created_by: uid };
      db.foods.push(f);
      return ok({ food: f }, 201);
    }
    m = /^\/foods\/(\d+)$/.exec(path);
    if (m) {
      const f = db.foods.find((x) => x.id === Number(m[1]) && f_visible(x));
      if (!f) return fail(404, 'Food not found');
      if (method === 'GET') return ok({ food: f });
      if (f.created_by !== uid) return fail(404, 'Custom food not found');
      if (method === 'PATCH') { Object.keys(b).forEach((k) => { if (k in f && k !== 'id' && k !== 'created_by' && k !== 'source') f[k] = b[k]; }); return ok({ food: f }); }
      if (method === 'DELETE') { db.foods = db.foods.filter((x) => x.id !== f.id); return noContent(); }
    }

    /* --- water --- */
    const waterDay = (d) => {
      const rows = mine(db.water).filter((w) => w.logged_on === d);
      const amount = sum(rows, 'amount_ml');
      const goal = targets().water_ml;
      return { date: d, amount_ml: amount, goal_ml: goal, percent: pct(amount, goal), entries: rows.length };
    };
    if (method === 'GET' && path === '/water') {
      const d = query.date || t;
      return ok({ ...waterDay(d), log: mine(db.water).filter((w) => w.logged_on === d).sort((a, c) => c.id - a.id).map((w) => ({ id: w.id, amount_ml: w.amount_ml, logged_at: w.logged_at })) });
    }
    if (method === 'POST' && path === '/water') {
      const amount = num(b.amount_ml, 0);
      if (!(amount > 0 && amount <= 5000)) return fail(422, 'Please correct the highlighted fields', [{ field: 'amount_ml', message: 'Enter an amount between 1 and 5000 ml' }]);
      const d = b.date || t;
      db.water.push(own({ id: ++db.seqWater, amount_ml: amount, logged_on: d, logged_at: new Date().toISOString() }));
      return ok(waterDay(d), 201);
    }
    if (method === 'DELETE' && path === '/water/last') {
      const d = query.date || (b && b.date) || t;
      const last = mine(db.water).filter((w) => w.logged_on === d).sort((a, c) => c.id - a.id)[0];
      if (!last) return fail(404, 'Nothing logged to undo');
      db.water = db.water.filter((w) => w.id !== last.id);
      return ok(waterDay(d));
    }

    /* --- weight --- */
    if (method === 'GET' && path === '/weight') {
      const from = query.from || addDays(t, -(num(query.days, 180) - 1));
      const entries = weightEntries(from, query.to || t);
      return ok({ entries, latest: entries.length ? entries[entries.length - 1] : null });
    }
    if (method === 'GET' && path === '/weight/trend') return ok(weightTrend(Math.min(Math.max(num(query.days, 30), 1), 365)));
    if (method === 'POST' && path === '/weight') {
      const kg = num(b.weight_kg);
      if (!(kg >= 25 && kg <= 400)) return fail(422, 'Please correct the highlighted fields', [{ field: 'weight_kg', message: 'Enter a weight between 25 and 400 kg' }]);
      const d = b.recorded_on || t;
      let e = mine(db.weights).find((w) => w.recorded_on === d);
      if (e) { e.weight_kg = kg; e.body_fat_pct = b.body_fat_pct ?? null; e.notes = b.notes ?? null; }
      else { e = own({ id: ++db.seqWeight, weight_kg: kg, body_fat_pct: b.body_fat_pct ?? null, notes: b.notes ?? null, recorded_on: d }); db.weights.push(e); }
      const goal = mine(db.goals).find((g) => g.unit === 'kg' && g.direction === 'decrease' && !g.completed_at);
      if (goal && d === t) { goal.current_value = kg; if (reached(goal)) goal.completed_at = new Date().toISOString(); }
      return ok({ entry: { id: e.id, weight_kg: e.weight_kg, body_fat_pct: e.body_fat_pct, notes: e.notes, recorded_on: e.recorded_on } }, 201);
    }
    m = /^\/weight\/(\d+)$/.exec(path);
    if (m && method === 'DELETE') {
      const e = mine(db.weights).find((w) => w.id === Number(m[1]));
      if (!e) return fail(404, 'Weight entry not found');
      db.weights = db.weights.filter((w) => w.id !== e.id);
      return noContent();
    }

    /* --- goals --- */
    if (method === 'GET' && path === '/goals') {
      const inc = query.include_completed === undefined ? true : ['true', '1'].includes(String(query.include_completed));
      return ok({ goals: mine(db.goals).map(goalView).filter((g) => inc || !g.completed).sort((a, c) => (a.completed - c.completed) || ((a.deadline || '9') < (c.deadline || '9') ? -1 : 1)) });
    }
    if (method === 'POST' && path === '/goals') {
      if (!b.title || b.target_value === undefined || b.current_value === undefined) return fail(422, 'Please correct the highlighted fields', [{ field: 'title', message: 'Title, current and target values are required' }]);
      const g = own({ id: ++db.seqGoal, title: b.title, icon: b.icon || '🎯', direction: b.direction || 'increase', start_value: b.start_value ?? b.current_value, current_value: Number(b.current_value), target_value: Number(b.target_value), unit: b.unit || '', deadline: b.deadline || null, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      if (reached(g)) g.completed_at = new Date().toISOString();
      db.goals.push(g);
      return ok({ goal: goalView(g) }, 201);
    }
    m = /^\/goals\/(\d+)$/.exec(path);
    if (m) {
      const g = mine(db.goals).find((x) => x.id === Number(m[1]));
      if (!g) return fail(404, 'Goal not found');
      if (method === 'PATCH') {
        ['title', 'icon', 'direction', 'start_value', 'current_value', 'target_value', 'unit', 'deadline'].forEach((k) => { if (b[k] !== undefined) g[k] = b[k]; });
        g.completed_at = reached(g) ? g.completed_at || new Date().toISOString() : null;
        g.updated_at = new Date().toISOString();
        return ok({ goal: goalView(g) });
      }
      if (method === 'DELETE') { db.goals = db.goals.filter((x) => x.id !== g.id); return noContent(); }
    }

    /* --- workouts + programs --- */
    if (method === 'GET' && path === '/workouts/stats') return ok(workoutStats(Math.min(Math.max(num(query.days, 30), 7), 365)));
    if (method === 'GET' && path === '/workouts/today') return ok(todaysSession());
    if (method === 'GET' && path === '/workouts') {
      const from = query.from || addDays(t, -(num(query.days, 30) - 1));
      const list = mine(db.workouts).filter((w) => w.performed_on >= from && w.performed_on <= (query.to || t)).sort((a, c) => (a.performed_on < c.performed_on ? 1 : -1) || c.id - a.id).slice(0, Math.min(num(query.limit, 50), 200));
      return ok({ workouts: list.map(workoutView) });
    }
    if (method === 'POST' && path === '/workouts') {
      if (!b.workout_type || !(num(b.duration_minutes) >= 1)) return fail(422, 'Please correct the highlighted fields', [{ field: 'workout_type', message: 'What kind of session was it?' }]);
      const w = own({ id: ++db.seqWorkout, program_id: b.program_id || null, workout_type: b.workout_type, duration_minutes: num(b.duration_minutes), calories_burned: num(b.calories_burned, 0), intensity: b.intensity || 'moderate', notes: b.notes || null, performed_on: b.performed_on || t, created_at: new Date().toISOString() });
      db.workouts.push(w);
      (b.sets || []).forEach((s) => db.sets.push({ id: ++db.seqSet, workout_id: w.id, exercise_name: s.exercise_name, muscle: s.muscle || null, set_number: s.set_number, reps: s.reps ?? null, weight_kg: s.weight_kg ?? null, completed: s.completed === false ? 0 : 1 }));
      return ok({ workout: workoutView(w) }, 201);
    }
    m = /^\/workouts\/(\d+)(?:\/sets\/(\d+))?$/.exec(path);
    if (m) {
      const w = mine(db.workouts).find((x) => x.id === Number(m[1]));
      if (!w) return fail(404, 'Workout not found');
      if (method === 'DELETE' && !m[2]) { db.workouts = db.workouts.filter((x) => x.id !== w.id); db.sets = db.sets.filter((s) => s.workout_id !== w.id); return noContent(); }
      if (method === 'PATCH' && m[2]) {
        const s = db.sets.find((x) => x.id === Number(m[2]) && x.workout_id === w.id);
        if (!s) return fail(404, 'Set not found');
        s.completed = b.completed ? 1 : 0;
        return ok({ workout: workoutView(w) });
      }
    }
    if (method === 'GET' && path === '/programs') {
      const up = db.userPrograms.find((x) => x.user_id === uid && x.active);
      return ok({ programs: db.programs.map((p) => ({ id: p.id, slug: p.slug, name: p.name, emoji: p.emoji, description: p.description, days_per_week: p.days_per_week, level: p.level, accent: p.accent, is_active: up && up.program_id === p.id ? 1 : 0, exercise_count: db.programExercises.filter((e) => e.program_id === p.id).length })) });
    }
    m = /^\/programs\/(\d+)\/select$/.exec(path);
    if (method === 'POST' && m) {
      const p = db.programs.find((x) => x.id === Number(m[1]));
      if (!p) return fail(404, 'Program not found');
      db.userPrograms.forEach((x) => { if (x.user_id === uid) x.active = 0; });
      db.userPrograms.push({ user_id: uid, program_id: p.id, started_on: t, active: 1 });
      return ok({ program: activeProgram() });
    }

    return null;
  }

  createDemo({
    key: 'fittrack_demo_db',
    version: 1,
    prefix: '/api',
    seed,
    handle,
    notFound: () => ({ error: { message: 'This route is not available in the demo' } }),
    serverError: () => ({ error: { message: 'Something went wrong in the demo' } }),
    bar: {
      label: 'Demo version',
      openFirst: true,
      intro: 'A read-only showcase with fake data stored in your browser only. Sign in with the demo account:',
      actions: [
        { label: 'Sign in as the demo user', primary: true, run: (a) => { a.db().session = { userId: 1 }; a.go('/'); } },
      ],
      note: 'Or use demo@fittrack.demo / Demo1234. You can also register a fresh (empty) account. Nothing leaves your device.',
    },
  });
})();
