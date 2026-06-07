---
description: Marketing strategy + RICE tasks from a single question (runs the marketing-strategy workflow)
argument-hint: [1-2 sentences — what you're promoting and the main goal]
---

Run marketing strategy generation via the `marketing-strategy` workflow in "single question" mode. Follow the steps strictly.

## Step 1 — get the brief (exactly one question)
- If `$ARGUMENTS` is non-empty — that is the brief, use it as is (do NOT ask questions).
- If `$ARGUMENTS` is empty — ask the user EXACTLY ONE question and end the turn, waiting for the answer:
  > "Describe in 1-2 sentences: what are you promoting (product/brand) and what is the main goal?"
  Ask nothing else: audience, positioning, constraints, and channels are derived by the workflow in the Frame phase and confirmed with facts in the Ground phase.

## Step 2 — run the workflow
Call the **Workflow** tool with:
- `scriptPath`: `.claude/workflows/marketing-strategy.js` (fallback: `name: "marketing-strategy"`)
- `args`: the brief string from step 1 as is (the workflow accepts free text — a single sentence is enough).

The workflow is heavy (~20 agents, 15-25 min, >1M tokens) — it runs in the background. Do NOT poll the status manually; wait for the completion notification and continue automatically.

## Step 3 — save the result
From the output file take `result` (fields: `onePager`, `strategyMarkdown`, `reportHtml`, `tasks`, `tasksMarkdown`, `redteam`, `claimsCheck`, `evidence`, `skillsUsed`, `dimensions`). Parse the JSON via Bash+python (the result is large). Save to a `marketing/` folder (it is git-ignored) with a clear `<slug>` of the subject and the current `<YYYY-MM>`:
- `marketing/report-<slug>-<YYYY-MM>.html` — `reportHtml` (the ready dashboard report from frontend-design; **the primary artifact** — opens in a browser)
- `marketing/onepager-<slug>-<YYYY-MM>.md` — `onePager`
- `marketing/strategy-<slug>-<YYYY-MM>.md` — `strategyMarkdown` + appendices (red-team, fact-check, Evidence Pack, dimensions)
- `marketing/tasks-<slug>-<YYYY-MM>.md` — `tasksMarkdown` (RICE already computed inside the workflow)

Write `reportHtml` to the `.html` as is (do not wrap or escape it).

Check via `git check-ignore` that the files won't be committed.

## Step 4 — show it
Print the executive one-pager in full and the top-5 tasks by RICE. Briefly note what the red-team caught and how many unsupported claims the fact-check found.
