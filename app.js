// סבב — כל הנתונים נשמרים רק במכשיר (localStorage), כאובייקט JSON אחד.
const SCHEMA_VERSION = 2; // מעלים כשמבנה הנתונים משתנה, כדי לדעת להמיר גיבויים ישנים
const KEY = 'savav';
const MODES = ['combat', 'base', 'training', 'home', 'leave'];
const ARMY = ['combat', 'base', 'training'];

const T = {
  he: {
    appName: 'סבב', settings: 'הגדרות', general: 'כללי',
    export: 'ייצוא גיבוי', import: 'ייבוא גיבוי', otherLang: 'English',
    exported: 'הקובץ נשמר בתיקיית ההורדות.',
    importConfirm: 'הייבוא יחליף את כל הנתונים במכשיר. להמשיך?',
    importOk: 'הגיבוי יובא.', importBad: 'הקובץ לא תקין. שום דבר לא שונה.',
    combat: 'לחימה', base: 'בסיס', training: 'אימונים', home: 'בית', leave: 'חופשה ארוכה',
    mode: 'מצב', hardDay: 'יום קשה', emptyPlan: 'אין משימות בתבנית הזו.',
    homePeriods: 'תאריכי בית', from: 'מ-', to: 'עד', add: 'הוסף', delete: 'מחק', none: 'אין עדיין.',
    armyModes: 'מצבי צבא מתוכננים', armyModesHint: 'המצב חל מהתאריך הזה והלאה בימי צבא. ברירת מחדל: לחימה.',
    templates: 'תבניות יום', templatesHint: 'שורה לכל משימה. אחרי | כותבים את גרסת "יום קשה".',
    save: 'שמור', saved: 'נשמר.', confirmDelete: 'למחוק?',
    badDates: 'תאריכים לא תקינים.', overlap: 'התאריכים חופפים לתקופת בית קיימת.',
    setEnd: 'נפתחה תקופת בית מהיום. עדכן את תאריך החזרה בהגדרות.',
    tourArmy: (n, d) => `סבב ${n} · עוד ${d} ימים הביתה`,
    tourHome: (n, k, m) => `סבב ${n} · בית, יום ${k} מתוך ${m}`,
    tourNoHome: n => `סבב ${n} · הזן תאריכי בית בהגדרות`,
    fitness: 'כושר', today: 'היום', exam: 'יום בוחן', basketball: 'כדורסל', volleyball: 'כדורעף',
    records: 'הישגים', height: 'גובה (ס"מ)', rules: 'כללי התקדמות', weighIn: 'שקילה שבועית',
    protein: g => (g ? `יעד חלבון: ${g} ג'` : 'יעד חלבון (הזן משקל בכושר)'),
    pullup: 'מתח', bench: "בנץ'", run3k: '3 ק"מ', run5k: '5 ק"מ', weight: 'משקל',
    ask: { pullup: 'מתח: משקל נוסף וחזרות (למשל 15x8)', bench: "בנץ': משקל וחזרות (למשל 60x18)",
      run3k: '3 ק"מ: זמן (למשל 11:30)', run5k: '5 ק"מ: זמן (למשל 21:40)', weight: 'משקל גוף בק"ג (למשל 72.5)' },
    badValue: 'הערך לא תקין, לא נשמר.',
    estimate: (orm, pu, run) => `בנץ' מקסימום משוער: ${orm} ק"ג · מתח: ${pu} · 3 ק"מ: ${run}`,
  },
  en: {
    appName: 'Savav', settings: 'Settings', general: 'General',
    export: 'Export backup', import: 'Import backup', otherLang: 'עברית',
    exported: 'File saved to Downloads.',
    importConfirm: 'Import replaces all data on this device. Continue?',
    importOk: 'Backup imported.', importBad: 'Invalid file. Nothing was changed.',
    combat: 'Combat', base: 'Base', training: 'Training', home: 'Home', leave: 'Long leave',
    mode: 'Mode', hardDay: 'Hard day', emptyPlan: 'No tasks in this template.',
    homePeriods: 'Home dates', from: 'From', to: 'To', add: 'Add', delete: 'Delete', none: 'None yet.',
    armyModes: 'Planned army modes', armyModesHint: 'Applies from this date on, on army days. Default: combat.',
    templates: 'Day templates', templatesHint: 'One task per line. After | write the "hard day" version.',
    save: 'Save', saved: 'Saved.', confirmDelete: 'Delete?',
    badDates: 'Invalid dates.', overlap: 'Dates overlap an existing home period.',
    setEnd: 'A home period starting today was added. Set the return date in Settings.',
    tourArmy: (n, d) => `Round ${n} · ${d} days to home`,
    tourHome: (n, k, m) => `Round ${n} · home, day ${k} of ${m}`,
    tourNoHome: n => `Round ${n} · add home dates in Settings`,
    fitness: 'Fitness', today: 'Today', exam: 'Test day', basketball: 'Basketball', volleyball: 'Volleyball',
    records: 'Records', height: 'Height (cm)', rules: 'Progression rules', weighIn: 'Weekly weigh-in',
    protein: g => (g ? `Protein target: ${g} g` : 'Protein target (log weight in Fitness)'),
    pullup: 'Pull-ups', bench: 'Bench', run3k: '3 km', run5k: '5 km', weight: 'Weight',
    ask: { pullup: 'Pull-ups: added kg and reps (e.g. 15x8)', bench: 'Bench: kg and reps (e.g. 60x18)',
      run3k: '3 km: time (e.g. 11:30)', run5k: '5 km: time (e.g. 21:40)', weight: 'Body weight in kg (e.g. 72.5)' },
    badValue: 'Invalid value, not saved.',
    estimate: (orm, pu, run) => `Bench est. max: ${orm} kg · Pull-ups: ${pu} · 3 km: ${run}`,
  },
};

