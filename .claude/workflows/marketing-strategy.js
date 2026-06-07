export const meta = {
  name: 'marketing-strategy',
  description: 'Marketing strategy + RICE backlog on REAL skills (Skill). Each dimension loads its own skill (Skill → fallback to reading SKILL.md → built-in methodology). Fan-out across ~9 dimensions on a shared fact pack (Ground) → red-team → synthesis → tasks → double verification → final + executive one-pager. Brief via args (sentence | JSON string | object).',
  whenToUse: 'When you need a coherent marketing strategy and a concrete task backlog. Brief via args: a single sentence or {subject, goals, audience, positioning, constraints, context, docs?:[paths], urls?:[links]}. Uses the coreyhaines marketing-skills, ajtbd, marketing-psychology, product-manager-toolkit, design:* skills — with graceful fallback if absent. Returns data; the caller saves it to files.',
  phases: [
    { title: 'Frame', detail: 'parse the brief, sharpen it, record assumptions' },
    { title: 'Ground', detail: 'deterministically collect verifiable facts (repo/files/web)' },
    { title: 'Dimensions', detail: '~9 dimensions, each on its own REAL skill' },
    { title: 'Red-team', detail: 'challenge the forming consensus' },
    { title: 'Synthesize', detail: 'assemble a strategy that answers the red-team' },
    { title: 'Tasks', detail: 'break down into RICE tasks (product-manager-toolkit skill)' },
    { title: 'Verify', detail: 'fact-check + task atomicity (in parallel)' },
    { title: 'Finalize', detail: 'final strategy (incorporating fact-check)' },
    { title: 'Edit', detail: 'copy-editing → coherent readable narrative + one-pager' },
    { title: 'Render', detail: 'frontend-design → dashboard report with charts' },
  ],
}

// ===================== SCHEMAS =====================
const EVIDENCE_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    facts: { type: 'array', items: { type: 'object', additionalProperties: false,
      properties: { claim: { type: 'string' }, source: { type: 'string', description: 'file:line or URL' }, confidence: { type: 'string', enum: ['high', 'medium', 'low'] } },
      required: ['claim', 'source', 'confidence'] } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['facts'],
}
const DIMENSION_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    dimension: { type: 'string' },
    skillsUsed: { type: 'array', items: { type: 'string' }, description: 'which skills you actually loaded (Skill or Read) and how' },
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

