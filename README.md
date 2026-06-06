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

### Быстро — одним скриптом

```bash
git clone https://github.com/oxgeneral/marketing-strategy-workflow.git
cd marketing-strategy-workflow
./install.sh --target /путь/к/вашему/проекту
```

`install.sh` ставит навыки (3 источника ниже) через `claude` CLI **и** копирует `.claude/workflows/marketing-strategy.js` + `.claude/commands/marketing.md` в ваш проект. Опции:

| Опция | Что делает |
|---|---|
| `--target DIR` | Куда копировать `.claude/` (по умолчанию — текущая папка) |
| `--skills-only` | Только установить навыки, не копировать файлы |
| `--no-skills` | Только скопировать файлы, не ставить навыки |
| `-h`, `--help` | Справка |

> Скрипт идемпотентен (повторный запуск безопасен) и не падает, если навык уже установлен или `claude` CLI отсутствует.

### Откуда берутся навыки (если ставить вручную)

| Навыки | Источник | Команды |
|---|---|---|
| `ai-seo`, `seo-audit`, `schema`, `pricing`, `copywriting`, `customer-research`, `content-strategy`, `marketing-plan`, `community-marketing`, `co-marketing`, `referrals`, `free-tools`, `lead-magnets`, `analytics`, `ab-testing`, `competitors`, `marketing-psychology` | **coreyhaines31/marketingskills** (43 навыка, MIT) | `claude plugin marketplace add coreyhaines31/marketingskills`<br>`claude plugin install marketing-skills@marketingskills` |
| `ajtbd` | **oxgeneral/ajtbd-claude-skill** | `claude plugin marketplace add oxgeneral/ajtbd-claude-skill`<br>`claude plugin install ajtbd@ajtbd-claude-skill` |
| `design:ux-copy`, `user-research`, `research-synthesis` | **anthropics/knowledge-work-plugins** | `claude plugin marketplace add anthropics/knowledge-work-plugins`<br>`claude plugin install design@knowledge-work-plugins` |
| `product-manager-toolkit` (RICE) | нет публичного маркетплейса | — (workflow считает RICE по встроенной методологии) |

> Одна установка `coreyhaines31/marketingskills` закрывает ~90% навыков (включая `marketing-psychology`). Без навыков workflow тоже работает — это graceful fallback. Свежеустановленные навыки регистрируются в инструменте Skill **после перезапуска сессии**; до этого workflow подхватывает их методологию чтением `SKILL.md` с диска.

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