const task = (t, min = t) => ({ t, min });
function defaultTemplates() {
  const combat = [
    task("Duolingo צרפתית 10 דק'", 'Duolingo צרפתית: שיעור אחד'),
    task("Duolingo Music 5 דק'", 'Duolingo Music: שיעור אחד'),
  ];
  const base = [...combat, task('משימת שיחה בצרפתית', 'משפט אחד עם חבר')];
  return {
    combat, base, training: base,
    home: [
      task('פסנתר שעה', "פסנתר 15 דק'"),
      task("צרפתית ודקדוק 30 דק'", 'Duolingo צרפתית: שיעור אחד'),
      task('פרויקט Claude שעה', "פרויקט Claude 20 דק'"),
    ],
    leave: [
      task('פסנתר שעה וחצי', "פסנתר 15 דק'"),
      task("צרפתית ודקדוק 45 דק'", 'Duolingo צרפתית: שיעור אחד'),
      task('פרויקט Claude שעתיים', "פרויקט Claude 20 דק'"),
    ],
  };
}

function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { lang: 'he' },
    homePeriods: [],  // [{start, end, mode: 'home'|'leave'}], ממוין לפי start
    armyModes: [],    // [{from, mode}], ממוין לפי from
    templates: defaultTemplates(), // {mode: [{t, min}]} — בלי אימון וחלבון, אותם fitness.js מוסיף
    days: {},         // {'YYYY-MM-DD': {done: [task title], hard, w: workout id, exam, extra: []}}
    records: [],      // [{date, kind, kg?, reps?, sec?, source: 'manual'}] — source מוכן ל-Garmin בעתיד
  };
}

const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const optArr = (a, ok) => a === undefined || (Array.isArray(a) && a.every(ok));

// בדיקת תקינות לכל מה שנכנס מבחוץ (קובץ גיבוי, ובהמשך JSON מ-Claude)
function isValidBackup(d) {
  return isObj(d) && Number.isInteger(d.schemaVersion) && d.schemaVersion >= 1 && d.schemaVersion <= SCHEMA_VERSION
    && isObj(d.settings)
    && optArr(d.homePeriods, p => isObj(p) && isDate(p.start) && isDate(p.end) && p.start <= p.end && ['home', 'leave'].includes(p.mode))
    && optArr(d.armyModes, a => isObj(a) && isDate(a.from) && ARMY.includes(a.mode))
    && (d.templates === undefined || (isObj(d.templates)
      && Object.values(d.templates).every(l => optArr(l, x => isObj(x) && typeof x.t === 'string' && typeof x.min === 'string'))))
    && (d.days === undefined || (isObj(d.days)
      && Object.values(d.days).every(x => isObj(x) && optArr(x.done, s => typeof s === 'string')
        && (x.w === undefined || W_IDS.includes(x.w)) && optArr(x.extra, s => typeof s === 'string'))))
    && optArr(d.records, r => isObj(r) && isDate(r.date) && KINDS.includes(r.kind)
      && ['kg', 'reps', 'sec'].every(k => r[k] === undefined || (Number.isFinite(r[k]) && r[k] >= 0)))
    && (d.settings.height === undefined || Number.isFinite(d.settings.height));
}

