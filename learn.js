// לימוד: פסנתר, צרפתית ו-Claude. נטען אחרי app.js.
// shortcut: התוכן (דקדוק, שיחות, אתגרים) בעברית בלבד, לתרגם אם תשתמש בממשק באנגלית
const SONG_STATUS = ['want', 'learning', 'know', 'review'];

const GRAMMAR = [
  { t: 'être (להיות)', ex: 'je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont. דוגמה: Je suis soldat.', q: 'כתוב 3 משפטים על עצמך עם être.' },
  { t: 'avoir (שיש ל...)', ex: "j'ai, tu as, il a, nous avons, vous avez, ils ont. בצרפתית גם גיל הוא avoir: J'ai 20 ans.", q: 'כתוב מה יש לך: גיל, אחים, חפץ אחד.' },
  { t: 'מין ותוויות', ex: 'le/la/les (ה־), un/une/des (סתמי). לכל שם עצם יש מין: le livre, la table. לפני תנועה: l’ami.', q: 'מצא את המין של 10 מילים מהיחידה הנוכחית ב-Duolingo.' },
  { t: 'שלילה ne…pas', ex: 'הפועל באמצע: Je ne parle pas. לפני תנועה: Je n’ai pas. בדיבור משמיטים לרוב את ne.', q: 'הפוך 5 משפטים מהשלבים הקודמים לשלילה.' },
  { t: 'פעלי -er בהווה', ex: 'parler: je parle, tu parles, il parle, nous parlons, vous parlez, ils parlent. רוב הפעלים בצרפתית הם כאלה.', q: 'הטה את manger ואת aimer, וכתוב משפט עם כל אחד.' },
  { t: 'שאלות', ex: 'שלוש דרכים: Tu viens ? / Est-ce que tu viens ? / Viens-tu ? מילות שאלה: qui, quoi, où, quand, pourquoi, comment.', q: 'שאל חבר מהיחידה 3 שאלות שונות.' },
  { t: 'aller + עתיד קרוב', ex: 'je vais, tu vas, il va, nous allons, vous allez, ils vont. עתיד קרוב: Je vais manger (אני הולך לאכול).', q: 'כתוב 3 תוכניות לחופשה הבאה בעתיד קרוב.' },
  { t: 'faire, prendre, vouloir, pouvoir', ex: 'je fais, je prends, je veux, je peux. Je veux un café. Tu peux venir ?', q: 'כתוב משפט אחד עם כל פועל.' },
  { t: 'תארים', ex: 'התואר מתאים במין ובמספר: petit/petite/petits. רוב התארים אחרי השם (un livre rouge), קצרים ונפוצים לפניו (un grand homme).', q: 'תאר 3 אנשים או חפצים ביחידה.' },
  { t: 'עבר: passé composé עם avoir', ex: "avoir + צורת עבר: j'ai mangé, tu as fini, il a pris. זה העבר הנפוץ בדיבור.", q: 'ספר ב-3 משפטים מה עשית אתמול.' },
  { t: 'עבר עם être', ex: 'פעלי תנועה ושינוי מצב משתמשים ב-être: je suis allé(e), il est venu, nous sommes partis. הצורה מתאימה במין ובמספר.', q: 'ספר על נסיעה הביתה: יצאתי, הגעתי, נכנסתי.' },
  { t: 'מילות יחס ומקום', ex: 'à Paris (עיר), en France (ארץ ממין נקבה), au Canada (זכר), chez moi (אצלי), dans la chambre (בתוך).', q: 'כתוב 4 משפטים על איפה אתה ומשפחתך.' },
  { t: 'כינויי מושא', ex: 'le/la/les (אותו/אותה/אותם), lui/leur (לו/להם). הכינוי לפני הפועל: Je le vois. Je lui parle.', q: 'החלף את המושא בכינוי ב-5 משפטים.' },
  { t: 'imparfait (עבר מתמשך)', ex: 'להרגלים ותיאור בעבר: je mangeais, il faisait beau. השורש מ-nous בהווה + ais, ais, ait, ions, iez, aient.', q: 'תאר ב-3 משפטים איך היה בתיכון.' },
  { t: 'conditionnel לנימוס', ex: 'je voudrais (הייתי רוצה), pourriez-vous… ? (תוכל ל...?), j’aimerais. כך מבקשים בנימוס.', q: 'כתוב 3 בקשות מנומסות: במסעדה, בחנות, בשאלת דרך.' },
];

