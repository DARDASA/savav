// כושר: איזה אימון היום, מה כתוב בו, רישום הישגים ומסך הכושר. נטען אחרי app.js.
// shortcut: תוכן התוכנית בעברית בלבד, לתרגם אם תשתמש בממשק באנגלית
const BASELINE = { pullup: { kg: 15, reps: 8 }, bench: { kg: 60, reps: 18 }, run3k: { sec: 690 } }; // מלפני 3 חודשים, עד המבחן הראשון
const STRENGTH = ['A', 'B', 'test', 'exam']; // אחרי אלה לא עושים כוח למחרת
const RUNS = ['easy', 'int'];
const W_IDS = [...STRENGTH, ...RUNS, 'rest'];
const KINDS = ['pullup', 'bench', 'run3k', 'run5k', 'weight'];
const PROTEIN_PER_KG = 1.8;

const STRETCHES = [
  "ירך קדמית (כורע על ברך אחת) 2×30 שנ' לכל צד",
  "ירך אחורית (רגל ישרה על ספסל) 2×30 שנ'",
  "חזה בפתח דלת 2×30 שנ'",
  "גב רחב: תלייה חופשית מהמוט 2×30 שנ'",
  "תאומים על מדרגה 2×30 שנ' לכל צד",
];

const r25 = x => Math.round(x / 2.5) * 2.5;
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const isHome = date => ['home', 'leave'].includes(modeAt(date));
const latest = kind => state.records.filter(r => r.kind === kind).sort(byKey('date')).pop() || BASELINE[kind];
const oneRepMax = ({ kg, reps }) => kg * (1 + reps / 30); // נוסחת Epley
const proteinGrams = () => { const w = latest('weight'); return w && Math.round(w.kg * PROTEIN_PER_KG); };
// אימונים שבוצעו בטווח תאריכים (כולל שני הקצוות)
const doneW = (from, to) => Object.entries(state.days).filter(([d, x]) => d >= from && d <= to)
  .map(([, x]) => (x.exam ? 'exam' : x.w)).filter(Boolean);

// רוטציה: אימון שפוספס פשוט מופיע שוב מחר, אז אף פעם אין שני אימונים ביום או כוח יומיים ברצף
function workoutId(date) {
  const day = state.days[date] || {};
  if (day.exam) return 'exam';
  if (day.w) return day.w;
  const y = addDays(date, -1), home = isHome(date), period = homePeriodAt(date);
  if (STRENGTH.includes(doneW(y, y)[0])) {
    if (!home || doneW(addDays(date, -6), y).filter(w => RUNS.includes(w)).length >= 2) return 'rest';
    return doneW(period.start, y).some(w => RUNS.includes(w)) ? 'int' : 'easy'; // חזרה הדרגתית: ריצה ראשונה בבית קלה
  }
  if (home && !doneW(period.start, y).includes('test')) return 'test';
  const last = Object.keys(state.days).filter(d => d < date && ['A', 'B'].includes(state.days[d].w)).sort().pop();
  return last && state.days[last].w === 'A' ? 'B' : 'A';
}

