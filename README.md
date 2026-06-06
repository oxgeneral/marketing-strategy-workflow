# marketing-strategy — Claude Code workflow

> Мульти-агентный workflow для Claude Code: из одного вопроса собирает **целостную маркетинговую стратегию** и **RICE-приоритизированный бэклог задач**, опираясь на **реальные навыки (Skills)**, а не на «общие промпты».

Каждая сторона маркетинга анализируется отдельным агентом, который **загружает настоящий навык** (методологию), затем результаты проходят через red-team и двойную верификацию фактов.

---

## Чем отличается

- **Реальные навыки, не выжимки.** Каждый агент-сторона грузит профильный навык по гибридной схеме:
  1. инструмент **Skill** (если навык зарегистрирован в сессии);
  2. иначе — **`find` + `Read`** настоящего `SKILL.md` (и его `references/*.md`) из установленного плагина;
  3. иначе — встроенная методология как graceful fallback (workflow не падает, если навыков нет).
- **Детерминированный Ground.** Перед анализом 3 ресёрчера собирают **проверяемые факты с источниками** (репозиторий/код, рынок/веб, отдельный ценовой интернет-ресерч).
- **Адверсариальность.** Red-team оспаривает ставку *до* синтеза; fact-checker ловит неподкреплённые утверждения; task-verifier разбивает неатомарные задачи.
- **Параметризация одной фразой.** Бриф можно передать как простой текст — `Frame` развернёт его, `Ground` подтвердит фактами.

## Архитектура

```
Frame      → распарсить бриф, заострить, зафиксировать допущения
Ground     → 3 ресёрчера: внутренний (репо/код) ‖ рынок/веб ‖ ценовой интернет-ресерч  → единый Evidence Pack с источниками
Dimensions → ~9 сторон параллельно, каждая на своём РЕАЛЬНОМ навыке
Red-team   → оспорить складывающийся консенсус (inversion, second-order)
Synthesize → целостная стратегия, отвечающая на возражения red-team
Tasks      → разложить в задачи с полями RICE
Verify     → fact-check утверждений ‖ проверка атомарности задач (параллельно)
Finalize   → финальная стратегия + executive-однопейджер; RICE считается и сортируется в коде
```

## Стороны маркетинга и навыки

| Сторона | Навык(и) |
|---|---|
| Позиционирование и JTBD | `ajtbd` + `competitors` |
| Аудитория и сегментация | `ajtbd` + `customer-research` |
| Оффер и ценность/цена | `pricing` (+ ценовой интернет-ресерч) |
| Сообщения и копирайтинг | `marketing-psychology` + `copywriting` + `design:ux-copy` |
| SEO и GEO (AI-поиск) | `ai-seo` + `seo-audit` + `schema` |
| Контент-стратегия | `content-strategy` |
| Каналы и дистрибуция | `marketing-plan` + `community-marketing` |
| Growth-петли и удержание | `referrals` + `free-tools` + `lead-magnets` |
| Brand voice и измерение | `analytics` + `ab-testing` |
| Декомпозиция задач (RICE) | `product-manager-toolkit` |

## Установка

Скопируйте папку `.claude/` в корень своего проекта (или склонируйте репозиторий туда):

```
.claude/
├── workflows/marketing-strategy.js   # сам workflow
└── commands/marketing.md             # слэш-команда «один вопрос»
```

### Навыки (опционально, но рекомендуется)

Workflow работает и без них (fallback на встроенную методологию), но для максимума установите:

```bash
# 43 маркетинговых навыка (ai-seo, pricing, copywriting, customer-research, content-strategy, ...)
claude plugin marketplace add coreyhaines31/marketingskills
claude plugin install marketing-skills@marketingskills
```

Также используются (если установлены): `ajtbd`, `marketing-psychology`, `product-manager-toolkit`, `design:ux-copy`. Свежеустановленные навыки регистрируются в инструменте Skill **после перезапуска сессии**; до этого workflow подхватывает их методологию чтением `SKILL.md` с диска.

## Использование

**Одной фразой (слэш-команда):**
```
/marketing продвигаю Telegram-бот для записи к репетиторам, цель — первые 100 платящих
```
Без аргумента `/marketing` задаст ровно один вопрос.

**Через инструмент Workflow (программно):**
```js
Workflow({ name: 'marketing-strategy', args: 'одна фраза-бриф' })
// или структурно:
Workflow({ name: 'marketing-strategy', args: { subject, goals, audience, positioning, constraints, context, docs: [], urls: [] } })
```

> ⚠️ Workflow тяжёлый (~20 агентов, 15–25 мин, >1M токенов). Запускайте осознанно.

## Что возвращает

Объект с полями: `onePager`, `strategyMarkdown`, `tasks` (с RICE, отсортированы), `tasksMarkdown`, `evidence` (факты с источниками), `redteam`, `claimsCheck`, `skillsUsed` (что и каким способом реально загружено), `dimensions`. Вызывающий сохраняет это в файлы.

## Лицензия

MIT © Aleksandr Fefelov. Навыки `marketing-skills` — © Corey Haines (MIT), устанавливаются отдельно.