// ===================== HELPERS =====================
// Hybrid loading of a real skill: Skill → find+Read SKILL.md → fallback to the task's methodology.
function skillBlock(names) {
  return '### STEP 0 — load the REAL methodology of the skills (REQUIRED before analysis)\n' +
    'Skills: [' + names.join(', ') + ']. For EACH one, in order, until you load its instructions:\n' +
    '1) Call the **Skill** tool with that name (for marketing-skills package skills, also try the prefix "marketing-skills:<name>").\n' +
    '2) If the answer is "Unknown skill" — the skill is installed but not registered in this session. Find its file via Bash: `find ~/.claude/plugins/cache ~/.claude/skills -ipath "*<short-name>/SKILL.md" 2>/dev/null | head -1` (short-name is the part after ":"), read it via **Read**, and apply the skill\'s instructions.\n' +
    '3) If the file is not found — rely on the methodology described in the TASK below.\n' +
    'In your analysis, EXPLICITLY apply the loaded skill methodology (do not ignore it) and list in the skillsUsed field what you loaded and how.\n\n'
}
function bullets(items) { items = items || []; return items.length ? items.map(function (x) { return '- ' + x }).join('\n') : '—' }
function evidenceDigest(packs) {
  return packs.map(function (p, i) {
    var facts = (p.facts || []).map(function (f) { return '- [' + f.confidence + '] ' + f.claim + ' _(' + f.source + ')_' }).join('\n')
    var oq = (p.openQuestions || []).length ? '\nOpen questions:\n' + bullets(p.openQuestions) : ''
    return '#### Source ' + (i + 1) + '\n' + (facts || '—') + oq
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
  var head = '| # | Task | Dimension | RICE | R | I | C | E (days) |\n|---|---|---|---|---|---|---|---|'
  var rows = tasks.map(function (t, i) { return '| ' + (i + 1) + ' | ' + cell(t.title) + ' | ' + cell(t.dimension) + ' | **' + t.rice + '** | ' + cell(t.reach) + ' | ' + cell(t.impact) + ' | ' + cell(t.confidence) + ' | ' + cell(t.effort) + ' |' })
  var detail = tasks.map(function (t, i) {
    return '### ' + (i + 1) + '. ' + t.title + '  ·  RICE ' + t.rice + '\n**Dimension:** ' + t.dimension + '  ·  R=' + t.reach + ' · I=' + t.impact + ' · C=' + t.confidence + ' · E=' + t.effort + ' d\n\n' + (t.description || '') + (t.firstStep ? '\n\n▶️ **First step:** ' + t.firstStep : '')
  }).join('\n\n')
  return [head].concat(rows).join('\n') + '\n\n---\n\n## Detail (in priority order)\n\n' + detail
}

// ===================== BRIEF (robust args: sentence | JSON string | object) =====================
var brief = {}
if (typeof args === 'string') {
  var s = args.trim()
  if (s.charAt(0) === '{') { try { brief = JSON.parse(s) } catch (e) { brief = { subject: s } } }
  else if (s.length) { brief = { subject: s } }
} else if (args && typeof args === 'object') { brief = args }
var hasBrief = Object.keys(brief).length > 0
var oneLiner = hasBrief && !brief.goals && !brief.audience && !brief.positioning && !brief.context
if (!hasBrief) log('⚠️ Brief (args) is empty. I will gather context in the Ground phase and record assumptions EXPLICITLY — the result will be a reconstruction.')
else if (oneLiner) log('ℹ️ Short brief — Frame will expand it into a full brief, Ground will confirm with facts.')

var briefText = [
  brief.subject ? 'SUBJECT: ' + brief.subject : '',
  brief.goals ? 'GOALS: ' + brief.goals : '',
  brief.audience ? 'AUDIENCE: ' + brief.audience : '',
  brief.positioning ? 'CURRENT POSITIONING: ' + brief.positioning : '',
  brief.constraints ? 'CONSTRAINTS: ' + brief.constraints : '',
  brief.context ? 'CONTEXT: ' + brief.context : '',
  (brief.docs && brief.docs.length) ? 'DOCS TO STUDY: ' + brief.docs.join(', ') : '',
  (brief.urls && brief.urls.length) ? 'LINKS: ' + brief.urls.join(', ') : '',
].filter(Boolean).join('\n')
var baseBrief = briefText || 'No brief was passed via args. Reconstruct the subject from the working-directory materials in the Ground phase and record EACH assumption explicitly.'

// ===================== Phase 1: Frame =====================
phase('Frame')
var sharpened = await agent(
  'You are a head of marketing strategy. Raw brief:\n\n' + baseBrief + '\n\n' +
  'Sharpen it into a working brief (<=250 words): 1) what exactly we sell and to whom; 2) ONE primary business goal + 1-2 secondary; 3) key assumptions (explicit, as a list); 4) the north-star metric. If only a short sentence was passed — expand it, deriving audience/goals/positioning as EXPLICIT hypotheses (label "hypothesis"). Dense, in English, no fluff. If data is thin — do NOT invent; list what to clarify in Ground.',
  { label: 'frame:brief', phase: 'Frame' }
)

// ===================== Phase 2: Ground =====================
phase('Ground')
var groundPacks = (await parallel([
  function () {
    return agent(
      'You are a research analyst. Sharpened brief:\n\n' + sharpened + '\n\n' +
      'Collect VERIFIABLE facts about the subject: Read/Grep/Glob over the working directory (docs, site code, analytics), WebFetch for paths/links from the brief. For EACH fact — a source (file:line or URL) and confidence. Do NOT invent — whatever is missing goes to openQuestions. Look for: offer/pricing, metrics/analytics, positioning, assets (case studies), technical facts (sitemap, schema, tracking events).',
      { label: 'ground:internal', phase: 'Ground', schema: EVIDENCE_SCHEMA }
    )
  },
  function () {
    return agent(
      'You are a market research analyst. Sharpened brief:\n\n' + sharpened + '\n\n' +
      'Via WebSearch/WebFetch collect EXTERNAL context with sources (URL): the category and its dynamics, 3-5 direct competitors, their offers/pricing if public, typical channels for this audience, benchmarks. For each fact — a URL and confidence. If the subject is non-public — focus on the category/market. Do not invent numbers.',
      { label: 'ground:market', phase: 'Ground', schema: EVIDENCE_SCHEMA }
    )
  },
  function () {
    return agent(
      'You are a pricing research analyst. Sharpened brief:\n\n' + sharpened + '\n\n' +
      'Via WebSearch/WebFetch run DEEP pricing research with sources (URL). Find CONCRETE numbers: 1) real prices/rates of direct competitors and comparable services (if public); 2) market rates for this role/service by geography (e.g. AI PM / fractional CTO / specialist consulting rates — daily, project, retainer); 3) willingness-to-pay benchmarks and typical monetization models (fixed / retainer / % of outcome); 4) pricing anchors for EVE (cost of an in-house hire, average agency invoice). For EACH number — a URL and confidence; whatever you could not find goes to openQuestions. Do NOT invent numbers — better to mark low confidence or move to openQuestions.',
      { label: 'ground:pricing', phase: 'Ground', schema: EVIDENCE_SCHEMA }
    )
  },
])).filter(Boolean)
var evidence = evidenceDigest(groundPacks)
log('Ground: collected ' + groundPacks.reduce(function (n, p) { return n + (p.facts || []).length }, 0) + ' facts with sources.')

// ===================== Phase 3: Dimensions (each on its own skill) =====================
var DIMENSIONS = [
  { key: 'positioning', title: 'Positioning & JTBD', skills: ['ajtbd:ajtbd', 'competitors'], lens: 'Positioning per April Dunford (competitive alternatives → unique attributes → value → who cares most) + JTBD: functional/emotional/social job, forces of progress, trigger events. 2-3 positioning-statement options, the core "job", what we compete against.' },
  { key: 'audience', title: 'Audience & segmentation', skills: ['customer-research', 'ajtbd:ajtbd'], lens: 'ICP and segmentation by jobs: who, in what situation, with what trigger seeks a solution. 2-3 segments with pains (unprompted), where to find them. Which to focus on and why (PMF).' },
  { key: 'offer', title: 'Offer & value/price', skills: ['pricing'], lens: 'Offer and monetization: value-based, Van Westendorp/WTP, good-better-best, packaging. Core value proposition, packaging options, justify price through value. Cross-check with cost/unit-economics AND with the MARKET PRICES from the Evidence Pack (the pricing-research section — real competitor and market rates with URLs). You MUST anchor the recommended price to the found market anchors (cost of hiring, agency invoice) with concrete numbers. If pricing data in the Evidence Pack is thin — run WebSearch/WebFetch on competitor prices and market rates yourself and cite numbers with URLs. Mark any price without a source as a hypothesis.' },
  { key: 'messaging', title: 'Messaging & copywriting', skills: ['copywriting', 'marketing-psychology', 'design:ux-copy'], lens: 'Messaging: main value prop, 3-5 messaging pillars, objection handling. Direct-response + behavioral psychology (social proof, anchoring, loss aversion, authority) — ethically. Example headlines/bullets.' },
  { key: 'seo_geo', title: 'SEO & GEO (AI search)', skills: ['ai-seo', 'seo-audit', 'schema'], lens: 'SEO + GEO. Consider Ahrefs 2026 (if in the Evidence Pack): "Best X" listicles = 43.8% of ChatGPT citations; 67% from non-influenceable sources; YouTube — highest correlation (0.737); schema does NOT affect AI citations (but is useful for the Google Knowledge Graph); AI Overviews cut clicks to #1 by 58%; 99.9% of AIOs on informational queries. Topic clusters, how to get into others\' "Best X" lists, the role of YouTube, what NOT to over-invest in.' },
  { key: 'content', title: 'Content strategy', skills: ['content-strategy'], lens: 'Content: topical authority, formats by funnel stage, 4-6 pillar topics, cadence. Tie to informational intent and to formats AI cites. Content pillars + flagship pieces.' },
  { key: 'channels', title: 'Channels & distribution', skills: ['marketing-plan', 'community-marketing'], lens: 'Channels: owned/earned/paid + community. Where the ICP actually is (cross-check with the Evidence Pack). Prioritize 2-3 channels for the constraints, justify, cut what won\'t pay off. For each — the mechanics.' },
  { key: 'growth', title: 'Growth loops & retention', skills: ['referrals', 'free-tools', 'lead-magnets'], lens: 'Growth engineering: referral/viral loops, free tools, lead magnets, community as a loop. 1-2 realistic loops for the resources and what to measure.' },
  { key: 'brand_measure', title: 'Brand voice & measurement', skills: ['analytics', 'ab-testing'], lens: 'Brand voice (tone) + measurement: north-star, 3-5 funnel KPIs, an A/B plan for risky hypotheses (accounting for the real traffic volume from the Evidence Pack). Tone rules + a metric tree.' },
]

phase('Dimensions')
var dimResults = (await parallel(DIMENSIONS.map(function (d) {
  return function () {
    return agent(
      skillBlock(d.skills) +
      'You are an expert on "' + d.title + '". Working brief:\n\n' + sharpened + '\n\n' +
      'VERIFIABLE FACT PACK (Evidence Pack):\n' + evidence + '\n\n' +
      'TASK (through the loaded skill\'s methodology): ' + d.lens + '\n\n' +
      'Concrete and applicable to the subject. Rely on Evidence Pack facts with their source. Mark any number outside the pack as an assumption.',
      { label: 'dim:' + d.key, phase: 'Dimensions', schema: DIMENSION_SCHEMA }
    ).then(function (r) { if (!r) return null; r._title = d.title; return r })
  }
}))).filter(Boolean)

var dimDigest = dimResults.map(function (r) {
  return '### ' + r._title + '\n_Skills: ' + (r.skillsUsed || []).join(', ') + ' · Theory: ' + (r.theoryBasis || '—') + '_\n**Insights:**\n' + bullets(r.keyInsights) + '\n**Recommendations:**\n' + bullets(r.recommendations) + '\n**Assumptions:**\n' + bullets(r.assumptions) + '\n**Risks:**\n' + bullets(r.risks)
}).join('\n\n')

// ===================== Phase 4: Red-team =====================
phase('Red-team')
var redteam = await agent(
  skillBlock(['marketing-psychology']) +
  'You are a skeptical contrarian on the board. In front of you is analysis across ' + dimResults.length + ' dimensions and a fact pack. Do NOT agree: build the strongest counter-case (what if the main bet is wrong?), name the riskiest assumptions taken on faith, and a cheap test that would refute them. Apply mental models from the skill (inversion, second-order thinking). Concrete and uncomfortable.\n\nFACTS:\n' + evidence + '\n\nANALYSIS:\n' + dimDigest,
  { label: 'redteam:challenge', phase: 'Red-team', schema: REDTEAM_SCHEMA }
)

// ===================== Phase 5: Synthesize =====================
phase('Synthesize')
var strategy = await agent(
  skillBlock(['marketing-plan', 'marketing-psychology']) +
  'You are a CMO. Sharpened brief:\n\n' + sharpened + '\n\nFacts:\n' + evidence + '\n\nAnalysis across ' + dimResults.length + ' dimensions:\n\n' + dimDigest + '\n\n' +
  'RED-TEAM (must answer):\nCounter-case: ' + redteam.strongestCounterCase + '\nRiskiest assumptions: ' + (redteam.riskiestAssumptions || []).join('; ') + '\n\n' +
  'Assemble a COHERENT strategy in Markdown (English), applying the marketing-plan skill methodology. Sections: 1) Big bet; 2) Response to the red-team objections (explicit section); 3) Positioning (statement + what we compete against); 4) Focus segment(s) and their job; 5) Value proposition and offer; 6) Messaging pillars (3-5); 7) Channels (2-3 with mechanics); 8) Content and SEO/GEO bets; 9) Growth loop; 10) Metrics (north-star + KPI tree); 11) 90-day roadmap by sprints. RESOLVE conflicts explicitly. Every important number — with a source from the Evidence Pack, or label it "hypothesis — verify via ...". No fluff.',
  { label: 'synthesize:strategy', phase: 'Synthesize' }
)

// ===================== Phase 6: Tasks (RICE via product-manager-toolkit) =====================
phase('Tasks')
var taskData = await agent(
  skillBlock(['product-manager-toolkit']) +
  'You are a marketing operations lead. Strategy:\n\n' + strategy + '\n\n' +
  'Applying the RICE methodology from the product-manager-toolkit skill, break the strategy into CONCRETE actionable tasks (12-20). Each: title (verb+result); dimension; description (what and why, 1-2 sentences); firstStep (first step today); RICE: reach (1-10), impact (0.25/0.5/1/2/3), confidence (0.5/0.8/1.0), effort (person-days, >=0.5). EACH task is atomic (one action — one result; a deliverable with 3+ parts = split). Realistic for the stated resources.',
  { label: 'tasks:decompose', phase: 'Tasks', schema: TASKS_SCHEMA }
)

// ===================== Phase 7: Verify (in parallel) =====================
phase('Verify')
var verifyOut = await parallel([
  function () {
    return agent(
      'You are a fact-checker. Check EVERY quantitative and factual claim in the strategy against the Evidence Pack. Find the ones not backed by a source and not labeled as a hypothesis (overclaim, fabricated numbers, "only one on the market" unverified). For each, give a fix.\n\nEVIDENCE PACK:\n' + evidence + '\n\nSTRATEGY:\n' + strategy,
      { label: 'verify:claims', phase: 'Verify', schema: CLAIMS_SCHEMA }
    )
  },
  function () {
    return agent(
      'You are an operations reviewer. Check the tasks for: 1) atomicity (a deliverable with 3+ parts = split); 2) realistic effort; 3) sane RICE. RETURN the CORRECTED task array and a short changesNote.\n\nTASKS (JSON):\n' + JSON.stringify((taskData && taskData.tasks) || []),
      { label: 'verify:tasks', phase: 'Verify', schema: TASKVERIFY_SCHEMA }
    )
  },
])
var claims = verifyOut[0] || { unsupported: [], verdict: '—' }
var taskFix = verifyOut[1] || { tasks: (taskData && taskData.tasks) || [], changesNote: 'no changes' }

// ===================== Phase 8: Finalize =====================
phase('Finalize')
var finalStrategy = await agent(
  'Incorporate the verification results and OUTPUT the final corrected strategy in Markdown (English). Keep the structure, remove overclaim/fabricated numbers (replace with "hypothesis — verify via ..."), close weak spots. No preamble — only the final document.\n\nORIGINAL STRATEGY:\n' + strategy + '\n\nUNSUPPORTED CLAIMS (to fix):\n' + ((claims.unsupported || []).map(function (u) { return '- ' + u.claim + ' → ' + u.fix }).join('\n') || '—'),
  { label: 'finalize:strategy', phase: 'Finalize' }
)
// ===================== Phase 8.5: Edit (editing into a coherent narrative) =====================
phase('Edit')
var editedStrategy = await agent(
  skillBlock(['copy-editing', 'copywriting']) +
  'You are an editor-in-chief. Rewrite the strategy into a COHERENT, LOGICAL, READABLE narrative for a smart business reader (CEO/investor). Right now the text is dense, jargon-heavy, and in places "glued from disconnected words" — fix that while PRESERVING all content.\n' +
  'EDITING RULES:\n' +
  '- Coherence and logic: one paragraph — one idea; explicit transitions; cause-and-effect flow; each section follows from the previous.\n' +
  '- Plain human language: remove internal jargon and shortcuts ("§Strike3", "RAT", "second-order", "sunk-cost loop", "Map≠Territory", etc.) — explain in plain words or remove; expand abbreviations on first use.\n' +
  '- KEEP sources (that is the value), but present them cleanly: NOT "[Source 2, high]" after every word — reduce to a tidy form ("confirmed in code", a footnote), without clutter.\n' +
  '- Keep ALL substantive facts, numbers, conclusions, the section structure, and the 90-day plan. Cut form (repetition, looseness, graphomania), NOT content.\n' +
  '- Businesslike, confident tone, active voice. No exclamations, buzzwords, or bureaucratese.\n' +
  '- Clean Markdown with clear headings. No preamble — only the final document.\n\n' +
  'ORIGINAL STRATEGY:\n' + finalStrategy,
  { label: 'edit:strategy', phase: 'Edit' }
)
var onePager = await agent(
  skillBlock(['copywriting']) +
  'Compress the edited strategy into an EXECUTIVE ONE-PAGER (Markdown, English, <=1 page), in coherent human language: Big bet (2-3 sentences); Positioning (1 statement); Focus segment; Top-3 bets; 3 key metrics; what to do in the first 2 weeks. Just the essence, readable.\n\nSTRATEGY:\n' + editedStrategy,
  { label: 'edit:onepager', phase: 'Edit' }
)

var scoredTasks = scoreTasks(taskFix.tasks || [])
var tasksMarkdown = renderTasksMarkdown(scoredTasks)
var skillsLog = {}
dimResults.forEach(function (r) { (r.skillsUsed || []).forEach(function (s) { skillsLog[s] = true }) })

// ===================== Phase 9: Render (dashboard report with charts) =====================
phase('Render')
var reportHtml = await agent(
  skillBlock(['frontend-design']) +
  'You are a product frontend designer. Build ONE self-contained HTML — a MARKETING REPORT as a DASHBOARD (not a long-read!) that you "grasp at a glance in 30 seconds". Use the frontend-design skill aesthetic (expressive, not generic-AI), responsive, inline <style>, Google Fonts allowed.\n' +
  'STRUCTURE (dashboard-first):\n' +
  '1) Executive dashboard at the top: north-star as a large card + 3-4 KPI cards (from the one-pager/strategy metrics). If there is no exact number — label it "target" or "hypothesis", do not invent.\n' +
  '2) CHARTS via Chart.js (CDN https://cdn.jsdelivr.net/npm/chart.js):\n' +
  '   • RICE prioritization — build STRICTLY from the real task data (bubble: x=effort, y=impact, size=reach, label=title; or a horizontal bar by rice). Highlight the top tasks.\n' +
  '   • 90-day roadmap — sprints as horizontal bars (extract from the roadmap section; no dates — by weeks/sprints).\n' +
  '   • Channels — donut/bar of effort allocation across the priority channels from the strategy.\n' +
  '   • Funnel (if the strategy has awareness→consideration→conversion stages).\n' +
  '   Do NOT present numbers outside the data as fact — label them "estimate". The RICE chart — only real task numbers.\n' +
  '3) Top tasks — a compact RICE table/cards (top by rice).\n' +
  '4) Strategy narrative — in COLLAPSIBLE <details> by section (secondary, not central). Markdown → semantic HTML yourself.\n' +
  '5) Red-team and Fact-check — compact cards (counter-case briefly, verdict, number of fixes).\n' +
  '6) Skill badges + methodology ONLY as small text at the bottom (NOT a separate large titled section) + footer.\n' +
  'TECH REQUIREMENTS: each <canvas> must have a UNIQUE id that does NOT collide with any section/anchor id (otherwise getElementById returns the section and the chart won\'t build — a common bug). Wrap each new Chart in try/catch. Chart.js — for charts, minimal navigation. Output ONLY the HTML, no markdown wrapper and no text before/after.\n\n' +
  'REPORT DATA:\n' +
  'SUBJECT: ' + (brief.subject || 'Marketing strategy') + '\n' +
  'SKILLS USED: ' + (Object.keys(skillsLog).join(', ') || '—') + '\n\n' +
  '=== ONE-PAGER (markdown) ===\n' + onePager + '\n\n' +
  '=== STRATEGY NARRATIVE (markdown) ===\n' + editedStrategy + '\n\n' +
  '=== TASKS (JSON, with a rice field, sorted) ===\n' + JSON.stringify(scoredTasks) + '\n\n' +
  '=== RED-TEAM ===\nCounter-case: ' + (redteam.strongestCounterCase || '—') + '\nRiskiest assumptions: ' + (redteam.riskiestAssumptions || []).join('; ') + '\n\n' +
  '=== FACT-CHECK ===\nVerdict: ' + (claims.verdict || '—') + '\nNumber of fixes: ' + ((claims.unsupported || []).length),
  { label: 'render:dashboard', phase: 'Render' }
)
if (typeof reportHtml === 'string') {
  reportHtml = reportHtml.replace(/^\s*```(?:html)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
}

log('Done: ' + groundPacks.reduce(function (n, p) { return n + (p.facts || []).length }, 0) + ' facts, ' + dimResults.length + ' dimensions, ' + scoredTasks.length + ' tasks, ' + Object.keys(skillsLog).length + ' skills, ' + ((claims.unsupported || []).length) + ' fact-check fixes, HTML ' + (reportHtml ? reportHtml.length + ' chars' : 'none') + '.')

return {
  onePager: onePager,
  strategyMarkdown: editedStrategy,
  strategyRaw: finalStrategy,
  reportHtml: reportHtml,
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