// גרסה 1 -> 2: האימון והחלבון עברו מהתבניות ל-fitness.js
const OLD_FITNESS_TASKS = ['אימון משקל גוף (אם יש זמן)', 'אימון כוח', 'אימון כוח או ריצה', 'יעד חלבון'];
function migrate(d) {
  const templates = { ...d.templates };
  if (d.schemaVersion < 2) for (const m in templates) templates[m] = templates[m].filter(x => !OLD_FITNESS_TASKS.includes(x.t));
  return { ...d, templates, schemaVersion: SCHEMA_VERSION };
}

// מוסיף ברירות מחדל לשדות חדשים, כך שגיבוי ישן עדיין נטען
function withDefaults(d) {
  const def = defaultState();
  return { ...def, ...d, settings: { ...def.settings, ...d.settings }, templates: { ...def.templates, ...d.templates } };
}

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return defaultState();
  try {
    const d = JSON.parse(raw);
    if (isValidBackup(d)) return withDefaults(migrate(d));
  } catch {}
  localStorage.setItem(KEY + '-broken', raw); // לא מוחקים נתונים פגומים, שומרים עותק בצד
  return defaultState();
}

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

// תאריכים: מחרוזות 'YYYY-MM-DD' לפי שעון מקומי (לא UTC, כדי שאחרי חצות זה יהיה היום הנכון)
const pad = n => String(n).padStart(2, '0');
const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

const homePeriodAt = date => state.homePeriods.find(p => p.start <= date && date <= p.end);
const overlaps = (s, e, skip) => state.homePeriods.some((p, i) => i !== skip && p.start <= e && s <= p.end);
const byKey = k => (a, b) => (a[k] < b[k] ? -1 : 1);

function modeAt(date) {
  const p = homePeriodAt(date);
  if (p) return p.mode;
  return state.armyModes.filter(a => a.from <= date).pop()?.mode ?? 'combat';
}

// סבב = ימי הצבא שלפני תקופת בית + תקופת הבית עצמה
function tourInfo(date) {
  const ps = state.homePeriods, i = ps.findIndex(p => p.end >= date), p = ps[i];
  const n = (i === -1 ? ps.length : i) + 1;
  if (!p) return t('tourNoHome')(n);
  if (p.start <= date) return t('tourHome')(n, daysBetween(p.start, date) + 1, daysBetween(p.start, p.end) + 1);
  return t('tourArmy')(n, daysBetween(date, p.start));
}

function setTodayMode(m) {
  const today = iso(), p = homePeriodAt(today);
  if (ARMY.includes(m)) {
    if (p && p.start === today) state.homePeriods.splice(state.homePeriods.indexOf(p), 1);
    else if (p) p.end = addDays(today, -1); // חזרה מוקדמת מהבית
    state.armyModes = state.armyModes.filter(a => a.from !== today).concat({ from: today, mode: m }).sort(byKey('from'));
  } else if (p) {
    p.mode = m;
  } else {
    state.homePeriods.push({ start: today, end: today, mode: m });
    state.homePeriods.sort(byKey('start'));
    say(t('setEnd'));
  }
}

const parseTemplate = text => text.split('\n').map(l => l.split('|').map(s => s.trim()))
  .filter(([title]) => title).map(([title, min]) => task(title, min || title));
const templateText = list => list.map(x => (x.min === x.t ? x.t : `${x.t} | ${x.min}`)).join('\n');

let state = load();
const $ = id => document.getElementById(id);
const t = k => T[state.settings.lang][k];
const say = text => { $('msg').textContent = text; };
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const fmt = s => new Date(s + 'T12:00').toLocaleDateString(state.settings.lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'numeric' });
const fillModes = (sel, list, value) => {
  sel.innerHTML = list.map(m => `<option value="${m}">${t(m)}</option>`).join('');
  sel.value = value;
};
const today = () => state.days[iso()] ??= { done: [], hard: false };