const TALKS = [
  'הצג את עצמך: שם, גיל, מאיפה אתה', 'שאל חבר מאיפה המשפחה שלו בצרפת', 'ספר מה אכלת היום', 'שאל מה השעה ותענה',
  'ספר על המשפחה שלך ב-3 משפטים', 'שאל חבר מה הוא אוהב לעשות בבית', 'ספר מה מזג האוויר היום', 'בקש משהו בנימוס (מים, מטען)',
  'ספר מה תעשה בחופשה הבאה', 'שאל חבר על העיר שבה הוא גדל', 'תאר את החדר או האוהל במילים פשוטות', 'ספר מה עשית בסוף השבוע האחרון',
  'שאל חבר איזו מוזיקה הוא שומע', 'ספר על שיר שאתה לומד בפסנתר', 'בקש מחבר שילמד אותך 3 מילים של סלנג', 'ספר על ספורט שאתה אוהב',
  'שאל חבר מה המאכל הצרפתי האהוב עליו', 'ספר איך אתה מרגיש היום ולמה', 'תאר חבר מהיחידה בלי לומר את שמו, ושיחזרו מי זה', 'ספר על תוכנית ליום שלם',
  'שאל חבר מה הוא רוצה לעשות אחרי הצבא', 'ספר מה אתה רוצה לעשות אחרי הצבא', 'ספר זיכרון מהילדות בעבר', 'בקש מחבר לתקן לך 3 משפטים',
  'הסבר לחבר משחק או חוק של כדורסל', 'ספר על סרט או סדרה שראית', 'נהל שיחה של 2 דקות רק בצרפתית', 'ספר בדיחה קצרה בצרפתית',
  'שאל חבר על חג שהמשפחה שלו חוגגת', 'נהל שיחה של 5 דקות רק בצרפתית',
];

const CHALLENGES = [
  'פתח את פרויקט סבב ב-Claude Code ובקש הסבר על מבנה הקבצים',
  'בקש שינוי קטן (צבע של כפתור) וקרא את ה-diff לפני שאתה מאשר',
  'כתוב CLAUDE.md לפרויקט סבב: מה הפרויקט, איך בודקים, מה אסור',
  'בנה מחשבון טיפים בדף HTML אחד',
  'בנה ממיר יחידות (ק"מ/מייל, ק"ג/ליברה) עם בדיקות',
  'בנה סקריפט PowerShell שמגבה תיקייה לתיקייה עם תאריך',
  'בנה רשימת קניות ששומרת ב-localStorage',
  'הכנס באג בכוונה לפרויקט קטן ובקש מ-Claude למצוא אותו',
  'בנה אפליקציית C# קונסול למעקב הוצאות שנשמרות ל-CSV',
  'כתוב בדיקות xUnit לאפליקציית ההוצאות',
  'עבוד עם branch ו-Pull Request דרך Claude Code',
  'בנה PWA קטן של טיימר אינטרוולים',
  'בנה Web API קטן ב-ASP.NET עם endpoint אחד ובדיקה',
  'צור slash command או skill משלך ב-Claude Code',
  'הוסף hook שמריץ בדיקות אחרי כל שינוי קוד',
  'בנה כלי שקורא את קובץ הגיבוי של סבב ומציג סטטיסטיקה',
  'חבר MCP server (למשל GitHub) ועבוד דרכו',
  'בנה משחק מקורי קטן בדפדפן עם Canvas',
  'פצל קובץ ארוך למודולים בלי לשבור כלום, עם בדיקות לפני ואחרי',
  'פרויקט מקצה לקצה לבחירתך: תכנון, בדיקות, פריסה ו-README',
];