function workoutDef(id, date) {
  const home = isHome(date), pu = latest('pullup'), bench = latest('bench'), orm = oneRepMax(bench);
  const puSet = Math.max(1, Math.round(pu.reps * 0.6));
  const army = modeAt(date) === 'combat' ? ', אם יש זמן' : '';
  const defs = {
    test: {
      t: 'מבחן כושר',
      items: [`מתח עם ${pu.kg} ק"ג: מקסימום חזרות`, `בנץ' ${bench.kg} ק"ג: מקסימום חזרות`,
        "מנוחה 10 דק', ואז 3 ק\"מ על זמן", 'בסימון V תתבקש להזין את התוצאות'],
      min: "מבחן חלקי: רק מתח ובנץ'",
    },
    A: home ? {
      t: 'כוח A (בית)',
      items: [`בנץ' 5×5 ב-${r25(orm * 0.75)} ק"ג`, `מתח עם ${pu.kg} ק"ג: 5 סטים × ${puSet}`,
        'בולגרי עם דאמבלים 3×8 לכל רגל', 'לחיצת כתפיים עם דאמבלים 3×10', "פלאנק 3×45 שנ'"],
      min: `בנץ' 2×5 ב-${r25(orm * 0.75)} ק"ג + מתח 2 סטים`,
    } : {
      t: `כוח A (משקל גוף${army})`,
      items: ['מתח: 5 סטים, עוצרים 2 חזרות לפני כישלון', 'שכיבות סמיכה: 4 סטים, עוצרים 3 לפני כישלון',
        'חתירה ב-TRX 3×12', 'מכרעים 3×12 לכל רגל', "פלאנק 3×45 שנ'"],
      min: 'מתח 2 סטים + שכיבות סמיכה 2 סטים',
    },
    B: home ? {
      t: 'כוח B (בית)',
      items: [`בנץ' 3×12 ב-${r25(orm * 0.6)} ק"ג, בסט האחרון מקסימום חזרות`, 'מתח בלי משקל: 4 סטים, 2 לפני כישלון',
        'דדליפט רומני עם מוט 3×8', 'חתירה עם דאמבל 3×10 לכל יד', 'הרמות ברכיים בתלייה 3×12'],
      min: `בנץ' 2×12 ב-${r25(orm * 0.6)} ק"ג + מתח 2 סטים`,
    } : {
      t: `כוח B (משקל גוף${army})`,
      items: ["מתח שלילי 4×3, ירידה איטית של 5 שנ'", 'שכיבות סמיכה צרות: 4 סטים, 3 לפני כישלון',
        'משיכת פנים עם גומייה 3×15', 'סקוואט בולגרי בלי משקל 3×12 לכל רגל', "הולו הולד 3×30 שנ'"],
      min: 'מתח שלילי 2×3 + שכיבות סמיכה 2 סטים',
    },
    easy: { t: 'ריצה קלה', items: ["20 עד 25 דק' בקצב שבו אפשר לדבר", 'אחרי: מתיחות ירך ותאומים'], min: "ריצה קלה 10 דק'" },
    int: {
      t: 'ריצת אינטרוולים',
      items: ["חימום: 10 דק' ריצה קלה", `6×400 מ' ב-${mmss(latest('run3k').sec / 7.5 - 2)}, 90 שנ' הליכה בין חזרות`, "שחרור: 5 דק' הליכה"],
      min: "3×400 מ'",
    },
    rest: { t: "התאוששות: מתיחות 10 דק'", items: STRETCHES, min: '3 מתיחות' },
    exam: { t: 'יום בוחן (מחליף אימון)', items: [], min: 'יום בוחן (מחליף אימון)' },
  };
  return defs[id];
}

// "15x8" -> {kg, reps}; "11:30" -> {sec}; "72.5" -> {kg}. מחזיר null אם הערך לא הגיוני.
function parseRecord(kind, text) {
  const n = String(text).match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (kind === 'pullup' || kind === 'bench') return n.length === 2 && n[0] <= 300 && n[1] >= 1 && n[1] <= 100 ? { kg: n[0], reps: n[1] } : null;
  if (kind === 'run3k' || kind === 'run5k') return n.length === 2 && n[1] < 60 && n[0] > 0 ? { sec: n[0] * 60 + n[1] } : null;
  return n.length === 1 && n[0] >= 30 && n[0] <= 250 ? { kg: n[0] } : null;
}

const recordText = r => (r.sec ? mmss(r.sec) : r.reps ? `${r.kg}×${r.reps}` : `${r.kg}`);

console.assert(JSON.stringify(parseRecord('bench', '60x18')) === '{"kg":60,"reps":18}'
  && parseRecord('run3k', '11:30').sec === 690 && parseRecord('weight', '72.5').kg === 72.5
  && parseRecord('weight', '7') === null && parseRecord('run3k', '11') === null && mmss(690) === '11:30', 'parseRecord self-check failed');

