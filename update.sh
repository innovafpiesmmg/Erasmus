#!/bin/bash
# Actualización rápida de la plataforma Erasmus+ SEA
# IES Manuel Martín González · Guía de Isora, Tenerife
#
# Uso:  sudo bash /var/www/sea-erasmus/update.sh
set -e
cd "$(dirname "$0")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[ OK ]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
die()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ "$EUID" -ne 0 ]] && die "Ejecuta este script como root:  sudo bash update.sh"

# ── Cargar variables de entorno ───────────────────────────────
ENV_FILE="/etc/sea-erasmus/env"
if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^[[:space:]]*#.*$ || -z "$key" ]] && continue
        export "$key=$value" 2>/dev/null || true
    done < "$ENV_FILE"
    ok "Variables de entorno cargadas desde $ENV_FILE"
else
    die "No se encontró $ENV_FILE — ¿está instalada la plataforma? Ejecuta install.sh primero."
fi

API_PORT="${PORT:-8080}"

echo ""
echo -e "${BOLD}${CYAN}▸ Actualizando Plataforma Erasmus+ SEA${NC}"
echo ""

info "[1/6] Actualizando código desde GitHub..."
git pull --quiet
ok "Código actualizado."

info "[2/6] Instalando dependencias de Node.js..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
ok "Dependencias listas."

info "[3/6] Compilando servidor API..."
pnpm --filter @workspace/api-server run build 2>&1 | tail -3
ok "Servidor API compilado."

info "[4/6] Compilando frontend web..."
PORT=3000 BASE_PATH=/ API_PORT="$API_PORT" NODE_ENV=production \
    pnpm --filter @workspace/erasmus-web run build 2>&1 | tail -3
ok "Frontend compilado."

info "[5/6] Sincronizando esquema de base de datos..."
DATABASE_URL="$DATABASE_URL" \
    pnpm --filter @workspace/db run push-force 2>&1 | tail -3
ok "Esquema de base de datos sincronizado."

info "[6/6] Reiniciando servicio..."
systemctl restart sea-erasmus
sleep 2
if systemctl is-active --quiet sea-erasmus; then
    ok "Servicio sea-erasmus reiniciado correctamente."
else
    die "El servicio no arrancó. Comprueba: journalctl -u sea-erasmus -n 50"
fi

echo ""
echo -e "${GREEN}${BOLD}✓ Actualización completada.${NC}"
echo ""
