// התקדמות: רצף לפי סבב, סיכום סבב, גרפים, אבני דרך ותזכורת גיבוי. נטען אחרי app.js.
const SUCCESS_RATE = 0.8; // סבב מוצלח: לפחות 80% מהימים הושלמו (שבת לא נספרת)

Object.assign(T.he, {
  currentTour: 'הסבב הנוכחי', streak: 'רצף', streakText: n => (n ? `${n} סבבים מוצלחים ברצף` : 'עוד אין רצף. סבב מוצלח = 80% מהימים.'),
  tourRate: (ok, n) => `${ok} מתוך ${n} ימים הושלמו`, lastTour: 'סיכום הסבב הקודם',
  sumWorkouts: 'אימונים', sumExtra: 'פעילות נוספת', sumEnergy: 'אנרגיה ממוצעת', sumSuccess: 'הצלחה',
  success: 'סבב מוצלח', notSuccess: 'לא הגיע ל-80%', charts: 'גרפים', table: 'טבלה', noData: 'צריך לפחות 2 מדידות',
  backup: 'גיבוי', backupAgo: n => (n === null ? 'עוד לא גיבית. כדאי לגבות עכשיו.' : n === 0 ? 'גיבית היום.' : `הגיבוי האחרון לפני ${n} ימים.`),
  milestones: 'אבני דרך', msIntro: 'הדרך מהמצב היום ליעד מחולקת ל-6 רבעונים שווים. אפשר לשנות יעד ולהגדיר פרס, ואז לאשר.',
  msApprove: 'אשר אבני דרך', msReset: 'התחל מחדש', msResetQ: 'למחוק את אבני הדרך ולהתחיל מחדש?',
  quarter: (q, d) => `רבעון ${q} · עד ${d}`, reward: 'פרס', goal: 'יעד',
  gPullup: 'מתח עם משקל (חזרות)', gBench: "בנץ' מקסימום (ק\"ג)", gBench70: "בנץ' 70 ק\"ג (חזרות)", gRun5k: '5 ק"מ (זמן)',
  gRun3k: '3 ק"מ (זמן)', gSongs: 'שירים שאני יודע', gGrammar: 'שלבי דקדוק', gChallenges: 'אתגרי Claude',
  cBench: "בנץ' מקסימום משוער (ק\"ג)", cPullup: 'מתח עם משקל (חזרות)', cRun3k: '3 ק"מ (זמן)', cWeight: 'משקל (ק"ג)',
});
Object.assign(T.en, {
  currentTour: 'Current round', streak: 'Streak', streakText: n => (n ? `${n} successful rounds in a row` : 'No streak yet. A successful round = 80% of days.'),
  tourRate: (ok, n) => `${ok} of ${n} days done`, lastTour: 'Last round summary',
  sumWorkouts: 'Workouts', sumExtra: 'Extra activity', sumEnergy: 'Avg energy', sumSuccess: 'Success',
  success: 'Successful round', notSuccess: 'Below 80%', charts: 'Charts', table: 'Table', noData: 'Needs at least 2 entries',
  backup: 'Backup', backupAgo: n => (n === null ? 'No backup yet. Back up now.' : n === 0 ? 'Backed up today.' : `Last backup ${n} days ago.`),
  milestones: 'Milestones', msIntro: 'The road from today to the goal is split into 6 equal quarters. Edit goals, set rewards, then approve.',
  msApprove: 'Approve milestones', msReset: 'Start over', msResetQ: 'Delete milestones and start over?',
  quarter: (q, d) => `Quarter ${q} · by ${d}`, reward: 'Reward', goal: 'Goal',
  gPullup: 'Weighted pull-ups (reps)', gBench: 'Bench max (kg)', gBench70: 'Bench 70 kg (reps)', gRun5k: '5 km (time)',
  gRun3k: '3 km (time)', gSongs: 'Songs I know', gGrammar: 'Grammar steps', gChallenges: 'Claude challenges',
  cBench: 'Bench est. max (kg)', cPullup: 'Weighted pull-ups (reps)', cRun3k: '3 km (time)', cWeight: 'Weight (kg)',
});

// --- סבבים ורצף ---
function tours() {
  const ps = state.homePeriods, first = Object.keys(state.days).sort()[0];
  const list = ps.map((p, i) => ({ n: i + 1, start: i ? addDays(ps[i - 1].end, 1) : (first && first < p.start ? first : p.start), end: p.end }));
  const last = ps[ps.length - 1];
  list.push({ n: ps.length + 1, start: last ? addDays(last.end, 1) : first || iso(), end: null }); // סבב פתוח
  return list;
}

function tourStats(tour) {
  const today = iso(), end = tour.end && tour.end < today ? tour.end : today;
  let n = 0, ok = 0, workouts = 0, extra = 0, energy = [];
  for (let d = tour.start; d <= end; d = addDays(d, 1)) {
    const day = state.days[d] || {}, success = daySuccess(d);
    if (day.w && day.w !== 'rest') workouts++;
    extra += day.extra?.length || 0;
    if (day.energy) energy.push(day.energy);
    if (weekday(d) === 6 || (d === today && !success)) continue; // שבת לא נספרת, והיום נספר רק אם כבר הושלם
    n++; if (success) ok++;
  }
  return { n, ok, rate: n ? ok / n : 0, workouts, extra, energy: energy.length ? energy.reduce((a, b) => a + b) / energy.length : null };
}