function render() {
  const lang = state.settings.lang, date = iso(), mode = modeAt(date);
  const day = state.days[date] || { done: [], hard: false };
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('appName');
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.tLabel)));
  $('lang').textContent = t('otherLang');
  $('today').textContent = new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' });
  $('tour').textContent = tourInfo(date);

  fillModes($('mode'), MODES, mode);
  $('hard').setAttribute('aria-pressed', !!day.hard);
  const wid = workoutId(date), w = workoutDef(wid, date);
  const lastWeight = state.records.filter(r => r.kind === 'weight').map(r => r.date).sort().pop();
  const li = (attr, checked, text, sub = '') => `<li><label><input type="checkbox" ${attr} ${checked ? 'checked' : ''}>
      <span>${esc(text)}${sub && `<small>${sub}</small>`}</span></label></li>`;
  $('plan').innerHTML = li(`data-w="${wid}"`, day.w === wid || (wid === 'exam' && day.exam && day.w === 'exam'),
      day.hard ? w.min : w.t, day.hard ? '' : w.items.map(esc).join('<br>'))
    + state.templates[mode].map(x => li(`data-task="${esc(x.t)}"`, day.done.includes(x.t), day.hard ? x.min : x.t)).join('')
    + li('data-task="protein"', day.done.includes('protein'), t('protein')(proteinGrams()))
    + (isHome(date) && (!lastWeight || lastWeight === date || daysBetween(lastWeight, date) >= 7)
      ? li('data-weigh', lastWeight === date, t('weighIn')) : '');

  $('exam').setAttribute('aria-pressed', !!day.exam);
  $('extra').innerHTML = ['basketball', 'volleyball'].map(k =>
    `<button data-extra="${k}" aria-pressed="${!!day.extra?.includes(k)}">${t(k)}</button>`).join('');
  $('recButtons').innerHTML = KINDS.map(k => `<button data-rec="${k}">${t(k)}</button>`).join('');
  $('height').value = state.settings.height ?? '';
  const pu = latest('pullup');
  $('estimate').textContent = t('estimate')(Math.round(oneRepMax(latest('bench'))), `${pu.kg}×${pu.reps}`, mmss(latest('run3k').sec));
  $('recList').innerHTML = state.records.map((r, i) => [r, i]).sort((a, b) => (a[0].date < b[0].date ? 1 : -1)).slice(0, 10)
    .map(([r, i]) => `<li class="row">${fmt(r.date)} · ${t(r.kind)} ${recordText(r)} <button data-del="${i}">${t('delete')}</button></li>`).join('')
    || `<li class="dim">${t('none')}</li>`;

  $('periods').innerHTML = state.homePeriods.map((p, i) => `<li class="row">
      ${fmt(p.start)} – <input type="date" data-end="${i}" value="${p.end}" min="${p.start}" aria-label="${t('to')}">
      <span class="dim">${t(p.mode)}</span> <button data-del="${i}">${t('delete')}</button></li>`).join('')
    || `<li class="dim">${t('none')}</li>`;
  $('armyList').innerHTML = state.armyModes.map((a, i) => `<li class="row">
      ${fmt(a.from)} · ${t(a.mode)} <button data-del="${i}">${t('delete')}</button></li>`).join('')
    || `<li class="dim">${t('none')}</li>`;
  fillModes($('aMode'), ARMY, $('aMode').value || 'base');
  fillModes($('tMode'), MODES, $('tMode').value || mode);
}

// --- מסך ראשי ---
$('mode').onchange = e => { setTodayMode(e.target.value); save(); render(); };
$('hard').onclick = () => { const d = today(); d.hard = !d.hard; save(); render(); };
$('plan').onchange = e => {
  const d = today(), { task: k, w } = e.target.dataset, on = e.target.checked;
  if ('weigh' in e.target.dataset) { if (on) askRecord('weight'); }
  else if (w) {
    if (on && w === 'test') ['pullup', 'bench', 'run3k'].forEach(askRecord);
    if (on) d.w = w; else delete d.w;
  } else d.done = on ? [...d.done, k] : d.done.filter(x => x !== k);
  save(); render();
};

// שואל ערך בחלון קטן ושומר הישג. ביטול = לא שומר כלום.
function askRecord(kind) {
  const text = prompt(t('ask')[kind]);
  if (text === null) return;
  const rec = parseRecord(kind, text);
  if (!rec) return say(t('badValue'));
  state.records.push({ date: iso(), kind, ...rec, source: 'manual' });
}

