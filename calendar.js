// Google Calendar בלי שרת: התחברות בדפדפן (Google Identity Services), קריאת אירועים בימי בית,
// שיבוץ משימות בחלונות פנויים, ותזכורת אחת ביום. נטען אחרי app.js.
const GCAL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const DAY_START = 8 * 60, DAY_END = 22 * 60, FRIDAY_END = 13 * 60, GAP = 15; // דקות מחצות
const SYNC_DAYS = 14;

Object.assign(T.he, {
  calendar: 'Google Calendar', calHint: 'משבץ משימות בימי בית בחלונות פנויים, ויוצר תזכורת אחת ביום. בשבת ובשישי אחרי 13:00 לא נוצר כלום.',
  clientId: 'Client ID', armyTime: 'שעת תזכורת בצבא', homeTime: 'שעת תזכורת בבית', calSync: 'סנכרן ל-14 הימים הבאים',
  calNeedId: 'קודם הדבק Client ID (ההוראות בשיחה עם Claude).', calLoading: 'טוען את Google, לחץ שוב בעוד רגע.',
  calConfirm: (n, m) => `ייווצרו ${n} אירועים, ויימחקו ${m} אירועים ישנים של סבב. להמשיך?`,
  calDone: n => `נוצרו ${n} אירועים ביומן.`, calError: m => `שגיאה מול Google: ${m}`, calDaily: 'סבב: התוכנית היומית',
});
Object.assign(T.en, {
  calendar: 'Google Calendar', calHint: 'Schedules tasks on home days in free slots, plus one reminder per day. Nothing on Saturday or Friday after 13:00.',
  clientId: 'Client ID', armyTime: 'Reminder time (army)', homeTime: 'Reminder time (home)', calSync: 'Sync the next 14 days',
  calNeedId: 'Paste a Client ID first (instructions in the Claude chat).', calLoading: 'Loading Google, tap again in a moment.',
  calConfirm: (n, m) => `${n} events will be created and ${m} old Savav events deleted. Continue?`,
  calDone: n => `${n} events created.`, calError: m => `Google error: ${m}`, calDaily: 'Savav: daily plan',
});

const cal = () => state.settings.calendar ??= { clientId: '', armyTime: '19:30', homeTime: '09:00' };
const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const hhmm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

// כמה זמן משימה לוקחת, לפי הטקסט שלה. 0 = לא משבצים ביומן.
function durationOf(it) {
  if (it.key === 'w') return { test: 90, A: 60, B: 60, easy: 40, int: 45, rest: 15, exam: 0 }[it.id];
  if (['protein', 'weigh', 'duo'].includes(it.key)) return 0;
  const m = it.t.match(/(\d+)\s*דק/);
  if (m) return +m[1];
  if (it.t.includes('שעתיים')) return 120;
  if (it.t.includes('שעה וחצי')) return 90;
  if (it.t.includes('שעה')) return 60;
  return 30;
}

// חלונות פנויים בין אירועים תפוסים ([התחלה, סוף] בדקות)
function freeSlots(busy, start, end) {
  const slots = []; let cur = start;
  for (const [s, e] of [...busy].sort((a, b) => a[0] - b[0])) {
    if (s - cur >= GAP) slots.push([cur, Math.min(s, end)]);
    cur = Math.max(cur, e);
  }
  if (end - cur >= GAP) slots.push([cur, end]);
  return slots.filter(([s, e]) => e - s >= GAP);
}

// שיבוץ לפי סדר התוכנית (האימון ראשון): כל משימה לחלון הראשון שבו היא נכנסת, עם הפסקה אחריה
function schedule(tasks, slots) {
  const free = slots.map(s => [...s]), out = [];
  for (const tk of tasks) {
    const s = free.find(([a, b]) => b - a >= tk.dur);
    if (!s) continue;
    out.push({ ...tk, start: s[0], end: s[0] + tk.dur });
    s[0] += tk.dur + GAP;
  }
  return out;
}

// התוכנית לימים הבאים בהנחה שכל אימון מבוצע, כדי שהרוטציה תתקדם (A, מנוחה, B...)
function futurePlans(from, n) {
  const saved = state.days, plans = [];
  state.days = structuredClone(saved);
  try {
    for (let i = 0; i < n; i++) {
      const date = addDays(from, i), items = planFor(date);
      plans.push({ date, items });
      dayOf(date).w ??= items[0].id;
    }
  } finally { state.days = saved; }
  return plans;
}

