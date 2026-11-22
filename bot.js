// "בוט": מעתיק מצב + הוראות ל-Claude, ומייבא את ה-JSON שהוא מחזיר אחרי בדיקה, תצוגה מקדימה ואישור. נטען אחרי app.js.
const BOT_KEYS = ['templates', 'homePeriods', 'armyModes', 'songs', 'prompts', 'records', 'learn', 'milestones'];
let botPending = null; // המצב המוצע, עד שמאשרים

Object.assign(T.he, {
  bot: 'עזרה מ-Claude', botHint: '1. העתק ושלח בצ\'אט עם Claude. 2. הדבק כאן את ה-JSON שהוא מחזיר. 3. בדוק ואשר.',
  botCopy: 'ייצא מצב ל-Claude', botPh: 'הדבק כאן את התשובה של Claude', botCheck: 'בדוק', botApply: 'אשר ויבא', botCancel: 'בטל',
  botBad: 'לא מצאתי JSON תקין. שום דבר לא שונה.', botKeys: k => `מפתחות לא מוכרים: ${k}`, botInvalid: 'השינויים לא עוברים בדיקת תקינות. שום דבר לא שונה.',
  botNothing: 'אין שינויים.', botDone: 'השינויים יובאו.', botWas: 'היה', botNow: 'יהיה',
});
Object.assign(T.en, {
  bot: 'Help from Claude', botHint: '1. Copy and send in a chat with Claude. 2. Paste the JSON it returns here. 3. Review and approve.',
  botCopy: 'Export state for Claude', botPh: "Paste Claude's reply here", botCheck: 'Check', botApply: 'Approve & import', botCancel: 'Cancel',
  botBad: 'No valid JSON found. Nothing changed.', botKeys: k => `Unknown keys: ${k}`, botInvalid: 'Changes failed validation. Nothing changed.',
  botNothing: 'No changes.', botDone: 'Changes imported.', botWas: 'Was', botNow: 'Will be',
});

function botExportText() {
  const since = addDays(iso(), -30);
  const days = Object.fromEntries(Object.entries(state.days).filter(([d]) => d >= since));
  const { calendar, ...settings } = state.settings; // בלי הגדרות היומן
  const data = { ...state, settings, days };
  return `אני משתמש באפליקציה אישית בשם "סבב" לניהול זמן בצבא ובבית (כושר, פסנתר, צרפתית, Claude Code).
היום ${iso()}. עזור לי לשפר את התוכנית לפי הנתונים למטה, ושאל אותי אם חסר לך משהו.

כשאתה מציע שינויים, החזר בסוף בלוק JSON אחד בלבד:
- אובייקט שהמפתחות שלו רק מתוך: ${BOT_KEYS.join(', ')}.
- כל מפתח מחליף את הערך הקיים כולו. ב-templates ו-learn מחליפים רק את השדות שמופיעים.
- שמור בדיוק על אותו מבנה, שמות שדות וערכים מותרים כמו בנתונים. תאריכים בפורמט YYYY-MM-DD.
- מצבים: combat, base, training, home, leave. סטטוס שיר: want, learning, know, review.
- days ו-settings לקריאה בלבד, אל תחזיר אותם.

הנתונים שלי (30 הימים האחרונים):
\`\`\`json
${JSON.stringify(data)}
\`\`\``;
}

// מחלץ את בלוק ה-JSON מתוך תשובה של צ'אט (גם אם יש טקסט או \`\`\` מסביב)
function parseBotReply(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { const v = JSON.parse(text.slice(a, b + 1)); return isObj(v) ? v : null; } catch { return null; }
}

function botCandidate(patch) {
  const bad = Object.keys(patch).filter(k => !BOT_KEYS.includes(k));
  if (bad.length) return { error: t('botKeys')(bad.join(', ')) };
  const cand = { ...state, ...patch };
  if (isObj(patch.templates)) cand.templates = { ...state.templates, ...patch.templates };
  if (isObj(patch.learn)) cand.learn = { ...state.learn, ...patch.learn };
  if (!isValidBackup(cand)) return { error: t('botInvalid') };
  return { cand };
}

const short = v => { const s = JSON.stringify(v, null, 1); return s.length > 600 ? s.slice(0, 600) + '…' : s; };

$('botCopy').onclick = () => copyText(botExportText());
$('botCheck').onclick = () => {
  botPending = null;
  const patch = parseBotReply($('botText').value);
  if (!patch) { $('botPreview').innerHTML = ''; return say(t('botBad')); }
  const { cand, error } = botCandidate(patch);
  if (error) { $('botPreview').innerHTML = ''; return say(error); }
  const changed = BOT_KEYS.filter(k => JSON.stringify(cand[k]) !== JSON.stringify(state[k]));
  if (!changed.length) { $('botPreview').innerHTML = ''; return say(t('botNothing')); }
  botPending = cand;
  $('botPreview').innerHTML = changed.map(k => `<details open><summary><b>${k}</b></summary>
      <p class="muted">${t('botWas')}</p><pre>${esc(short(state[k]))}</pre><p class="muted">${t('botNow')}</p><pre>${esc(short(cand[k]))}</pre></details>`).join('')
    + `<div class="row"><button class="primary" id="botApply">${t('botApply')}</button><button class="ghost" id="botCancel">${t('botCancel')}</button></div>`;
};
$('botPreview').onclick = e => {
  if (e.target.id === 'botApply' && botPending) {
    state = withDefaults(botPending); botPending = null;
    $('botText').value = ''; $('botPreview').innerHTML = '';
    save(); render(); showTemplate(); say(t('botDone'));
  }
  if (e.target.id === 'botCancel') { botPending = null; $('botPreview').innerHTML = ''; }
};

console.assert(parseBotReply('הנה:\n```json\n{"songs":[]}\n```\nבהצלחה')?.songs?.length === 0 && parseBotReply('no json') === null,
  'parseBotReply self-check failed');
