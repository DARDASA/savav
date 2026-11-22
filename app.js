// סבב — ליבה: נתונים, תאריכים, סבבים, תוכנית יומית, ניווט. כל הנתונים נשמרים רק במכשיר (localStorage).
// קבצי התכונות (fitness, learn, progress, bot, calendar) נטענים אחרי הקובץ הזה, ו-init רץ כשכולם נטענו.
const SCHEMA_VERSION = 3; // מעלים כשמבנה הנתונים משתנה, ומוסיפים המרה ב-migrate
const KEY = 'savav';
const MODES = ['combat', 'base', 'training', 'home', 'leave'];
const ARMY = ['combat', 'base', 'training'];

const T = {
  he: {
    appName: 'סבב', general: 'כללי',
    tabToday: 'היום', tabFitness: 'כושר', tabLearn: 'לימוד', tabProgress: 'התקדמות', tabSettings: 'הגדרות',
    export: 'ייצוא גיבוי', import: 'ייבוא גיבוי', otherLang: 'English',
    exported: 'הקובץ נשמר בתיקיית ההורדות.',
    importConfirm: 'הייבוא יחליף את כל הנתונים במכשיר. להמשיך?',
    importOk: 'הגיבוי יובא.', importBad: 'הקובץ לא תקין. שום דבר לא שונה.',
    combat: 'לחימה', base: 'בסיס', training: 'אימונים', home: 'בית', leave: 'חופשה ארוכה',
    mode: 'מצב', hardDay: 'יום קשה', dayCount: (d, n) => `${d} מתוך ${n} הושלמו`,
    journal: 'איך היה היום?', energy: 'אנרגיה', notePh: 'שורה אחת, לא חובה',
    homePeriods: 'תאריכי בית', from: 'מ-', to: 'עד', add: 'הוסף', delete: 'מחק', none: 'אין עדיין.',
    armyModes: 'מצבי צבא מתוכננים', armyModesHint: 'המצב חל מהתאריך הזה והלאה בימי צבא. ברירת מחדל: לחימה.',
    templates: 'תבניות יום', templatesHint: 'שורה לכל משימה. אחרי | כותבים את גרסת "יום קשה". אימון, חלבון וצרפתית נוספים לבד.',
    save: 'שמור', saved: 'נשמר.', confirmDelete: 'למחוק?', copy: 'העתק', copied: 'הועתק.',
    badDates: 'תאריכים לא תקינים.', overlap: 'התאריכים חופפים לתקופת בית קיימת.',
    setEnd: 'נפתחה תקופת בית מהיום. עדכן את תאריך החזרה בהגדרות.',
    tourArmy: (n, d) => `סבב ${n} · עוד ${d} ימים הביתה`,
    tourHome: (n, k, m) => `סבב ${n} · בית, יום ${k} מתוך ${m}`,
    tourNoHome: n => `סבב ${n} · הזן תאריכי בית בהגדרות`,
  },
  en: {
    appName: 'Savav', general: 'General',
    tabToday: 'Today', tabFitness: 'Fitness', tabLearn: 'Learn', tabProgress: 'Progress', tabSettings: 'Settings',
    export: 'Export backup', import: 'Import backup', otherLang: 'עברית',
    exported: 'File saved to Downloads.',
    importConfirm: 'Import replaces all data on this device. Continue?',
    importOk: 'Backup imported.', importBad: 'Invalid file. Nothing was changed.',
    combat: 'Combat', base: 'Base', training: 'Training', home: 'Home', leave: 'Long leave',
    mode: 'Mode', hardDay: 'Hard day', dayCount: (d, n) => `${d} of ${n} done`,
    journal: 'How was today?', energy: 'Energy', notePh: 'One line, optional',
    homePeriods: 'Home dates', from: 'From', to: 'To', add: 'Add', delete: 'Delete', none: 'None yet.',
    armyModes: 'Planned army modes', armyModesHint: 'Applies from this date on, on army days. Default: combat.',
    templates: 'Day templates', templatesHint: 'One task per line. After | write the "hard day" version. Workout, protein and French are added automatically.',
    save: 'Save', saved: 'Saved.', confirmDelete: 'Delete?', copy: 'Copy', copied: 'Copied.',
    badDates: 'Invalid dates.', overlap: 'Dates overlap an existing home period.',
    setEnd: 'A home period starting today was added. Set the return date in Settings.',
    tourArmy: (n, d) => `Round ${n} · ${d} days to home`,
    tourHome: (n, k, m) => `Round ${n} · home, day ${k} of ${m}`,
    tourNoHome: n => `Round ${n} · add home dates in Settings`,
  },
};