Object.assign(T.he, {
  piano: 'פסנתר', songs: 'שירים', songPh: 'שם השיר', want: 'רוצה', learning: 'לומד', know: 'יודע', review: 'צריך חזרה',
  french: 'צרפתית', duoUnit: u => (u ? `יחידה ב-Duolingo: ${u}` : 'עוד לא עודכנה יחידה ב-Duolingo'),
  duoAgo: n => `עודכן לפני ${n} ימים`, duoUpdate: 'עדכון חודשי: יחידה ב-Duolingo', askUnit: 'באיזו יחידה אתה ב-Duolingo?',
  grammar: 'דקדוק', exercise: 'תרגיל', allSteps: 'כל השלבים', talk: 'משימת שיחה', allTalks: 'כל משימות השיחה', finished: 'סיימת הכל!',
  claude: 'Claude', challenges: 'אתגרי "בנה X"', cjournal: 'יומן למידה', journalPh: 'מה למדתי היום?',
  prompts: 'פרומפטים שמורים', promptTitle: 'כותרת', promptText: 'הפרומפט',
});
Object.assign(T.en, {
  piano: 'Piano', songs: 'Songs', songPh: 'Song title', want: 'Want', learning: 'Learning', know: 'Know', review: 'Needs review',
  french: 'French', duoUnit: u => (u ? `Duolingo unit: ${u}` : 'No Duolingo unit yet'),
  duoAgo: n => `Updated ${n} days ago`, duoUpdate: 'Monthly: update Duolingo unit', askUnit: 'Which Duolingo unit are you on?',
  grammar: 'Grammar', exercise: 'Exercise', allSteps: 'All steps', talk: 'Conversation task', allTalks: 'All conversation tasks', finished: 'All done!',
  claude: 'Claude', challenges: '"Build X" challenges', cjournal: 'Learning journal', journalPh: 'What did I learn today?',
  prompts: 'Saved prompts', promptTitle: 'Title', promptText: 'Prompt',
});

// משפט בשורה, כדי שצרפתית ועברית לא יתערבבו באותה שורה
const lines = s => s.split(/(?<=\.)\s+/);

// התקדמות בשלבים: שלב שסומן V ביום כלשהו נחשב גמור, והשלב הנוכחי הוא הראשון שעוד לא נעשה
const doneSet = key => new Set(Object.values(state.days).map(d => d[key]).filter(n => n !== undefined));
const currentIdx = (key, len) => { const s = doneSet(key); for (let i = 0; i < len; i++) if (!s.has(i)) return i; return -1; };

function learnItems(date, mode) {
  const d = state.days[date] || {}, items = [];
  if (mode === 'home' || mode === 'leave') {
    const g = d.g ?? currentIdx('g', GRAMMAR.length);
    if (g >= 0) items.push({ key: 'grammar', idx: g, t: `צרפתית, דקדוק ${g + 1}/${GRAMMAR.length}: ${GRAMMAR[g].t}`,
      min: 'Duolingo צרפתית: שיעור אחד', sub: [...lines(GRAMMAR[g].ex), `תרגיל: ${GRAMMAR[g].q}`] });
    // תוכנית חזרה קצרה ביומיים הראשונים של כל תקופת בית
    const p = homePeriodAt(date), rev = state.songs.filter(s => s.status === 'know' || s.status === 'review').map(s => s.title);
    if (p && daysBetween(p.start, date) < 2 && rev.length)
      items.push({ key: 'review', t: `חזרת שירים: ${rev.slice(0, 4).join(', ')}`, min: `חזרה על ${rev[0]}` });
  }
  if (mode === 'base' || mode === 'training') {
    const c = d.c ?? currentIdx('c', TALKS.length);
    if (c >= 0) items.push({ key: 'talk', idx: c, t: `שיחה בצרפתית: ${TALKS[c]}`, min: 'משפט אחד בצרפתית עם חבר' });
  }
  const u = state.learn.duoUpdated;
  if (!u || daysBetween(u, date) >= 30) items.push({ key: 'duo', t: t('duoUpdate'), min: t('duoUpdate') });
  return items;
}

function askDuoUnit(date) {
  const v = prompt(t('askUnit'), state.learn.duoUnit);
  if (v === null) return;
  state.learn.duoUnit = v.trim().slice(0, 80);
  state.learn.duoUpdated = date;
}