Object.assign(T.he, {
  kg: 'ק"ג', today: 'היום', exam: 'יום בוחן', basketball: 'כדורסל', volleyball: 'כדורעף',
  records: 'הישגים', height: 'גובה (ס"מ)', rules: 'כללי התקדמות', weighIn: 'שקילה שבועית', logRecord: 'רישום הישג',
  protein: g => (g ? `יעד חלבון: ${g} ג'` : 'יעד חלבון (הזן משקל בכושר)'),
  pullup: 'מתח', bench: "בנץ'", run3k: '3 ק"מ', run5k: '5 ק"מ', weight: 'משקל',
  ask: { pullup: 'מתח: משקל נוסף וחזרות (למשל 15x8)', bench: "בנץ': משקל וחזרות (למשל 60x18)",
    run3k: '3 ק"מ: זמן (למשל 11:30)', run5k: '5 ק"מ: זמן (למשל 21:40)', weight: 'משקל גוף בק"ג (למשל 72.5)' },
  badValue: 'הערך לא תקין, לא נשמר.',
  estBench: "בנץ' מקסימום משוער", estPull: 'מתח עם משקל', est3k: '3 ק"מ',
});
Object.assign(T.en, {
  kg: 'kg', today: 'Today', exam: 'Test day', basketball: 'Basketball', volleyball: 'Volleyball',
  records: 'Records', height: 'Height (cm)', rules: 'Progression rules', weighIn: 'Weekly weigh-in', logRecord: 'Log a record',
  protein: g => (g ? `Protein target: ${g} g` : 'Protein target (log weight in Fitness)'),
  pullup: 'Pull-ups', bench: 'Bench', run3k: '3 km', run5k: '5 km', weight: 'Weight',
  ask: { pullup: 'Pull-ups: added kg and reps (e.g. 15x8)', bench: 'Bench: kg and reps (e.g. 60x18)',
    run3k: '3 km: time (e.g. 11:30)', run5k: '5 km: time (e.g. 21:40)', weight: 'Body weight in kg (e.g. 72.5)' },
  badValue: 'Invalid value, not saved.',
  estBench: 'Bench est. max', estPull: 'Weighted pull-ups', est3k: '3 km',
});

// שואל ערך בחלון קטן ושומר הישג. ביטול = לא שומר כלום.
function askRecord(kind) {
  const text = prompt(t('ask')[kind]);
  if (text === null) return;
  const rec = parseRecord(kind, text);
  if (!rec) return say(t('badValue'));
  state.records.push({ date: iso(), kind, ...rec, source: 'manual' });
}

function renderFitness() {
  const day = state.days[iso()] || {}, pu = latest('pullup');
  $('exam').setAttribute('aria-pressed', !!day.exam);
  $('extra').innerHTML = ['basketball', 'volleyball'].map(k =>
    `<button data-extra="${k}" aria-pressed="${!!day.extra?.includes(k)}">${t(k)}</button>`).join('');
  $('stats').innerHTML = [[t('estBench'), `${Math.round(oneRepMax(latest('bench')))} ${t('kg')}`],
    [t('estPull'), `${pu.kg}×${pu.reps}`], [t('est3k'), mmss(latest('run3k').sec)]]
    .map(([k, v]) => `<div><div class="stat">${esc(v)}</div><div class="muted">${k}</div></div>`).join('');
  $('recButtons').innerHTML = KINDS.map(k => `<button data-rec="${k}">${t(k)}</button>`).join('');
  if (document.activeElement !== $('height')) $('height').value = state.settings.height ?? '';
  $('recList').innerHTML = state.records.map((r, i) => [r, i]).sort((a, b) => (a[0].date < b[0].date ? 1 : -1)).slice(0, 10)
    .map(([r, i]) => `<li><span>${fmt(r.date)} · ${t(r.kind)} <b>${recordText(r)}</b></span>
      <button class="ghost" data-del="${i}">${t('delete')}</button></li>`).join('') || none();
}

$('exam').onclick = () => { const d = dayOf(iso()); d.exam = !d.exam; if (!d.exam && d.w === 'exam') delete d.w; save(); render(); };
$('extra').onclick = e => {
  const k = e.target.dataset.extra;
  if (!k) return;
  const d = dayOf(iso()), x = d.extra || [];
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
