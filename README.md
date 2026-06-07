<div align="center">

# 🧭 marketing-strategy

### Маркетинговая стратегия и бэклог задач — из одного вопроса. На реальных навыках, а не на «угадайке» LLM.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-workflow-orange)](https://claude.com/claude-code)
[![Skills](https://img.shields.io/badge/навыков-20%2B-blue)](#-стороны-маркетинга-и-навыки)
[![Stars](https://img.shields.io/github/stars/oxgeneral/marketing-strategy-workflow?style=social)](https://github.com/oxgeneral/marketing-strategy-workflow)

</div>

> Попросите обычный чат-бот «сделай маркетинговую стратегию» — получите красивый, уверенный и наполовину выдуманный текст. Здесь иначе: **~20 агентов, каждый со своим настоящим маркетинговым навыком**, собирают факты с источниками, спорят друг с другом и проверяют каждую цифру — и только потом выдают стратегию и приоритизированные задачи.

---

## ✨ Что вы получаете

Один запуск — пять готовых артефактов:

- 📊 **Интерактивный дашборд-отчёт** — самодостаточная HTML-страница (дизайн от навыка `frontend-design`): executive-сводка с KPI, графики (RICE-приоритизация, 90-дневный роадмап, каналы, воронка на Chart.js), сворачиваемая стратегия. Не стыдно открыть на созвоне. → [посмотреть пример](examples/sample-report.html)
- 📄 **Executive-однопейджер** — большая ставка, позиционирование, топ-3 ставки, 3 метрики, что делать в первые 2 недели.
- 🗺️ **Стратегия из 11 разделов** — позиционирование, фокус-сегмент, оффер и цена, messaging pillars, каналы, контент и SEO/GEO, growth-петля, дерево метрик, 90-дневная дорожная карта.
- ✅ **12–20 задач с RICE** — атомарных, отсортированных по приоритету, с конкретным первым шагом.
- 🔍 **Доказательная база** — Evidence Pack с источниками, отчёт red-team и лог проверки фактов. Видно, на чём стоит каждый вывод.

## 🎯 Почему это не «ещё один промпт»

- **Реальные навыки, а не их пересказ.** 9 сторон маркетинга работают на навыках [Corey Haines](https://github.com/coreyhaines31/marketingskills) (`ai-seo`, `pricing`, `copywriting`, `customer-research`…), `ajtbd` (Jobs To Be Done) и `marketing-psychology`. Агент **загружает сам навык** ([как именно](#-стороны-маркетинга-и-навыки)), а не мою выжимку из методологии.
- **Сначала факты, потом мнения.** Перед анализом 3 ресёрчера собирают проверяемые факты — из репозитория/кода, с рынка и отдельным ценовым интернет-ресерчем — **каждый с источником**.
- **Адверсариальность встроена.** Red-team оспаривает главную ставку *до* синтеза; fact-checker ловит выдуманные цифры и overclaim; task-verifier разбивает неатомарные задачи. Стратегия выходит уже после спора с собой.
- **Методология, а не вкусовщина.** April Dunford (позиционирование), JTBD, Van Westendorp (цена), Cialdini (психология), RICE (приоритизация), Theory of Constraints.

> ⚠️ **Честно про цену:** это не кнопка «сделать красиво». Полный прогон — ~20 агентов, 15–25 минут, более 1M токенов. Зато на выходе — то, что обычно делает команда за неделю.

## ⚙️ Как это работает

```
Frame      → распарсить бриф (даже одну фразу), заострить, зафиксировать допущения
Ground     → 3 ресёрчера: репо/код ‖ рынок/веб ‖ ценовой интернет-ресерч  → Evidence Pack с источниками
Dimensions → ~9 сторон маркетинга параллельно, каждая на своём РЕАЛЬНОМ навыке
Red-team   → оспорить складывающийся консенсус (inversion, second-order thinking)
Synthesize → целостная стратегия, отвечающая на возражения red-team
Tasks      → разложить в задачи с полями RICE (навык product-manager-toolkit)
Verify     → fact-check утверждений ‖ проверка атомарности задач (параллельно)
Finalize   → финальная стратегия (учёт fact-check)
Edit       → copy-editing → связный читаемый нарратив (без жаргона) + однопейджер
Render     → frontend-design → дашборд-отчёт с графиками (Chart.js); RICE считается в коде
```

Каждый навык загружается по устойчивой схеме: **Skill → чтение `SKILL.md` с диска → встроенная методология**. Поэтому workflow использует ваши навыки по максимуму, но **не падает**, если их нет.

## 🚀 Установка за одну команду

```bash
git clone https://github.com/oxgeneral/marketing-strategy-workflow.git
cd marketing-strategy-workflow
./install.sh --target /путь/к/вашему/проекту
```

`install.sh` ставит навыки через `claude` CLI **и** копирует workflow в ваш проект. Идемпотентен и не падает, если `claude` нет или навык уже установлен.

| Опция | Что делает |
|---|---|
| `--target DIR` | Куда копировать `.claude/` (по умолчанию — текущая папка) |
| `--skills-only` | Только установить навыки |
| `--no-skills` | Только скопировать файлы |
| `-h`, `--help` | Справка |

## 💬 Использование

**Одной фразой** — самый быстрый путь:

```
/marketing продвигаю Telegram-бот для записи к репетиторам, цель — первые 100 платящих
```

Без аргумента `/marketing` задаст ровно один вопрос. Аудиторию, позиционирование и каналы workflow выведет сам и подтвердит фактами.

**Программно** — через инструмент Workflow:

```js
Workflow({ name: 'marketing-strategy', args: 'одна фраза-бриф' })
// или структурно:
Workflow({ name: 'marketing-strategy', args: { subject, goals, audience, positioning, constraints, context, docs: [], urls: [] } })
```

## 🧩 Стороны маркетинга и навыки

| Сторона | Навык(и) |
|---|---|
| Позиционирование и JTBD | `ajtbd` + `competitors` |
| Аудитория и сегментация | `ajtbd` + `customer-research` |
| Оффер и ценность/цена | `pricing` + ценовой интернет-ресерч |
| Сообщения и копирайтинг | `marketing-psychology` + `copywriting` + `design:ux-copy` |
| SEO и GEO (AI-поиск) | `ai-seo` + `seo-audit` + `schema` |
| Контент-стратегия | `content-strategy` |
| Каналы и дистрибуция | `marketing-plan` + `community-marketing` |
| Growth-петли и удержание | `referrals` + `free-tools` + `lead-magnets` |
| Brand voice и измерение | `analytics` + `ab-testing` |
| Декомпозиция задач (RICE) | `product-manager-toolkit` |

## 📦 Что возвращает

Объект с полями: **`reportHtml`** (готовый красивый HTML-отчёт), `onePager`, `strategyMarkdown`, `tasks` (с RICE, отсортированы), `tasksMarkdown`, `evidence` (факты с источниками), `redteam`, `claimsCheck`, `skillsUsed` (что и каким способом реально загружено), `dimensions`. Вызывающий сохраняет это в файлы (`.html` + `.md`).

## 🔌 Откуда берутся навыки (ручная установка)

| Навыки | Источник | Команды |
|---|---|---|
| `ai-seo`, `seo-audit`, `schema`, `pricing`, `copywriting`, `customer-research`, `content-strategy`, `marketing-plan`, `community-marketing`, `co-marketing`, `referrals`, `free-tools`, `lead-magnets`, `analytics`, `ab-testing`, `competitors`, `marketing-psychology` | **coreyhaines31/marketingskills** (43 навыка, MIT) | `claude plugin marketplace add coreyhaines31/marketingskills`<br>`claude plugin install marketing-skills@marketingskills` |
| `ajtbd` | **oxgeneral/ajtbd-claude-skill** | `claude plugin marketplace add oxgeneral/ajtbd-claude-skill`<br>`claude plugin install ajtbd@ajtbd-claude-skill` |
| `design:ux-copy`, `user-research`, `research-synthesis` | **anthropics/knowledge-work-plugins** | `claude plugin marketplace add anthropics/knowledge-work-plugins`<br>`claude plugin install design@knowledge-work-plugins` |
| `product-manager-toolkit` (RICE) | нет публичного маркетплейса | — (RICE считается по встроенной методологии) |

> Одна установка `coreyhaines31/marketingskills` закрывает ~90% навыков (включая `marketing-psychology`). Свежие навыки регистрируются после перезапуска сессии; до этого workflow читает их `SKILL.md` с диска.

## 📄 Лицензия

MIT © [Aleksandr Fefelov](https://github.com/oxgeneral). Навыки `marketing-skills` — © Corey Haines (MIT), устанавливаются отдельно.

---

<div align="center">
<sub>Собрано как мульти-агентный workflow для <a href="https://claude.com/claude-code">Claude Code</a>. Стратегия, которой не стыдно показать инвестору — потому что под каждым выводом есть источник.</sub>
</div>
