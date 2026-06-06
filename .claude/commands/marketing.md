---
description: Маркетинговая стратегия + RICE-задачи из одного вопроса (запускает workflow marketing-strategy)
argument-hint: [1-2 фразы — что продвигаем и главная цель]
---

Запусти генерацию маркетинговой стратегии через workflow `marketing-strategy` в режиме «один вопрос». Действуй строго по шагам.

## Шаг 1 — получить бриф (ровно один вопрос)
- Если `$ARGUMENTS` непустой — это и есть бриф, используй его как есть (НЕ задавай вопросов).
- Если `$ARGUMENTS` пустой — задай пользователю РОВНО ОДИН вопрос и заверши ход, дождавшись ответа:
  > «Опиши в 1–2 фразах: что продвигаем (продукт/бренд) и какая главная цель?»
  Больше ничего не спрашивай: аудиторию, позиционирование, ограничения и каналы workflow выведет сам на фазе Frame и подтвердит фактами на фазе Ground.

## Шаг 2 — запустить workflow
Вызови инструмент **Workflow** с:
- `scriptPath`: `.claude/workflows/marketing-strategy.js` (резерв: `name: "marketing-strategy"`)
- `args`: строку брифа из шага 1 как есть (workflow принимает свободный текст — одной фразы достаточно).

Workflow тяжёлый (~19 агентов, 15–25 мин, >1M токенов) — он уходит в фон. НЕ опрашивай статус вручную; дождись уведомления о завершении и продолжай автоматически.

## Шаг 3 — сохранить результат
Из output-файла возьми `result` (поля: `onePager`, `strategyMarkdown`, `reportHtml`, `tasks`, `tasksMarkdown`, `redteam`, `claimsCheck`, `evidence`, `skillsUsed`, `dimensions`). Распарси JSON через Bash+python (результат большой). Сохрани в папку `marketing/` (она git-ignored) с понятным `<slug>` объекта и текущим `<YYYY-MM>`:
- `marketing/report-<slug>-<YYYY-MM>.html` — `reportHtml` (готовый красивый HTML-отчёт от frontend-design; **основной артефакт** — открывается в браузере)
- `marketing/onepager-<slug>-<YYYY-MM>.md` — `onePager`
- `marketing/strategy-<slug>-<YYYY-MM>.md` — `strategyMarkdown` + приложения (red-team, fact-check, Evidence Pack, 9 сторон)
- `marketing/tasks-<slug>-<YYYY-MM>.md` — `tasksMarkdown` (RICE уже посчитан внутри workflow)

Запиши `reportHtml` в `.html` как есть (не оборачивай и не экранируй).

Проверь `git check-ignore`, что файлы не попадут в гит.

## Шаг 4 — показать
Выведи executive-однопейджер целиком и топ-5 задач по RICE. Кратко отметь: что поймал red-team и сколько неподкреплённых утверждений нашёл fact-check.
