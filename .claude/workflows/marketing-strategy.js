export const meta = {
  name: 'marketing-strategy',
  description: 'Маркетинговая стратегия + RICE-бэклог на РЕАЛЬНЫХ навыках (Skill). Каждая сторона загружает свой навык (Skill → fallback на чтение SKILL.md → встроенная методология). Веер по ~9 сторонам на едином пакете фактов (Ground) → red-team → синтез → задачи → двойная верификация → финал + executive-однопейджер. Бриф через args (фраза | JSON-строка | объект).',
  whenToUse: 'Когда нужна целостная маркетинговая стратегия и конкретный бэклог задач. Бриф через args: одной фразой или {subject, goals, audience, positioning, constraints, context, docs?:[пути], urls?:[ссылки]}. Использует навыки coreyhaines marketing-skills, ajtbd, marketing-psychology, product-manager-toolkit, design:* — с graceful fallback, если их нет. Возвращает данные; вызывающий сохраняет в файлы.',
  phases: [
    { title: 'Frame', detail: 'распарсить бриф, заострить, зафиксировать допущения' },
    { title: 'Ground', detail: 'детерминированно собрать проверяемые факты (репо/файлы/веб)' },
    { title: 'Dimensions', detail: '~9 сторон, каждая на своём РЕАЛЬНОМ навыке' },
    { title: 'Red-team', detail: 'оспорить складывающийся консенсус' },
    { title: 'Synthesize', detail: 'собрать стратегию, отвечающую на возражения red-team' },
    { title: 'Tasks', detail: 'разложить в задачи c RICE (навык product-manager-toolkit)' },
    { title: 'Verify', detail: 'проверка фактов + атомарности задач (параллельно)' },
    { title: 'Finalize', detail: 'финальная стратегия, исправленные задачи, однопейджер' },
  ],
}

// ===================== СХЕМЫ =====================
const EVIDENCE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    facts: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { claim: { type: 'string' }, source: { type: 'string', description: 'файл:строка или URL' }, confidence: { type: 'string', enum: ['high', 'medium', 'low'] } },
      required: ['claim', 'source', 'confidence'] } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['facts'],
}
const DIMENSION_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    dimension: { type: 'string' },
    skillsUsed: { type: 'array', items: { type: 'string' }, description: 'какие навыки реально загрузил (Skill или Read) и каким способом' },
    theoryBasis: { type: 'string' },
    keyInsights: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['dimension', 'keyInsights', 'recommendations', 'skillsUsed'],
}
const REDTEAM_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: { strongestCounterCase: { type: 'string' }, riskiestAssumptions: { type: 'array', items: { type: 'string' } }, whatWouldFalsify: { type: 'array', items: { type: 'string' } } },
  required: ['strongestCounterCase', 'riskiestAssumptions'],
}
const TASK_ITEM = {
  type: 'object', additionalProperties: false,
  properties: {
    title: { type: 'string' }, dimension: { type: 'string' }, description: { type: 'string' }, firstStep: { type: 'string' },
    reach: { type: 'number' }, impact: { type: 'number' }, confidence: { type: 'number' }, effort: { type: 'number' },
  },
  required: ['title', 'dimension', 'description', 'reach', 'impact', 'confidence', 'effort'],
}
const TASKS_SCHEMA = { type: 'object', additionalProperties: false, properties: { tasks: { type: 'array', items: TASK_ITEM } }, required: ['tasks'] }
const TASKVERIFY_SCHEMA = { type: 'object', additionalProperties: false, properties: { tasks: { type: 'array', items: TASK_ITEM }, changesNote: { type: 'string' } }, required: ['tasks'] }
const CLAIMS_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    unsupported: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { claim: { type: 'string' }, issue: { type: 'string' }, fix: { type: 'string' } }, required: ['claim', 'fix'] } },
    verdict: { type: 'string' },
  },
  required: ['verdict'],
}