function streak(list) {
  let s = 0;
  for (const tr of list.filter(x => x.end && x.end < iso()).reverse()) {
    if (tourStats(tr).rate >= SUCCESS_RATE) s++; else break;
  }
  return s;
}

// --- גרפים: קו אחד לכל מדד, נקודה לכל מדידה, ערך אחרון מסומן ---
const CHARTS = [
  ['cBench', 'bench', r => Math.round(oneRepMax(r)), String],
  ['cPullup', 'pullup', r => r.reps, String], // shortcut: לא מתחשב בשינוי של המשקל הנוסף, לעבור למקסימום משוער אם תשנה משקל במבחן
  ['cRun3k', 'run3k', r => r.sec, mmss],
  ['cWeight', 'weight', r => r.kg, v => String(Math.round(v * 10) / 10)],
];

function lineChart(pts, fmtV) {
  const W = 320, H = 140, L = 40, R = 16, Tp = 16, B = 24;
  const vs = pts.map(p => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const t0 = new Date(pts[0].d).getTime(), t1 = new Date(pts[pts.length - 1].d).getTime(), tspan = t1 - t0 || 1;
  const x = d => L + ((new Date(d).getTime() - t0) / tspan) * (W - L - R), y = v => Tp + (1 - (v - lo) / span) * (H - Tp - B);
  const last = pts[pts.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${pts.map(p => `${fmt(p.d)} ${fmtV(p.v)}`).join(', ')}" direction="ltr">
    <line x1="${L}" x2="${W - R}" y1="${y(lo)}" y2="${y(lo)}" class="grid"/><line x1="${L}" x2="${W - R}" y1="${y(hi)}" y2="${y(hi)}" class="grid"/>
    <text x="${L - 6}" y="${y(hi) + 4}" text-anchor="end">${fmtV(hi)}</text><text x="${L - 6}" y="${y(lo) + 4}" text-anchor="end">${fmtV(lo)}</text>
    <text x="${L}" y="${H - 6}">${fmt(pts[0].d)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${fmt(last.d)}</text>
    <polyline points="${pts.map(p => `${x(p.d)},${y(p.v)}`).join(' ')}" class="line"/>
    ${pts.map(p => `<circle cx="${x(p.d)}" cy="${y(p.v)}" r="4" class="dot"><title>${fmt(p.d)}: ${fmtV(p.v)}</title></circle>`).join('')}
    <text x="${x(last.d)}" y="${y(last.v) < 30 ? y(last.v) + 20 : y(last.v) - 10}" text-anchor="end" class="val">${fmtV(last.v)}</text>
  </svg>`;
}

// --- אבני דרך ---
const GOALS = [
  { kind: 'pullup', label: 'gPullup', to: 15, cur: () => latest('pullup').reps },
  { kind: 'bench', label: 'gBench', to: 100, cur: () => Math.round(oneRepMax(latest('bench'))) },
  { kind: 'bench70', label: 'gBench70', to: 20, cur: () => Math.max(0, Math.round(30 * (oneRepMax(latest('bench')) / 70 - 1))) },
  // shortcut: בלי ריצת 5 ק"מ רשומה, מעריכים מ-3 ק"מ פי 1.8 (שמרני), לעדכן כשתרשום 5 ק"מ אמיתי
  { kind: 'run5k', label: 'gRun5k', to: 1199, time: true, cur: () => latest('run5k')?.sec ?? Math.round(latest('run3k').sec * 1.8) },
  { kind: 'run3k', label: 'gRun3k', to: 659, time: true, cur: () => latest('run3k').sec },
  { kind: 'songs', label: 'gSongs', to: 8, cur: () => state.songs.filter(s => s.status === 'know').length },
  { kind: 'grammar', label: 'gGrammar', to: GRAMMAR.length, cur: () => doneSet('g').size },
  { kind: 'challenges', label: 'gChallenges', to: CHALLENGES.length, cur: () => state.learn.challenges.length },
];
const goalOf = kind => GOALS.find(g => g.kind === kind);
const target = (g, q) => Math.round(g.from + ((g.to - g.from) * q) / 6);
const met = (g, v, goal) => (g.to < g.from ? v <= goal : v >= goal); // בזמן ריצה, פחות זה טוב יותר
const fmtGoal = (kind, v) => (goalOf(kind).time ? mmss(v) : String(v));
const addMonths = (s, n) => { const d = new Date(s + 'T12:00'); d.setMonth(d.getMonth() + n); return iso(d); };

function validMilestones(m) {
  return isObj(m) && isDate(m.start) && Array.isArray(m.goals) && m.goals.every(g => isObj(g) && GOALS.some(x => x.kind === g.kind)
    && Number.isFinite(g.from) && Number.isFinite(g.to)) && Array.isArray(m.rewards) && m.rewards.length <= 6 && m.rewards.every(isStr);
}

function renderMilestones() {
  const m = state.milestones;
  if (!m) {
    $('msBody').innerHTML = `<p class="muted">${t('msIntro')}</p><ul class="list">${GOALS.map(g => {
      const from = g.cur(), draft = { from, to: msDraftGoals[g.kind] ?? g.to };
      return `<li><span>${t(g.label)}<br><span class="muted">${fmtGoal(g.kind, from)} → ${[1, 2, 3, 4, 5, 6].map(q => fmtGoal(g.kind, target(draft, q))).join(' · ')}</span></span>
        <input type="number" class="num" data-goal="${g.kind}" value="${draft.to}" aria-label="${t('goal')} ${t(g.label)}"></li>`;
    }).join('')}</ul>
      ${[1, 2, 3, 4, 5, 6].map(q => `<label class="field">${t('reward')} ${q}<input data-reward="${q - 1}" value="${esc(msDraftRewards[q - 1] || '')}"></label>`).join('')}
      <button class="primary wide" id="msApprove">${t('msApprove')}</button>`;
    return;
  }
  $('msBody').innerHTML = [1, 2, 3, 4, 5, 6].map(q => {
    const lines = m.goals.map(g => {
      const goal = target(g, q), v = goalOf(g.kind).cur(), ok = met(g, v, goal);
      return `<li><span>${t(goalOf(g.kind).label)}</span><span>${ok ? '✓ ' : ''}${fmtGoal(g.kind, goal)}</span></li>`;
    }).join('');
    return `<details ${q === 1 ? 'open' : ''}><summary>${t('quarter')(q, fmt(addMonths(m.start, 3 * q)))}${m.rewards[q - 1] ? ` · 🎁 ${esc(m.rewards[q - 1])}` : ''}</summary>
      <ul class="list">${lines}</ul></details>`;
  }).join('') + `<button class="ghost wide" id="msReset">${t('msReset')}</button>`;
}
const msDraftRewards = [];
const msDraftGoals = {};

function renderProgress() {
  const list = tours(), curTour = list.find(x => x.start <= iso() && (!x.end || x.end >= iso())) || list[0], s = tourStats(curTour);
  $('curTour').innerHTML = `<div class="stat">${Math.round(s.rate * 100)}%</div><div class="muted">${t('tourRate')(s.ok, s.n)}</div>
    <div class="bar"><div style="width:${s.rate * 100}%"></div></div>`;
  $('streakText').textContent = t('streakText')(streak(list));

  const done = list.filter(x => x.end && x.end < iso()), prev = done[done.length - 1];
  $('lastTourCard').hidden = !prev;
  if (prev) {
    const p = tourStats(prev);
    $('lastTour').innerHTML = `<p class="eyebrow">${fmt(prev.start)} – ${fmt(prev.end)} · ${p.rate >= SUCCESS_RATE ? t('success') : t('notSuccess')}</p>
      <div class="stats">${[[t('sumSuccess'), `${Math.round(p.rate * 100)}%`], [t('sumWorkouts'), p.workouts], [t('sumExtra'), p.extra],
        [t('sumEnergy'), p.energy ? p.energy.toFixed(1) : '–']].map(([k, v]) => `<div><div class="stat">${v}</div><div class="muted">${k}</div></div>`).join('')}</div>`;
  }

  $('charts').innerHTML = CHARTS.map(([label, kind, val, f]) => {
    const pts = state.records.filter(r => r.kind === kind).sort(byKey('date')).map(r => ({ d: r.date, v: val(r) }));
    return `<div class="chartbox"><h3>${t(label)}</h3>${pts.length >= 2 ? lineChart(pts, f) : `<p class="muted">${t('noData')}</p>`}
      ${pts.length ? `<details><summary>${t('table')}</summary><ul class="list">${pts.map(p => `<li><span>${fmt(p.d)}</span><span>${f(p.v)}</span></li>`).join('')}</ul></details>` : ''}</div>`;
  }).join('');

  const lb = state.settings.lastBackup;
  $('backupText').textContent = t('backupAgo')(lb ? daysBetween(lb, iso()) : null);
  renderMilestones();
}

$('msBody').oninput = e => {
  if (e.target.dataset.reward !== undefined) msDraftRewards[+e.target.dataset.reward] = e.target.value;
  if (e.target.dataset.goal && e.target.value !== '' && Number.isFinite(+e.target.value)) msDraftGoals[e.target.dataset.goal] = +e.target.value;
};
$('msBody').onchange = e => { if (e.target.dataset.goal) render(); };
$('msBody').onclick = e => {
  if (e.target.id === 'msApprove') {
    state.milestones = { start: iso(), rewards: [0, 1, 2, 3, 4, 5].map(i => (msDraftRewards[i] || '').trim()),
      goals: GOALS.map(g => ({ kind: g.kind, from: g.cur(), to: Number.isFinite(msDraftGoals[g.kind]) ? msDraftGoals[g.kind] : g.to })) };
    msDraftRewards.length = 0;
    save(); render(); say(t('saved'));
  }
  if (e.target.id === 'msReset' && confirm(t('msResetQ'))) { state.milestones = null; save(); render(); }
};