const task = (t, min = t) => ({ t, min });
function defaultTemplates() {
  const combat = [task("Duolingo צרפתית 10 דק'", 'Duolingo צרפתית: שיעור אחד'), task("Duolingo Music 5 דק'", 'Duolingo Music: שיעור אחד')];
  return {
    combat, base: combat, training: combat,
    home: [task('פסנתר שעה', "פסנתר 15 דק'"), task('פרויקט Claude שעה', "פרויקט Claude 20 דק'")],
    leave: [task('פסנתר שעה וחצי', "פסנתר 15 דק'"), task('פרויקט Claude שעתיים', "פרויקט Claude 20 דק'")],
  };
}

function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { lang: 'he' },  // + height, lastBackup, calendar: {clientId, armyTime, homeTime}
    homePeriods: [],  // [{start, end, mode: 'home'|'leave'}], ממוין לפי start
    armyModes: [],    // [{from, mode}], ממוין לפי from
    templates: defaultTemplates(), // {mode: [{t, min}]}
    days: {},         // {'YYYY-MM-DD': {done: [key], hard, w, exam, extra: [], g, c, energy, note}}
    records: [],      // [{date, kind, kg?, reps?, sec?, source: 'manual'}] — source מוכן ל-Garmin בעתיד
    songs: [],        // [{title, status}]
    learn: { duoUnit: '', duoUpdated: null, challenges: [] },
    prompts: [],      // [{title, text}]
    journal: [],      // [{date, text}] יומן למידת Claude
    milestones: null, // {start, goals: [{kind, from, to}], rewards: [6]}
  };
}

const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
const isStr = s => typeof s === 'string';
const isDate = s => isStr(s) && /^\d{4}-\d{2}-\d{2}$/.test(s);
const optArr = (a, ok) => a === undefined || (Array.isArray(a) && a.every(x => ok(x)));
const optInt = n => n === undefined || Number.isInteger(n);

// בדיקת תקינות לכל מה שנכנס מבחוץ: קובץ גיבוי ו-JSON מ-Claude
function isValidBackup(d) {
  return isObj(d) && Number.isInteger(d.schemaVersion) && d.schemaVersion >= 1 && d.schemaVersion <= SCHEMA_VERSION
    && isObj(d.settings) && (d.settings.height === undefined || Number.isFinite(d.settings.height))
    && (d.settings.calendar === undefined || isObj(d.settings.calendar))
    && optArr(d.homePeriods, p => isObj(p) && isDate(p.start) && isDate(p.end) && p.start <= p.end && ['home', 'leave'].includes(p.mode))
    && optArr(d.armyModes, a => isObj(a) && isDate(a.from) && ARMY.includes(a.mode))
    && (d.templates === undefined || (isObj(d.templates) && Object.keys(d.templates).every(m => MODES.includes(m))
      && Object.values(d.templates).every(l => Array.isArray(l) && l.every(x => isObj(x) && isStr(x.t) && isStr(x.min)))))
    && (d.days === undefined || (isObj(d.days) && Object.keys(d.days).every(isDate)
      && Object.values(d.days).every(x => isObj(x) && optArr(x.done, isStr) && optArr(x.extra, isStr)
        && (x.w === undefined || W_IDS.includes(x.w)) && optInt(x.g) && optInt(x.c) && optInt(x.energy)
        && (x.note === undefined || isStr(x.note)))))
    && optArr(d.records, r => isObj(r) && isDate(r.date) && KINDS.includes(r.kind)
      && ['kg', 'reps', 'sec'].every(k => r[k] === undefined || (Number.isFinite(r[k]) && r[k] >= 0)))
    && optArr(d.songs, s => isObj(s) && isStr(s.title) && SONG_STATUS.includes(s.status))
    && (d.learn === undefined || (isObj(d.learn) && optArr(d.learn.challenges, Number.isInteger)))
    && optArr(d.prompts, x => isObj(x) && isStr(x.title) && isStr(x.text))
    && optArr(d.journal, x => isObj(x) && isDate(x.date) && isStr(x.text))
    && (d.milestones == null || validMilestones(d.milestones));
}

