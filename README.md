<div align="center">

# 🧭 marketing-strategy

### A marketing strategy and task backlog — from a single question. On real skills, not LLM guesswork.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-workflow-orange)](https://claude.com/claude-code)
[![Skills](https://img.shields.io/badge/skills-20%2B-blue)](#-marketing-dimensions-and-skills)
[![Stars](https://img.shields.io/github/stars/oxgeneral/marketing-strategy-workflow?style=social)](https://github.com/oxgeneral/marketing-strategy-workflow)

</div>

> Ask a regular chatbot to "make a marketing strategy" and you get a pretty, confident, half-invented text. This is different: **~20 agents, each with its own real marketing skill**, gather facts with sources, argue with each other, and check every number — and only then produce a strategy and prioritized tasks.

---

## ✨ What you get

One run — five ready artifacts:

- 📊 **Interactive dashboard report** — a self-contained HTML page (designed by the `frontend-design` skill): an executive summary with KPIs, charts (RICE prioritization, 90-day roadmap, channels, funnel via Chart.js), and a collapsible strategy. Presentable on a call. → [see the example](examples/sample-report.html)
- 📄 **Executive one-pager** — big bet, positioning, top-3 bets, 3 metrics, what to do in the first two weeks.
- 🗺️ **11-section strategy** — positioning, focus segment, offer and pricing, messaging pillars, channels, content and SEO/GEO, growth loop, metric tree, 90-day roadmap.
- ✅ **12–20 RICE tasks** — atomic, sorted by priority, each with a concrete first step.
- 🔍 **Evidence base** — an Evidence Pack with sources, a red-team report, and a fact-check log. You can see what each conclusion rests on.

## 🎯 Why this isn't "just another prompt"

- **Real skills, not a paraphrase of them.** 9 marketing dimensions run on [Corey Haines'](https://github.com/coreyhaines31/marketingskills) skills (`ai-seo`, `pricing`, `copywriting`, `customer-research`…), `ajtbd` (Jobs To Be Done), and `marketing-psychology`. The agent **loads the skill itself** ([exactly how](#-marketing-dimensions-and-skills)), not a summary of its methodology.
- **Facts first, opinions second.** Before analysis, 3 researchers gather verifiable facts — from the repo/code, the market, and dedicated pricing web research — **each with a source**.
- **Adversarial by design.** The red-team challenges the main bet *before* synthesis; the fact-checker catches fabricated numbers and overclaims; the task-verifier splits non-atomic tasks. The strategy ships after arguing with itself.
- **Methodology, not taste.** April Dunford (positioning), JTBD, Van Westendorp (pricing), Cialdini (psychology), RICE (prioritization), Theory of Constraints.

> ⚠️ **Honest about cost:** this is not a "make it pretty" button. A full run is ~20 agents, 15–25 minutes, and over 1M tokens. In exchange you get what usually takes a team a week.

## ⚙️ How it works

```
Frame      → parse the brief (even one sentence), sharpen it, record assumptions
Ground     → 3 researchers: repo/code ‖ market/web ‖ pricing web research  → Evidence Pack with sources
Dimensions → ~9 marketing dimensions in parallel, each on its own REAL skill
Red-team   → challenge the forming consensus (inversion, second-order thinking)
Synthesize → a coherent strategy that answers the red-team's objections
Tasks      → break down into tasks with RICE fields (product-manager-toolkit skill)
Verify     → fact-check claims ‖ check task atomicity (in parallel)
Finalize   → final strategy (incorporating fact-check)
Edit       → copy-editing → coherent readable narrative (no jargon) + one-pager
Render     → frontend-design → dashboard report with charts (Chart.js); RICE computed in code
```

Each skill loads via a resilient scheme: **Skill → read `SKILL.md` from disk → built-in methodology**. So the workflow uses your skills to the fullest, but **does not break** if they're absent.

## 🚀 Install in one command

```bash
git clone https://github.com/oxgeneral/marketing-strategy-workflow.git
cd marketing-strategy-workflow
./install.sh --target /path/to/your/project
```

`install.sh` installs the skills via the `claude` CLI **and** copies the workflow into your project. It is idempotent and does not fail if `claude` is missing or a skill is already installed.

| Option | What it does |
|---|---|
| `--target DIR` | Where to copy `.claude/` (default: current folder) |
| `--skills-only` | Only install skills |
| `--no-skills` | Only copy files |
| `-h`, `--help` | Help |

## 💬 Usage

**From a single sentence** — the fastest path:

```
/marketing promoting a Telegram bot for booking tutors, goal — the first 100 paying users
```

Without an argument, `/marketing` asks exactly one question. The workflow derives audience, positioning, and channels itself and confirms them with facts.

**Programmatically** — via the Workflow tool:

```js
Workflow({ name: 'marketing-strategy', args: 'one-sentence brief' })
// or structured:
Workflow({ name: 'marketing-strategy', args: { subject, goals, audience, positioning, constraints, context, docs: [], urls: [] } })
```

## 🧩 Marketing dimensions and skills

| Dimension | Skill(s) |
|---|---|
| Positioning & JTBD | `ajtbd` + `competitors` |
| Audience & segmentation | `ajtbd` + `customer-research` |
| Offer & value/price | `pricing` + pricing web research |
| Messaging & copywriting | `marketing-psychology` + `copywriting` + `design:ux-copy` |
| SEO & GEO (AI search) | `ai-seo` + `seo-audit` + `schema` |
| Content strategy | `content-strategy` |
| Channels & distribution | `marketing-plan` + `community-marketing` |
| Growth loops & retention | `referrals` + `free-tools` + `lead-magnets` |
| Brand voice & measurement | `analytics` + `ab-testing` |
| Task breakdown (RICE) | `product-manager-toolkit` |

## 📦 What it returns

An object with fields: **`reportHtml`** (the ready dashboard report), `onePager`, `strategyMarkdown`, `tasks` (with RICE, sorted), `tasksMarkdown`, `evidence` (facts with sources), `redteam`, `claimsCheck`, `skillsUsed` (what was actually loaded and how), `dimensions`. The caller saves it to files (`.html` + `.md`).

## 🔌 Where the skills come from (manual install)

| Skills | Source | Commands |
|---|---|---|
| `ai-seo`, `seo-audit`, `schema`, `pricing`, `copywriting`, `customer-research`, `content-strategy`, `marketing-plan`, `community-marketing`, `co-marketing`, `referrals`, `free-tools`, `lead-magnets`, `analytics`, `ab-testing`, `competitors`, `marketing-psychology` | **coreyhaines31/marketingskills** (43 skills, MIT) | `claude plugin marketplace add coreyhaines31/marketingskills`<br>`claude plugin install marketing-skills@marketingskills` |
| `ajtbd` | **oxgeneral/ajtbd-claude-skill** | `claude plugin marketplace add oxgeneral/ajtbd-claude-skill`<br>`claude plugin install ajtbd@ajtbd-claude-skill` |
| `design:ux-copy`, `user-research`, `research-synthesis` | **anthropics/knowledge-work-plugins** | `claude plugin marketplace add anthropics/knowledge-work-plugins`<br>`claude plugin install design@knowledge-work-plugins` |
| `product-manager-toolkit` (RICE) | no public marketplace | — (RICE is computed via built-in methodology) |

> A single install of `coreyhaines31/marketingskills` covers ~90% of the skills (including `marketing-psychology`). Freshly installed skills register after a session restart; until then the workflow reads their `SKILL.md` from disk.

## 📄 License

MIT © [Aleksandr Fefelov](https://github.com/oxgeneral). The `marketing-skills` skills are © Corey Haines (MIT) and are installed separately.

---

<div align="center">
<sub>Built as a multi-agent workflow for <a href="https://claude.com/claude-code">Claude Code</a>. A strategy you can show an investor — because every conclusion has a source behind it.</sub>
</div>