// --- כושר ---
$('exam').onclick = () => { const d = today(); d.exam = !d.exam; if (!d.exam && d.w === 'exam') delete d.w; save(); render(); };
$('extra').onclick = e => {
  const k = e.target.dataset.extra;
  if (!k) return;
  const d = today(), x = d.extra || [];
  d.extra = x.includes(k) ? x.filter(v => v !== k) : [...x, k];
  save(); render();
};
$('recButtons').onclick = e => { const k = e.target.dataset.rec; if (k) { askRecord(k); save(); render(); } };
$('recList').onclick = e => {
  const i = e.target.dataset.del;
  if (i === undefined || !confirm(t('confirmDelete'))) return;
  state.records.splice(+i, 1); save(); render();
};
$('height').onchange = e => {
  const v = Number(e.target.value);
  if (e.target.value && !(v >= 100 && v <= 250)) { say(t('badValue')); return render(); }
  if (e.target.value) state.settings.height = v; else delete state.settings.height;
  save(); say(t('saved'));
};

// --- תאריכי בית ---
$('pAdd').onclick = () => {
  const start = $('pStart').value, end = $('pEnd').value;
  if (!start || !end || end < start) return say(t('badDates'));
  if (overlaps(start, end)) return say(t('overlap'));
  state.homePeriods.push({ start, end, mode: $('pLong').checked ? 'leave' : 'home' });
  state.homePeriods.sort(byKey('start'));
  save(); render(); say(t('saved'));
};
$('periods').onchange = e => {
  const i = +e.target.dataset.end, p = state.homePeriods[i], v = e.target.value;
  if (!v || v < p.start || overlaps(p.start, v, i)) { say(t('badDates')); return render(); }
  p.end = v; save(); render();
};
$('periods').onclick = e => {
  const i = e.target.dataset.del;
  if (i === undefined || !confirm(t('confirmDelete'))) return;
  state.homePeriods.splice(+i, 1); save(); render();
};

// --- מצבי צבא מתוכננים ---
$('aAdd').onclick = () => {
  const from = $('aDate').value;
  if (!from) return say(t('badDates'));
  state.armyModes = state.armyModes.filter(a => a.from !== from).concat({ from, mode: $('aMode').value }).sort(byKey('from'));
  save(); render(); say(t('saved'));
};
$('armyList').onclick = e => {
  const i = e.target.dataset.del;
  if (i === undefined || !confirm(t('confirmDelete'))) return;
  state.armyModes.splice(+i, 1); save(); render();
};

// --- תבניות ---
const showTemplate = () => { $('tText').value = templateText(state.templates[$('tMode').value]); };
$('tMode').onchange = showTemplate;
$('tSave').onclick = () => {
  state.templates[$('tMode').value] = parseTemplate($('tText').value);
  save(); render(); say(t('saved'));
};

// --- כללי וגיבוי ---
$('lang').onclick = () => {
  state.settings.lang = state.settings.lang === 'he' ? 'en' : 'he';
  save(); render();
};

$('export').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `savav-${iso()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say(t('exported'));
};

$('importBtn').onclick = () => $('importFile').click();
$('importFile').onchange = async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let d;
  try { d = JSON.parse(await file.text()); } catch {}
  if (!isValidBackup(d)) return say(t('importBad'));
  if (!confirm(t('importConfirm'))) return;
  state = withDefaults(migrate(d));
  save(); render(); showTemplate(); say(t('importOk'));
};

console.assert(isValidBackup(defaultState()) && !isValidBackup({}) && !isValidBackup({ schemaVersion: 99, settings: {} })
  && !isValidBackup({ schemaVersion: 1, settings: {}, homePeriods: [{ start: '2026-01-05', end: '2026-01-01', mode: 'home' }] }),
  'isValidBackup self-check failed');
console.assert(JSON.stringify(parseTemplate('א | ב\n\n ג ')) === JSON.stringify([task('א', 'ב'), task('ג')])
  && templateText(parseTemplate('א | ב\nג')) === 'א | ב\nג', 'parseTemplate self-check failed');
console.assert(addDays('2026-12-31', 1) === '2027-01-01' && daysBetween('2026-03-26', '2026-03-30') === 4, 'date self-check failed');

render();
showTemplate();
document.addEventListener('visibilitychange', () => document.hidden || render()); // מתעדכן ליום חדש אחרי חצות
if ('serviceWorker' in navigator) {
  // כשגרסה חדשה נכנסת לתוקף, טוענים מחדש פעם אחת כדי לא להציג תערובת של גרסאות
  if (navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  navigator.serviceWorker.register('sw.js');
}
navigator.storage?.persist?.(); // מבקש מאנדרואיד לא למחוק את הנתונים כשהזיכרון מתמלא