// ===================== ХЕЛПЕРЫ =====================
// Гибридная загрузка реального навыка: Skill → find+Read SKILL.md → fallback на методологию задачи.
function skillBlock(names) {
  return '### ШАГ 0 — загрузи РЕАЛЬНУЮ методологию навыков (ОБЯЗАТЕЛЬНО до анализа)\n' +
    'Навыки: [' + names.join(', ') + ']. Для КАЖДОГО по порядку, пока не загрузишь инструкции:\n' +
    '1) Вызови инструмент **Skill** с этим именем (для навыков пакета marketing-skills попробуй также префикс "marketing-skills:<имя>").\n' +
    '2) Если ответ "Unknown skill" — навык установлен, но не зарегистрирован в этой сессии. Найди его файл через Bash: `find ~/.claude/plugins/cache ~/.claude/skills -ipath "*<короткое-имя>/SKILL.md" 2>/dev/null | head -1` (короткое имя — часть после ":"), прочитай через **Read** и применяй инструкции навыка.\n' +
    '3) Если файл не найден — опирайся на методологию, описанную в ЗАДАЧЕ ниже.\n' +
    'В анализе ЯВНО применяй загруженную методологию навыка (не игнорируй её) и перечисли в поле skillsUsed, что и каким способом загрузил.\n\n'
}
function bullets(items) { items = items || []; return items.length ? items.map(function (x) { return '- ' + x }).join('\n') : '—' }
function evidenceDigest(packs) {
  return packs.map(function (p, i) {
    var facts = (p.facts || []).map(function (f) { return '- [' + f.confidence + '] ' + f.claim + ' _(' + f.source + ')_' }).join('\n')
    var oq = (p.openQuestions || []).length ? '\nОткрытые вопросы:\n' + bullets(p.openQuestions) : ''
    return '#### Источник ' + (i + 1) + '\n' + (facts || '—') + oq
  }).join('\n\n')
}
function scoreTasks(tasks) {
  return (tasks || []).map(function (t) {
    var e = Number(t.effort) || 1
    var rice = e > 0 ? (Number(t.reach || 0) * Number(t.impact || 0) * Number(t.confidence || 0)) / e : 0
    var c = {}; for (var k in t) c[k] = t[k]; c.rice = Math.round(rice * 10) / 10; return c
  }).sort(function (a, b) { return b.rice - a.rice })
}
function renderTasksMarkdown(tasks) {
  var cell = function (s) { return String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ').trim() }
  var head = '| # | Задача | Сторона | RICE | R | I | C | E (дн) |\n|---|---|---|---|---|---|---|---|'
  var rows = tasks.map(function (t, i) { return '| ' + (i + 1) + ' | ' + cell(t.title) + ' | ' + cell(t.dimension) + ' | **' + t.rice + '** | ' + cell(t.reach) + ' | ' + cell(t.impact) + ' | ' + cell(t.confidence) + ' | ' + cell(t.effort) + ' |' })
  var detail = tasks.map(function (t, i) {
    return '### ' + (i + 1) + '. ' + t.title + '  ·  RICE ' + t.rice + '\n**Сторона:** ' + t.dimension + '  ·  R=' + t.reach + ' · I=' + t.impact + ' · C=' + t.confidence + ' · E=' + t.effort + ' дн\n\n' + (t.description || '') + (t.firstStep ? '\n\n▶️ **Первый шаг:** ' + t.firstStep : '')
  }).join('\n\n')
  return [head].concat(rows).join('\n') + '\n\n---\n\n## Детализация (в порядке приоритета)\n\n' + detail
}

// ===================== БРИФ (robust args: фраза | JSON-строка | объект) =====================
var brief = {}
if (typeof args === 'string') {
  var s = args.trim()
  if (s.charAt(0) === '{') { try { brief = JSON.parse(s) } catch (e) { brief = { subject: s } } }
  else if (s.length) { brief = { subject: s } }
} else if (args && typeof args === 'object') { brief = args }
var hasBrief = Object.keys(brief).length > 0
var oneLiner = hasBrief && !brief.goals && !brief.audience && !brief.positioning && !brief.context
if (!hasBrief) log('⚠️ Бриф (args) пуст. Соберу контекст на фазе Ground и ЯВНО зафиксирую допущения — результат будет реконструкцией.')
else if (oneLiner) log('ℹ️ Краткая постановка — Frame развернёт её в полный бриф, Ground подтвердит фактами.')

var briefText = [
  brief.subject ? 'ОБЪЕКТ: ' + brief.subject : '',
  brief.goals ? 'ЦЕЛИ: ' + brief.goals : '',
  brief.audience ? 'АУДИТОРИЯ: ' + brief.audience : '',
  brief.positioning ? 'ТЕКУЩЕЕ ПОЗИЦИОНИРОВАНИЕ: ' + brief.positioning : '',
  brief.constraints ? 'ОГРАНИЧЕНИЯ: ' + brief.constraints : '',
  brief.context ? 'КОНТЕКСТ: ' + brief.context : '',
  (brief.docs && brief.docs.length) ? 'ДОКИ ДЛЯ ИЗУЧЕНИЯ: ' + brief.docs.join(', ') : '',
  (brief.urls && brief.urls.length) ? 'ССЫЛКИ: ' + brief.urls.join(', ') : '',
].filter(Boolean).join('\n')
var baseBrief = briefText || 'Бриф через args не передан. Восстанови объект из материалов рабочей директории на фазе Ground и ЯВНО фиксируй каждое допущение.'

// ===================== Phase 1: Frame =====================
phase('Frame')
var sharpened = await agent(
  'Ты — head of marketing strategy. Сырой бриф:\n\n' + baseBrief + '\n\n' +
  'Заостри в рабочий бриф (<=250 слов): 1) что именно продаём и кому; 2) ОДНА главная бизнес-цель + 1-2 вторичные; 3) ключевые допущения (явно, списком); 4) north-star метрика. Если передана лишь краткая фраза — разверни её, выводя аудиторию/цели/позиционирование как ЯВНЫЕ гипотезы (помечай «гипотеза»). Плотно, по-русски, без воды. Если данных мало — НЕ выдумывай, перечисли, что уточнить на Ground.',
  { label: 'frame:brief', phase: 'Frame' }
)

// ===================== Phase 2: Ground =====================
phase('Ground')
var groundPacks = (await parallel([
  function () {
    return agent(
      'Ты — research analyst. Заострённый бриф:\n\n' + sharpened + '\n\n' +
      'Собери ПРОВЕРЯЕМЫЕ факты об объекте: Read/Grep/Glob по рабочей директории (доки, код сайта, аналитика), WebFetch для путей/ссылок из брифа. Для КАЖДОГО факта — источник (файл:строка или URL) и confidence. НЕ выдумывай — чего нет, в openQuestions. Ищи: оффер/цены, метрики/аналитику, позиционирование, активы (кейсы), тех-факты (sitemap, schema, события трекинга).',
      { label: 'ground:internal', phase: 'Ground', schema: EVIDENCE_SCHEMA }
    )
  },
  function () {
    return agent(
      'Ты — market research analyst. Заострённый бриф:\n\n' + sharpened + '\n\n' +
      'Через WebSearch/WebFetch собери ВНЕШНИЙ контекст с источниками (URL): категория и динамика, 3-5 прямых конкурентов, их офферы/цены если публичны, типичные каналы для этой ЦА, бенчмарки. Для каждого факта — URL и confidence. Если объект непубличный — фокус на категории/рынке. Не выдумывай цифры.',
      { label: 'ground:market', phase: 'Ground', schema: EVIDENCE_SCHEMA }
    )
  },
  function () {
    return agent(
      'Ты — pricing research analyst. Заострённый бриф:\n\n' + sharpened + '\n\n' +
      'Через WebSearch/WebFetch проведи ГЛУБОКИЙ ценовой интернет-ресерч с источниками (URL). Найди КОНКРЕТНЫЕ цифры: 1) реальные цены/ставки прямых конкурентов и сопоставимых услуг (если публичны); 2) рыночные ставки для этой роли/услуги с учётом гео (напр. ставки AI PM / fractional CTO / профильного консалтинга — дневные, проектные, ретейнер); 3) бенчмарки willingness-to-pay и типичные модели монетизации (фикс / ретейнер / % от результата); 4) ценовые якоря для EVE (стоимость найма штатного специалиста, средний чек агентств). Для КАЖДОЙ цифры — URL и confidence; чего не нашёл — в openQuestions. НЕ выдумывай цифры — лучше пометить low confidence или вынести в openQuestions.',
      { label: 'ground:pricing', phase: 'Ground', schema: EVIDENCE_SCHEMA }
    )
  },
])).filter(Boolean)
var evidence = evidenceDigest(groundPacks)
log('Ground: собрано ' + groundPacks.reduce(function (n, p) { return n + (p.facts || []).length }, 0) + ' фактов с источниками.')

// ===================== Phase 3: Dimensions (каждая на своём навыке) =====================
var DIMENSIONS = [
  { key: 'positioning', title: 'Позиционирование и JTBD', skills: ['ajtbd:ajtbd', 'competitors'], lens: 'Позиционирование по April Dunford (competitive alternatives → unique attributes → value → кому важнее) + JTBD: функциональная/эмоциональная/социальная работа, силы прогресса, trigger events. 2-3 варианта позиционирующего утверждения, основная "работа", против чего конкурируем.' },
  { key: 'audience', title: 'Аудитория и сегментация', skills: ['customer-research', 'ajtbd:ajtbd'], lens: 'ICP и сегментация по работам: кто, в какой ситуации, с каким триггером ищет решение. 2-3 сегмента с болями (unprompted), где их искать. Какой в фокус и почему (PMF).' },
  { key: 'offer', title: 'Оффер и ценность/цена', skills: ['pricing'], lens: 'Оффер и монетизация: value-based, Van Westendorp/WTP, good-better-best, packaging. Ядро ценностного предложения, варианты упаковки, обоснование цены через ценность. Сверь с себестоимостью/юнит-экономикой И с РЫНОЧНЫМИ ЦЕНАМИ из Evidence Pack (раздел ценового ресерча — реальные ставки конкурентов и рынка с URL). ОБЯЗАТЕЛЬНО привяжи рекомендуемую цену к найденным рыночным якорям (стоимость найма, чек агентств) с конкретными цифрами. Если ценовых данных в Evidence Pack мало — сам проведи WebSearch/WebFetch по ценам конкурентов и рыночным ставкам и приведи цифры с URL. Любую цену без источника помечай как гипотезу.' },
  { key: 'messaging', title: 'Сообщения и копирайтинг', skills: ['copywriting', 'marketing-psychology', 'design:ux-copy'], lens: 'Месседжинг: главный value prop, 3-5 messaging pillars, обработка возражений. Direct-response + поведенческая психология (social proof, anchoring, loss aversion, authority) — этично. Примеры заголовков/буллетов.' },
  { key: 'seo_geo', title: 'SEO и GEO (AI-поиск)', skills: ['ai-seo', 'seo-audit', 'schema'], lens: 'SEO + GEO. Учти Ahrefs 2026 (если в Evidence Pack): листиклы Best X = 43.8% цитат ChatGPT; 67% — неинфлюенсируемые; YouTube — макс. корреляция (0.737); schema НЕ влияет на AI-цитаты (но полезна для Google KG); AIO режут клики по #1 на -58%; 99.9% AIO на инфо-запросах. Топиковые кластеры, как попасть в чужие Best X, роль YouTube, что НЕ переинвестировать.' },
  { key: 'content', title: 'Контент-стратегия', skills: ['content-strategy'], lens: 'Контент: topical authority, форматы под этап воронки, 4-6 опорных тем, ритм. Привязка к инфо-интенту и к форматам, которые цитирует AI. Контент-pillars + флагманские материалы.' },
  { key: 'channels', title: 'Каналы и дистрибуция', skills: ['marketing-plan', 'community-marketing'], lens: 'Каналы: owned/earned/paid + комьюнити. Где реально ICP (сверь с Evidence Pack). Приоритизируй 2-3 канала под ограничения, обоснуй, отсеки неокупаемое. Для каждого — механика.' },
  { key: 'growth', title: 'Growth-петли и удержание', skills: ['referrals', 'free-tools', 'lead-magnets'], lens: 'Growth engineering: реферальные/виральные петли, free tools, lead magnets, комьюнити как петля. 1-2 реалистичные петли под ресурс и что измерять.' },
  { key: 'brand_measure', title: 'Brand voice и измерение', skills: ['analytics', 'ab-testing'], lens: 'Голос бренда (tone) + измерение: north-star, 3-5 KPI по воронке, план A/B рискованных гипотез (с учётом реального объёма трафика из Evidence Pack). Tone-правила + дерево метрик.' },
]

phase('Dimensions')
var dimResults = (await parallel(DIMENSIONS.map(function (d) {
  return function () {
    return agent(
      skillBlock(d.skills) +
      'Ты — эксперт по направлению "' + d.title + '". Рабочий бриф:\n\n' + sharpened + '\n\n' +
      'ПАКЕТ ПРОВЕРЯЕМЫХ ФАКТОВ (Evidence Pack):\n' + evidence + '\n\n' +
      'ЗАДАЧА (через методологию загруженного навыка): ' + d.lens + '\n\n' +
      'Конкретно и применимо к объекту. Опирайся на факты Evidence Pack с источником. Любую цифру вне пакета помечай как assumption.',
      { label: 'dim:' + d.key, phase: 'Dimensions', schema: DIMENSION_SCHEMA }
    ).then(function (r) { if (!r) return null; r._title = d.title; return r })
  }
}))).filter(Boolean)

var dimDigest = dimResults.map(function (r) {
  return '### ' + r._title + '\n_Навыки: ' + (r.skillsUsed || []).join(', ') + ' · Теория: ' + (r.theoryBasis || '—') + '_\n**Инсайты:**\n' + bullets(r.keyInsights) + '\n**Рекомендации:**\n' + bullets(r.recommendations) + '\n**Допущения:**\n' + bullets(r.assumptions) + '\n**Риски:**\n' + bullets(r.risks)
}).join('\n\n')

// ===================== Phase 4: Red-team =====================
phase('Red-team')
var redteam = await agent(
  skillBlock(['marketing-psychology']) +
  'Ты — скептик-контрариан в совете директоров. Перед тобой анализ по ' + dimResults.length + ' сторонам и пакет фактов. НЕ соглашайся: построй сильнейший контр-кейс (что если основная ставка ошибочна?), назови самые рискованные допущения, принятые на веру, и дешёвый тест, который бы их опроверг. Применяй ментальные модели из навыка (inversion, second-order thinking). Конкретно и неудобно.\n\nФАКТЫ:\n' + evidence + '\n\nАНАЛИЗ:\n' + dimDigest,
  { label: 'redteam:challenge', phase: 'Red-team', schema: REDTEAM_SCHEMA }
)

// ===================== Phase 5: Synthesize =====================
phase('Synthesize')
var strategy = await agent(
  skillBlock(['marketing-plan', 'marketing-psychology']) +
  'Ты — CMO. Заострённый бриф:\n\n' + sharpened + '\n\nФакты:\n' + evidence + '\n\nАнализ по ' + dimResults.length + ' сторонам:\n\n' + dimDigest + '\n\n' +
  'RED-TEAM (обязательно ответить):\nКонтр-кейс: ' + redteam.strongestCounterCase + '\nРискованные допущения: ' + (redteam.riskiestAssumptions || []).join('; ') + '\n\n' +
  'Собери ЦЕЛОСТНУЮ стратегию в Markdown (RU), применяя методологию навыка marketing-plan. Разделы: 1) Большая ставка; 2) Ответ на возражения red-team (явный раздел); 3) Позиционирование (утверждение + против чего); 4) Фокус-сегмент(ы) и их работа; 5) Ценностное предложение и оффер; 6) Messaging pillars (3-5); 7) Каналы (2-3 с механикой); 8) Контент и SEO/GEO-ставки; 9) Growth-петля; 10) Метрики (north-star + KPI-дерево); 11) 90-дневная карта по спринтам. РАЗРЕШАЙ конфликты явно. Каждую важную цифру — с источником из Evidence Pack либо помечай "гипотеза — проверить через ...". Без воды.',
  { label: 'synthesize:strategy', phase: 'Synthesize' }
)

// ===================== Phase 6: Tasks (RICE через product-manager-toolkit) =====================
phase('Tasks')
var taskData = await agent(
  skillBlock(['product-manager-toolkit']) +
  'Ты — маркетинговый операционный лид. Стратегия:\n\n' + strategy + '\n\n' +
  'Применяя методологию RICE из навыка product-manager-toolkit, разложи стратегию в КОНКРЕТНЫЕ исполнимые задачи (12-20). Каждая: title (глагол+результат); dimension; description (что и зачем, 1-2 фразы); firstStep (первый шаг сегодня); RICE: reach (1-10), impact (0.25/0.5/1/2/3), confidence (0.5/0.8/1.0), effort (человеко-дни, >=0.5). КАЖДАЯ задача атомарна (одно действие — один результат; deliverable из 3+ частей = разбей). Реалистично для указанных ресурсов.',
  { label: 'tasks:decompose', phase: 'Tasks', schema: TASKS_SCHEMA }
)

// ===================== Phase 7: Verify (параллельно) =====================
phase('Verify')
var verifyOut = await parallel([
  function () {
    return agent(
      'Ты — fact-checker. Проверь КАЖДОЕ количественное и фактическое утверждение стратегии против Evidence Pack. Найди НЕподкреплённые источником и не помеченные как гипотеза (overclaim, выдуманные цифры, "единственный на рынке" без проверки). Для каждого дай fix.\n\nEVIDENCE PACK:\n' + evidence + '\n\nСТРАТЕГИЯ:\n' + strategy,
      { label: 'verify:claims', phase: 'Verify', schema: CLAIMS_SCHEMA }
    )
  },
  function () {
    return agent(
      'Ты — operations reviewer. Проверь задачи на: 1) атомарность (deliverable из 3+ частей = разбить); 2) реалистичность effort; 3) вменяемость RICE. ВЕРНИ ИСПРАВЛЕННЫЙ массив задач и краткий changesNote.\n\nЗАДАЧИ (JSON):\n' + JSON.stringify((taskData && taskData.tasks) || []),
      { label: 'verify:tasks', phase: 'Verify', schema: TASKVERIFY_SCHEMA }
    )
  },
])
var claims = verifyOut[0] || { unsupported: [], verdict: '—' }
var taskFix = verifyOut[1] || { tasks: (taskData && taskData.tasks) || [], changesNote: 'без изменений' }

// ===================== Phase 8: Finalize =====================
phase('Finalize')
var finalStrategy = await agent(
  'Учти результаты верификации и ВЫДАЙ финальную исправленную стратегию в Markdown (RU). Сохрани структуру, устрани overclaim/выдуманные цифры (замени на "гипотеза — проверить через ..."), закрой слабые места. Без преамбул — только итоговый документ.\n\nИСХОДНАЯ СТРАТЕГИЯ:\n' + strategy + '\n\nНЕПОДКРЕПЛЁННЫЕ УТВЕРЖДЕНИЯ (исправить):\n' + ((claims.unsupported || []).map(function (u) { return '- ' + u.claim + ' → ' + u.fix }).join('\n') || '—'),
  { label: 'finalize:strategy', phase: 'Finalize' }
)
var onePager = await agent(
  'Сожми финальную стратегию в EXECUTIVE-ОДНОПЕЙДЖЕР (Markdown, RU, <=1 страница): Большая ставка (2-3 фразы); Позиционирование (1 утверждение); Фокус-сегмент; Топ-3 ставки; 3 главные метрики; что делать в первые 2 недели. Только суть.\n\nСТРАТЕГИЯ:\n' + finalStrategy,
  { label: 'finalize:onepager', phase: 'Finalize' }
)

var scoredTasks = scoreTasks(taskFix.tasks || [])
var tasksMarkdown = renderTasksMarkdown(scoredTasks)
var skillsLog = {}
dimResults.forEach(function (r) { (r.skillsUsed || []).forEach(function (s) { skillsLog[s] = true }) })
log('Готово: фактов ' + groundPacks.reduce(function (n, p) { return n + (p.facts || []).length }, 0) + ', сторон ' + dimResults.length + ', задач ' + scoredTasks.length + ', навыков задействовано ' + Object.keys(skillsLog).length + ', неподкреплённых утверждений ' + ((claims.unsupported || []).length) + '.')

return {
  onePager: onePager,
  strategyMarkdown: finalStrategy,
  tasks: scoredTasks,
  tasksMarkdown: tasksMarkdown,
  sharpenedBrief: sharpened,
  evidence: groundPacks,
  redteam: redteam,
  claimsCheck: claims,
  taskChanges: taskFix.changesNote,
  skillsUsed: Object.keys(skillsLog),
  dimensions: dimResults,
}