// המרות בין גרסאות: משימות שעברו מהתבניות למשימות שהאפליקציה מוסיפה לבד
const REMOVED_TASKS = {
  2: ['אימון משקל גוף (אם יש זמן)', 'אימון כוח', 'אימון כוח או ריצה', 'יעד חלבון'],
  3: ['משימת שיחה בצרפתית', "צרפתית ודקדוק 30 דק'", "צרפתית ודקדוק 45 דק'"],
};
function migrate(d) {
  const templates = { ...d.templates };
  for (const [v, titles] of Object.entries(REMOVED_TASKS))
    if (d.schemaVersion < v) for (const m in templates) templates[m] = templates[m].filter(x => !titles.includes(x.t));
  return { ...d, templates, schemaVersion: SCHEMA_VERSION };
}

// מוסיף ברירות מחדל לשדות חדשים, כך שגיבוי ישן עדיין נטען
function withDefaults(d) {
  const def = defaultState();
  return { ...def, ...d, settings: { ...def.settings, ...d.settings }, templates: { ...def.templates, ...d.templates },
    learn: { ...def.learn, ...d.learn } };
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
const weekday = s => new Date(s + 'T12:00').getDay(); // 5 = שישי, 6 = שבת

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

// התוכנית של יום: אימון + תבנית המצב + לימוד + חלבון + שקילה. גם הרצף משתמש בה.
function planFor(date) {
  const mode = modeAt(date), wid = workoutId(date), w = workoutDef(wid, date);
  const items = [{ key: 'w', id: wid, t: w.t, min: w.min, sub: w.items }];
  for (const x of state.templates[mode]) items.push({ key: x.t, t: x.t, min: x.min });
  items.push(...learnItems(date, mode));
  const protein = t('protein')(proteinGrams());
  items.push({ key: 'protein', t: protein, min: protein });
  const lastW = state.records.filter(r => r.kind === 'weight' && r.date < date).map(r => r.date).sort().pop();
  if (isHome(date) && (!lastW || daysBetween(lastW, date) >= 7 || weighedOn(date))) items.push({ key: 'weigh', t: t('weighIn'), min: t('weighIn') });
  return items;
}
const weighedOn = date => state.records.some(r => r.kind === 'weight' && r.date === date);

function isChecked(date, it) {
  const d = state.days[date] || {};
  if (it.key === 'w') return d.w === it.id;
  if (it.key === 'weigh') return weighedOn(date);
  if (it.key === 'grammar') return d.g !== undefined;
  if (it.key === 'talk') return d.c !== undefined;
  return (d.done || []).includes(it.key);
}

function toggle(date, it, on) {
  const d = dayOf(date);
  if (it.key === 'w') {
    if (on && it.id === 'test') ['pullup', 'bench', 'run3k'].forEach(askRecord);
    if (on) d.w = it.id; else delete d.w;
  } else if (it.key === 'weigh') {
    if (on) askRecord('weight');
    else state.records = state.records.filter(r => !(r.kind === 'weight' && r.date === date));
  } else if (it.key === 'grammar') { if (on) d.g = it.idx; else delete d.g; }
  else if (it.key === 'talk') { if (on) d.c = it.idx; else delete d.c; }
  else if (it.key === 'duo') { if (on) askDuoUnit(date); }
  else d.done = on ? [...d.done, it.key] : d.done.filter(x => x !== it.key);
}

// shortcut: ההצלחה של ימים קודמים מחושבת מהתוכנית הנוכחית, אז שינוי תבנית משנה גם היסטוריה. לשמור תוצאה לכל יום אם זה יפריע.
const daySuccess = date => planFor(date).every(it => isChecked(date, it));

const parseTemplate = text => text.split('\n').map(l => l.split('|').map(s => s.trim()))
  .filter(([title]) => title).map(([title, min]) => task(title, min || title));
const templateText = list => list.map(x => (x.min === x.t ? x.t : `${x.t} | ${x.min}`)).join('\n');

let state; // נטען ב-init, אחרי שכל הקבצים הוגדרו
const $ = id => document.getElementById(id);
const t = k => T[state.settings.lang][k];
let toastTimer;
const say = text => {
  const el = $('msg');
  el.textContent = text; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
};
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
// מבודד קטעים בכתב לטיני (צרפתית, Duolingo) כדי שלא יתבלגנו בתוך משפט בעברית
const bidi = s => String(s).split(/([A-Za-zÀ-ÿ’][A-Za-zÀ-ÿ’'()\/,.!?×0-9 -]*[A-Za-zÀ-ÿ)!?.])/).map((p, i) => (i % 2 ? `<bdi>${esc(p)}</bdi>` : esc(p))).join('');
const locale = () => (state.settings.lang === 'he' ? 'he-IL' : 'en-GB');
const fmt = s => new Date(s + 'T12:00').toLocaleDateString(locale(), { day: 'numeric', month: 'numeric' });
const fillModes = (sel, list, value) => {
  sel.innerHTML = list.map(m => `<option value="${m}">${t(m)}</option>`).join('');
  sel.value = value;
};
const dayOf = date => { const d = state.days[date] ??= { done: [] }; d.done ??= []; return d; };
const copyText = text => navigator.clipboard.writeText(text).then(() => say(t('copied')), () => prompt(t('copy'), text));
const none = () => `<li class="muted">${t('none')}</li>`;

// --- מסך "היום" ---
function renderToday() {
  const date = iso(), mode = modeAt(date), day = state.days[date] || {}, items = planFor(date);
  $('tour').textContent = tourInfo(date);
  fillModes($('mode'), MODES, mode);
  $('hard').setAttribute('aria-pressed', !!day.hard);
  const done = items.filter(it => isChecked(date, it)).length;
  $('dayCount').textContent = t('dayCount')(done, items.length);
  $('dayBar').style.width = `${(done / items.length) * 100}%`;
  $('plan').innerHTML = items.map((it, i) => `<li><label>
      <input type="checkbox" data-i="${i}" ${isChecked(date, it) ? 'checked' : ''}>
      <span><span class="tt">${bidi(day.hard ? it.min : it.t)}</span>${!day.hard && it.sub?.length ? `<small>${it.sub.map(bidi).join('<br>')}</small>` : ''}</span>
    </label></li>`).join('');
  $('energy').innerHTML = [1, 2, 3, 4, 5].map(n => `<button data-energy="${n}" aria-pressed="${day.energy === n}" aria-label="${t('energy')} ${n}">${n}</button>`).join('');
  if (document.activeElement !== $('note')) $('note').value = day.note || '';
}

$('mode').onchange = e => { setTodayMode(e.target.value); save(); render(); };
$('hard').onclick = () => { const d = dayOf(iso()); d.hard = !d.hard; save(); render(); };
$('plan').onchange = e => {
  const date = iso(), it = planFor(date)[+e.target.dataset.i];
  if (it) toggle(date, it, e.target.checked);
  save(); render();
};
$('energy').onclick = e => {
  const n = +e.target.dataset.energy;
  if (!n) return;
  const d = dayOf(iso());
  if (d.energy === n) delete d.energy; else d.energy = n;
  save(); render();
};
$('note').onchange = e => { const d = dayOf(iso()), v = e.target.value.trim(); if (v) d.note = v; else delete d.note; save(); };

// --- הגדרות ---
function renderSettings() {
  $('lang').textContent = t('otherLang');
  $('periods').innerHTML = state.homePeriods.map((p, i) => `<li>
      <span>${fmt(p.start)} – <input type="date" data-end="${i}" value="${p.end}" min="${p.start}" aria-label="${t('to')}">
      <span class="muted">${t(p.mode)}</span></span> <button class="ghost" data-del="${i}">${t('delete')}</button></li>`).join('') || none();
  $('armyList').innerHTML = state.armyModes.map((a, i) => `<li>
      <span>${fmt(a.from)} · ${t(a.mode)}</span> <button class="ghost" data-del="${i}">${t('delete')}</button></li>`).join('') || none();
  fillModes($('aMode'), ARMY, $('aMode').value || 'base');
  fillModes($('tMode'), MODES, $('tMode').value || modeAt(iso()));
}

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
const showTemplate = () => { $('tText').value = templateText(state.templates[$('tMode').value]); };
$('tMode').onchange = showTemplate;
$('tSave').onclick = () => {
  state.templates[$('tMode').value] = parseTemplate($('tText').value);
  save(); render(); say(t('saved'));
};

$('lang').onclick = () => { state.settings.lang = state.settings.lang === 'he' ? 'en' : 'he'; save(); render(); };

function exportBackup() {
  state.settings.lastBackup = iso(); save();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `savav-${iso()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say(t('exported')); render();
}
document.addEventListener('click', e => { if (e.target.closest('[data-export]')) exportBackup(); });

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

// --- ניווט תחתון ---
function showTab(name) {
  document.querySelectorAll('main > section').forEach(s => { s.hidden = s.id !== 'tab-' + name; });
  document.querySelectorAll('.tabbar button').forEach(b => {
    if (b.dataset.tab === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  scrollTo(0, 0);
}
document.querySelector('.tabbar').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); };

function render() {
  const lang = state.settings.lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('appName');
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-ph]').forEach(el => { el.placeholder = t(el.dataset.tPh); });
  document.querySelectorAll('[data-t-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.tLabel)));
  $('today').textContent = new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
  renderToday(); renderFitness(); renderLearn(); renderProgress(); renderSettings(); renderCalendar();
}

function init() {
  state = load();
  console.assert(isValidBackup(defaultState()) && !isValidBackup({}) && !isValidBackup({ schemaVersion: 99, settings: {} })
    && !isValidBackup({ schemaVersion: 1, settings: {}, homePeriods: [{ start: '2026-01-05', end: '2026-01-01', mode: 'home' }] })
    && migrate({ schemaVersion: 2, templates: { base: [task('משימת שיחה בצרפתית'), task('x')] } }).templates.base.length === 1,
  'isValidBackup/migrate self-check failed');
  console.assert(JSON.stringify(parseTemplate('א | ב\n\n ג ')) === JSON.stringify([task('א', 'ב'), task('ג')])
    && templateText(parseTemplate('א | ב\nג')) === 'א | ב\nג', 'parseTemplate self-check failed');
  console.assert(addDays('2026-12-31', 1) === '2027-01-01' && daysBetween('2026-03-26', '2026-03-30') === 4, 'date self-check failed');
  render();
  showTemplate();
  showTab('today');
}
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('visibilitychange', () => document.hidden || !state || render()); // מתעדכן ליום חדש אחרי חצות
if ('serviceWorker' in navigator) {
  // כשגרסה חדשה נכנסת לתוקף, טוענים מחדש פעם אחת כדי לא להציג תערובת של גרסאות
  if (navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  navigator.serviceWorker.register('sw.js');
}
navigator.storage?.persist?.(); // מבקש מאנדרואיד לא למחוק את הנתונים כשהזיכרון מתמלא
