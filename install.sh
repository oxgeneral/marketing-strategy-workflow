#!/usr/bin/env bash
#
# install.sh — установка workflow marketing-strategy и его навыков для Claude Code.
#
# По умолчанию: ставит навыки (3 источника) через claude CLI и копирует
# .claude/workflows + .claude/commands в целевой проект (текущая папка).
#
# Использование:
#   ./install.sh [--target DIR] [--skills-only] [--no-skills] [-h|--help]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$PWD"
DO_SKILLS=1
DO_COPY=1

c() { printf '\033[%sm%s\033[0m\n' "$1" "$2"; }
info() { c "36" "→ $1"; }
ok()   { c "32" "✓ $1"; }
warn() { c "33" "! $1"; }
err()  { c "31" "✗ $1" >&2; }

usage() {
  cat <<'EOF'
install.sh — marketing-strategy workflow для Claude Code

Использование:
  ./install.sh [опции]

Опции:
  --target DIR    Куда копировать .claude/ (по умолчанию: текущая папка)
  --skills-only   Только установить навыки, не копировать файлы
  --no-skills     Только скопировать файлы, не ставить навыки
  -h, --help      Показать эту справку

По умолчанию ставит навыки (coreyhaines marketing-skills + ajtbd + design)
и копирует workflow и команду в DIR/.claude/.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --target) TARGET="${2:?--target требует путь}"; shift 2 ;;
    --skills-only) DO_COPY=0; shift ;;
    --no-skills) DO_SKILLS=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) err "Неизвестный аргумент: $1"; usage; exit 1 ;;
  esac
done

# --- Навыки ---
install_plugin() {
  # $1 = owner/repo (маркетплейс), $2 = plugin@marketplace
  info "Маркетплейс: $1"
  claude plugin marketplace add "$1" 2>&1 | sed 's/^/    /' \
    || warn "marketplace add вернул ошибку (возможно, уже добавлен) — продолжаю"
  info "Навык: $2"
  claude plugin install "$2" 2>&1 | sed 's/^/    /' \
    || warn "install вернул ошибку (возможно, уже установлен) — продолжаю"
}

if [ "$DO_SKILLS" -eq 1 ]; then
  if ! command -v claude >/dev/null 2>&1; then
    warn "claude CLI не найден в PATH — пропускаю установку навыков."
    warn "Установи Claude Code (https://claude.com/claude-code) и запусти снова, либо ставь навыки вручную (см. README)."
  else
    info "Устанавливаю навыки из 3 источников…"
    install_plugin "coreyhaines31/marketingskills"      "marketing-skills@marketingskills"
    install_plugin "oxgeneral/ajtbd-claude-skill"       "ajtbd@ajtbd-claude-skill"
    install_plugin "anthropics/knowledge-work-plugins"  "design@knowledge-work-plugins"
    ok "Навыки обработаны (product-manager-toolkit не из публичного маркетплейса — workflow использует встроенный RICE как fallback)."
  fi
fi

# --- Копирование файлов workflow ---
SRC_WF="$SCRIPT_DIR/.claude/workflows/marketing-strategy.js"
SRC_CMD="$SCRIPT_DIR/.claude/commands/marketing.md"

if [ "$DO_COPY" -eq 1 ]; then
  if [ ! -f "$SRC_WF" ] || [ ! -f "$SRC_CMD" ]; then
    warn "Файлы workflow не найдены рядом со скриптом — запусти install.sh из склонированного репозитория. Пропускаю копирование."
  elif [ "$TARGET" = "$SCRIPT_DIR" ]; then
    info "Цель совпадает с репозиторием — файлы уже на месте, копирование не требуется."
  else
    info "Копирую workflow в $TARGET/.claude/…"
    mkdir -p "$TARGET/.claude/workflows" "$TARGET/.claude/commands"
    cp "$SRC_WF"  "$TARGET/.claude/workflows/"
    cp "$SRC_CMD" "$TARGET/.claude/commands/"
    ok "Скопировано: .claude/workflows/marketing-strategy.js, .claude/commands/marketing.md"
  fi
fi

echo
ok "Готово."
echo
c "1" "Дальше:"
echo "  1. Перезапусти сессию Claude Code — зарегистрируются свежие навыки и команда /marketing."
echo "  2. Запусти из одного вопроса:  /marketing <что продвигаем и главная цель>"
echo "     или программно:  Workflow({ name: 'marketing-strategy', args: 'одна фраза-бриф' })"
echo
warn "Без перезапуска workflow тоже работает: навыки подхватываются чтением SKILL.md с диска (graceful fallback)."
