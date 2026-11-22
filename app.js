// סבב — כל הנתונים נשמרים רק במכשיר (localStorage), כאובייקט JSON אחד.
const SCHEMA_VERSION = 1; // מעלים כשמבנה הנתונים משתנה, כדי לדעת להמיר גיבויים ישנים
const KEY = 'savav';

const T = {
  he: {
    appName: 'סבב', planSoon: 'התוכנית היומית תופיע כאן בשלב הבא.', settings: 'הגדרות',
    export: 'ייצוא גיבוי', import: 'ייבוא גיבוי', otherLang: 'English',
    exported: 'הקובץ נשמר בתיקיית ההורדות.',
    importConfirm: 'הייבוא יחליף את כל הנתונים במכשיר. להמשיך?',
    importOk: 'הגיבוי יובא.', importBad: 'הקובץ לא תקין. שום דבר לא שונה.',
  },
  en: {
    appName: 'Savav', planSoon: 'Your daily plan will appear here in the next stage.', settings: 'Settings',
    export: 'Export backup', import: 'Import backup', otherLang: 'עברית',
    exported: 'File saved to Downloads.',
    importConfirm: 'Import replaces all data on this device. Continue?',
    importOk: 'Backup imported.', importBad: 'Invalid file. Nothing was changed.',
  },
};

function defaultState() {
  return { schemaVersion: SCHEMA_VERSION, settings: { lang: 'he' } };
}

// בדיקת תקינות לכל מה שנכנס מבחוץ (קובץ גיבוי, ובהמשך JSON מ-Claude)
function isValidBackup(d) {
  return !!d && typeof d === 'object' && !Array.isArray(d)
    && Number.isInteger(d.schemaVersion) && d.schemaVersion >= 1 && d.schemaVersion <= SCHEMA_VERSION
    && !!d.settings && typeof d.settings === 'object' && !Array.isArray(d.settings);
}

// מוסיף ברירות מחדל לשדות חדשים, כך שגיבוי ישן עדיין נטען
function withDefaults(d) {
  const def = defaultState();
  return { ...def, ...d, settings: { ...def.settings, ...d.settings } };
}

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return defaultState();
  try {
    const d = JSON.parse(raw);
    if (isValidBackup(d)) return withDefaults(d);
  } catch {}
  localStorage.setItem(KEY + '-broken', raw); // לא מוחקים נתונים פגומים, שומרים עותק בצד
  return defaultState();
}

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

let state = load();
const $ = id => document.getElementById(id);
const t = k => T[state.settings.lang][k];
const say = text => { $('msg').textContent = text; };

function render() {
  const lang = state.settings.lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = t('appName');
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $('lang').textContent = t('otherLang');
  $('today').textContent = new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' });
}

$('lang').onclick = () => {
  state.settings.lang = state.settings.lang === 'he' ? 'en' : 'he';
  save(); render();
};

$('export').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `savav-${new Date().toISOString().slice(0, 10)}.json`;
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
  state = withDefaults(d);
  save(); render(); say(t('importOk'));
};

console.assert(isValidBackup(defaultState()) && !isValidBackup({}) && !isValidBackup({ schemaVersion: 99, settings: {} }),
  'isValidBackup self-check failed');

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
navigator.storage?.persist?.(); // מבקש מאנדרואיד לא למחוק את הנתונים כשהזיכרון מתמלא