let gisLoading = false;
function loadGis() {
  if (window.google?.accounts || gisLoading) return;
  gisLoading = true;
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client';
  s.onload = s.onerror = () => { gisLoading = false; };
  document.head.append(s);
}

const getToken = clientId => new Promise((resolve, reject) => {
  google.accounts.oauth2.initTokenClient({
    client_id: clientId, scope: SCOPE,
    callback: r => (r.access_token ? resolve(r.access_token) : reject(new Error(r.error || 'no token'))),
    error_callback: e => reject(new Error(e.type || 'popup')),
  }).requestAccessToken();
});

async function gcal(token, method, query = '', body) {
  const r = await fetch(GCAL + query, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.status === 204 ? null : r.json();
}

const listEvents = (token, from, to, extra = '') => gcal(token, 'GET',
  `?singleEvents=true&maxResults=2500&timeMin=${encodeURIComponent(new Date(from + 'T00:00').toISOString())}&timeMax=${encodeURIComponent(new Date(to + 'T00:00').toISOString())}${extra}`)
  .then(r => r.items || []);

async function calendarSync() {
  const c = cal();
  if (!c.clientId) return say(t('calNeedId'));
  if (!window.google?.accounts) { loadGis(); return say(t('calLoading')); }
  try {
    const token = await getToken(c.clientId), from = iso(), to = addDays(from, SYNC_DAYS);
    const [events, old] = await Promise.all([listEvents(token, from, to), listEvents(token, from, to, '&privateExtendedProperty=savav%3D1')]);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone, now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    const ev = (date, title, s, e, reminders) => ({
      summary: title, start: { dateTime: `${date}T${hhmm(s)}:00`, timeZone: tz }, end: { dateTime: `${date}T${hhmm(e)}:00`, timeZone: tz },
      reminders: { useDefault: false, overrides: reminders }, extendedProperties: { private: { savav: '1' } },
    });
    const create = [];
    for (const { date, items } of futurePlans(from, SYNC_DAYS)) {
      const wd = weekday(date);
      if (wd === 6) continue; // שבת
      const end = wd === 5 ? FRIDAY_END : DAY_END, start = date === from ? Math.max(DAY_START, Math.ceil(nowMin / 15) * 15) : DAY_START;
      const remind = toMin(isHome(date) ? c.homeTime : c.armyTime);
      // התראה אחת ביום בלבד: לאירועי המשימות אין תזכורות
      if (remind < end && (date !== from || remind > nowMin)) create.push(ev(date, t('calDaily'), remind, remind + 10, [{ method: 'popup', minutes: 0 }]));
      if (!isHome(date)) continue;
      const busy = events.filter(e => e.start?.dateTime && e.start.dateTime.slice(0, 10) === date && e.extendedProperties?.private?.savav !== '1')
        .map(e => { const s = new Date(e.start.dateTime), x = new Date(e.end.dateTime); return [s.getHours() * 60 + s.getMinutes(), x.getHours() * 60 + x.getMinutes()]; });
      const tasks = items.map(it => ({ title: `סבב: ${it.t}`, dur: durationOf(it) })).filter(x => x.dur > 0);
      for (const s of schedule(tasks, freeSlots(busy, start, end))) create.push(ev(date, s.title, s.start, s.end, []));
    }
    if (!confirm(t('calConfirm')(create.length, old.length))) return;
    for (const e of old) await gcal(token, 'DELETE', `/${e.id}`);
    for (const e of create) await gcal(token, 'POST', '', e);
    say(t('calDone')(create.length));
  } catch (err) { say(t('calError')(err.message)); }
}

function renderCalendar() {
  const c = cal();
  for (const k of ['clientId', 'armyTime', 'homeTime']) if (document.activeElement !== $(k)) $(k).value = c[k];
  if (c.clientId && navigator.onLine) loadGis();
}
for (const k of ['clientId', 'armyTime', 'homeTime']) $(k).onchange = e => { cal()[k] = e.target.value.trim(); save(); };
$('calSync').onclick = calendarSync;

console.assert(JSON.stringify(freeSlots([[600, 660], [630, 700]], 480, 1320)) === '[[480,600],[700,1320]]'
  && JSON.stringify(schedule([{ dur: 60 }, { dur: 100 }], [[480, 560], [600, 800]]).map(x => x.start)) === '[480,600]'
  && durationOf({ key: 'x', t: 'פסנתר שעה וחצי' }) === 90 && durationOf({ key: 'x', t: "צרפתית 30 דק'" }) === 30,
  'calendar self-check failed');