function renderLearn() {
  const order = s => SONG_STATUS.indexOf(s.status);
  $('songs').innerHTML = state.songs.map((s, i) => [s, i]).sort((a, b) => order(a[0]) - order(b[0])).map(([s, i]) => `<li>
      <span>${esc(s.title)}</span><span class="row">
      <select data-song="${i}" aria-label="${esc(s.title)}">${SONG_STATUS.map(st => `<option value="${st}" ${st === s.status ? 'selected' : ''}>${t(st)}</option>`).join('')}</select>
      <button class="ghost" data-del="${i}" aria-label="${t('delete')}">✕</button></span></li>`).join('') || none();

  const u = state.learn.duoUpdated;
  $('duoLine').textContent = t('duoUnit')(state.learn.duoUnit) + (u ? ` · ${t('duoAgo')(daysBetween(u, iso()))}` : '');
  const g = currentIdx('g', GRAMMAR.length), done = doneSet('g');
  $('grammarNow').innerHTML = g < 0 ? `<p>${t('finished')}</p>` : `<p class="eyebrow">${g + 1}/${GRAMMAR.length}</p>
      <h3>${bidi(GRAMMAR[g].t)}</h3><p>${lines(GRAMMAR[g].ex).map(bidi).join('<br>')}</p><p class="muted">${t('exercise')}: ${bidi(GRAMMAR[g].q)}</p>`;
  $('grammarAll').innerHTML = GRAMMAR.map((s, i) => `<li><span>${i + 1}. ${esc(s.t)}</span><span>${done.has(i) ? '✓' : ''}</span></li>`).join('');
  const c = currentIdx('c', TALKS.length), talked = doneSet('c');
  $('talkNow').textContent = c < 0 ? t('finished') : `${c + 1}/${TALKS.length} · ${TALKS[c]}`;
  $('talkAll').innerHTML = TALKS.map((s, i) => `<li><span>${i + 1}. ${esc(s)}</span><span>${talked.has(i) ? '✓' : ''}</span></li>`).join('');

  const ch = state.learn.challenges, next = CHALLENGES.findIndex((_, i) => !ch.includes(i));
  $('challenges').innerHTML = CHALLENGES.map((c, i) => `<li><label><input type="checkbox" data-ch="${i}" ${ch.includes(i) ? 'checked' : ''}>
      <span class="${i === next ? 'tt' : ''}">${i + 1}. ${esc(c)}</span></label></li>`).join('');
  $('journalList').innerHTML = state.journal.map((j, i) => [j, i]).reverse().slice(0, 5).map(([j, i]) =>
    `<li><span><span class="muted">${fmt(j.date)}</span> ${esc(j.text)}</span><button class="ghost" data-del="${i}" aria-label="${t('delete')}">✕</button></li>`).join('') || none();
  $('promptList').innerHTML = state.prompts.map((p, i) => `<li><span><b>${esc(p.title)}</b><br><span class="muted">${esc(p.text.slice(0, 90))}${p.text.length > 90 ? '…' : ''}</span></span>
      <span class="row"><button data-copy="${i}">${t('copy')}</button><button class="ghost" data-del="${i}" aria-label="${t('delete')}">✕</button></span></li>`).join('') || none();
}

const delFrom = (list, e) => {
  const i = e.target.dataset.del;
  if (i === undefined || !confirm(t('confirmDelete'))) return;
  list().splice(+i, 1); save(); render();
};

$('songAdd').onclick = () => {
  const title = $('songTitle').value.trim();
  if (!title) return;
  state.songs.push({ title, status: 'want' }); $('songTitle').value = '';
  save(); render();
};
$('songs').onchange = e => { state.songs[+e.target.dataset.song].status = e.target.value; save(); render(); };
$('songs').onclick = e => delFrom(() => state.songs, e);
$('duoBtn').onclick = () => { askDuoUnit(iso()); save(); render(); };
$('challenges').onchange = e => {
  const i = +e.target.dataset.ch, ch = state.learn.challenges;
  state.learn.challenges = e.target.checked ? [...ch, i] : ch.filter(x => x !== i);
  save(); render();
};
$('journalAdd').onclick = () => {
  const text = $('journalText').value.trim();
  if (!text) return;
  state.journal.push({ date: iso(), text }); $('journalText').value = '';
  save(); render();
};
$('journalList').onclick = e => delFrom(() => state.journal, e);
$('promptAdd').onclick = () => {
  const title = $('promptTitle').value.trim(), text = $('promptText').value.trim();
  if (!title || !text) return;
  state.prompts.push({ title, text }); $('promptTitle').value = ''; $('promptText').value = '';
  save(); render(); say(t('saved'));
};
$('promptList').onclick = e => {
  const c = e.target.dataset.copy;
  if (c !== undefined) return copyText(state.prompts[+c].text);
  delFrom(() => state.prompts, e);
};
