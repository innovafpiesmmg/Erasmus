#!/bin/bash
# ==============================================================
#  Autoinstalador — Plataforma Erasmus+ SEA
#  IES Manuel Martín González · Guía de Isora, Tenerife
#
#  Uso:  sudo bash install.sh
#  Requiere: Ubuntu 22.04 / 24.04 LTS, acceso root
# ==============================================================
set -euo pipefail

# ── Colores ────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()      { echo -e "${GREEN}[ OK ]${NC}  $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
die()     { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}▸ $1${NC}"; }
hr()      { echo -e "${CYAN}──────────────────────────────────────────────────────${NC}"; }

# ── Configuración fija ────────────────────────────────────────
APP_NAME="sea-erasmus"
APP_DIR="/var/www/$APP_NAME"
CONFIG_DIR="/etc/$APP_NAME"
API_PORT="8080"
APP_USER="sea-erasmus"
DB_NAME="sea_erasmus"
DB_USER="sea_erasmus"
GITHUB_REPO="https://github.com/innovafpiesmmg/Erasmus"

# ── Verificar root ────────────────────────────────────────────
[[ "$EUID" -ne 0 ]] && die "Ejecuta este script como root:  sudo bash install.sh"

# ── Bienvenida ────────────────────────────────────────────────
clear
echo ""
hr
echo -e "  ${BOLD}Plataforma Erasmus+ SEA — Autoinstalador${NC}"
echo -e "  IES Manuel Martín González · Guía de Isora"
hr
echo ""

# ── Detectar actualización vs instalación nueva ───────────────
IS_UPDATE=false
if [ -f "$CONFIG_DIR/env" ]; then
    IS_UPDATE=true
    warn "Instalación previa detectada → modo ACTUALIZACIÓN"
    # Cargar variables existentes (formato systemd, sin comillas)
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^[[:space:]]*#.*$ || -z "$key" ]] && continue
        declare "$key=$value" 2>/dev/null || true
    done < "$CONFIG_DIR/env"
else
    info "No se encontró instalación previa → modo INSTALACIÓN NUEVA"
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
fi

# ── Preguntas interactivas ────────────────────────────────────
section "Configuración de la instalación"
echo ""

# Credenciales de administrador (solo instalación nueva)
if [ "$IS_UPDATE" = false ]; then
    echo ""
    echo -e "  ${BOLD}Crear cuenta de administrador:${NC}"
    while true; do
        read -rp "  → Nombre de usuario admin: " ADMIN_USERNAME
        [[ -n "$ADMIN_USERNAME" ]] && break
        warn "  El nombre de usuario no puede estar vacío."
    done
    while true; do
        read -rsp "  → Contraseña: " ADMIN_PASSWORD; echo
        read -rsp "  → Confirmar contraseña: " ADMIN_PASSWORD2; echo
        if [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD2" && -n "$ADMIN_PASSWORD" ]]; then
            break
        fi
        warn "  Las contraseñas no coinciden o están vacías. Inténtalo de nuevo."
    done
    ok "Credenciales configuradas."
fi

echo ""
read -rp "  Nombre del dominio o IP pública (Enter para autodetectar): " SERVER_DOMAIN
if [ -z "$SERVER_DOMAIN" ]; then
    SERVER_DOMAIN="_"
fi

echo ""
info "Resumen de instalación:"
echo "   Repositorio : $GITHUB_REPO"
echo "   Directorio  : $APP_DIR"
echo "   Usuario BD  : $DB_USER / DB: $DB_NAME"
echo "   Puerto API  : $API_PORT"
echo "   Admin user  : ${ADMIN_USERNAME:-«sin cambios»}"
echo ""
read -rp "  ¿Continuar? [s/N]: " CONFIRM
[[ "${CONFIRM,,}" =~ ^(s|si|yes|y)$ ]] || die "Instalación cancelada."

# ── Bootstrap: curl y git (necesarios antes de cualquier otra cosa) ──
section "Verificando dependencias mínimas"
export DEBIAN_FRONTEND=noninteractive
if ! command -v curl &>/dev/null || ! command -v git &>/dev/null; then
    info "curl o git no encontrados → instalando..."
    apt-get update -qq
    apt-get install -y -qq curl git
    ok "curl y git instalados."
else
    ok "curl $(curl --version | head -1 | cut -d' ' -f2) y git $(git --version | cut -d' ' -f3) disponibles."
fi

# ── Instalar paquetes del sistema ─────────────────────────────
section "Instalando paquetes del sistema"
apt-get update -qq
apt-get install -y -qq \
    curl git nginx postgresql postgresql-contrib \
    openssl build-essential ca-certificates gnupg
apt-mark manual nginx postgresql
ok "Paquetes del sistema instalados."

# ── Node.js 20.x ──────────────────────────────────────────────
NODE_MAJOR=0
command -v node &>/dev/null && NODE_MAJOR=$(node -v 2>/dev/null | sed 's/v\([0-9]*\).*/\1/' || echo 0)
if [[ "$NODE_MAJOR" -lt 20 ]]; then
    section "Instalando Node.js 20.x"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs
    chmod 755 /usr/bin/node /usr/bin/npm
    ok "Node.js $(node -v) instalado."
else
    ok "Node.js $(node -v) ya disponible (≥ v20)."
fi

# ── pnpm ──────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
    section "Instalando pnpm"
    npm install -g pnpm@latest >/dev/null 2>&1
    ok "pnpm $(pnpm -v) instalado."
else
    ok "pnpm $(pnpm -v) ya disponible."
fi

# ── PostgreSQL ────────────────────────────────────────────────
section "Configurando PostgreSQL"
systemctl enable postgresql --quiet
systemctl start postgresql

if [ "$IS_UPDATE" = false ]; then
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1; then
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" >/dev/null
        ok "Usuario de base de datos '$DB_USER' creado."
    else
        warn "Usuario '$DB_USER' ya existe, omitiendo creación."
    fi
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1; then
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >/dev/null
        ok "Base de datos '$DB_NAME' creada."
    else
        warn "Base de datos '$DB_NAME' ya existe, omitiendo creación."
    fi
fi
ok "PostgreSQL listo."

DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

# ── Usuario del sistema ───────────────────────────────────────
id "$APP_USER" &>/dev/null || useradd --system --create-home --shell /bin/bash "$APP_USER"
ok "Usuario del sistema '$APP_USER' listo."

# ── Código fuente ─────────────────────────────────────────────
section "Preparando código fuente"
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

if [ -d "$APP_DIR/.git" ]; then
    info "Repositorio existente → ejecutando git pull..."
    cd "$APP_DIR"
    git pull --quiet
    ok "Código actualizado."
else
    info "Clonando repositorio..."
    git clone --depth 1 "$GITHUB_REPO" "$APP_DIR"
    ok "Repositorio clonado en $APP_DIR."
fi

# ── Guardar configuración persistente ────────────────────────
section "Guardando configuración en $CONFIG_DIR"
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

cat > "$CONFIG_DIR/env" << ENVEOF
NODE_ENV=production
PORT=$API_PORT
DATABASE_URL=$DATABASE_URL
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
SECURE_COOKIES=false
ENVEOF

chmod 600 "$CONFIG_DIR/env"
chown root:root "$CONFIG_DIR/env"
ok "Configuración guardada (sólo root puede leerla)."

# ── Instalar dependencias npm ─────────────────────────────────
section "Instalando dependencias de Node.js"
cd "$APP_DIR"

# Intentar instalación reproducible primero, fallback a instalación normal
if ! pnpm install --frozen-lockfile 2>&1 | tail -3; then
    warn "Frozen lockfile falló, usando pnpm install normal..."
    pnpm install 2>&1 | tail -3
fi
ok "Dependencias instaladas."

# ── Compilar servidor API ─────────────────────────────────────
section "Compilando servidor API"
cd "$APP_DIR"
pnpm --filter @workspace/api-server run build 2>&1 | tail -3
ok "Servidor API compilado → artifacts/api-server/dist/"

# ── Compilar frontend web ─────────────────────────────────────
section "Compilando frontend web (React + Vite)"
cd "$APP_DIR"
PORT=3000 BASE_PATH=/ API_PORT=$API_PORT NODE_ENV=production \
    pnpm --filter @workspace/erasmus-web run build 2>&1 | tail -3
ok "Frontend compilado → artifacts/erasmus-web/dist/public/"

# ── Sincronizar esquema de base de datos ──────────────────────
section "Sincronizando esquema de base de datos"
cd "$APP_DIR"
DATABASE_URL="$DATABASE_URL" \
    pnpm --filter @workspace/db run push-force 2>&1 | tail -3
ok "Esquema de base de datos sincronizado."

# ── Directorio de subidas ─────────────────────────────────────
mkdir -p "$APP_DIR/uploads"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "Directorio de subidas listo en $APP_DIR/uploads/"

# ── Servicio systemd ──────────────────────────────────────────
section "Configurando servicio systemd"

cat > "/etc/systemd/system/$APP_NAME.service" << SVCEOF
[Unit]
Description=Plataforma Erasmus+ SEA — IES Manuel Martín González
Documentation=https://erasmusplus.eu
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$APP_USER
# WorkingDirectory = raíz del monorepo (para que /uploads esté en el lugar correcto)
WorkingDirectory=$APP_DIR
EnvironmentFile=$CONFIG_DIR/env
ExecStart=/usr/bin/node --enable-source-maps $APP_DIR/artifacts/api-server/dist/index.mjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$APP_NAME
# Límites de seguridad
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable "$APP_NAME" --quiet
systemctl restart "$APP_NAME"

# Esperar a que arranque
sleep 3
if systemctl is-active --quiet "$APP_NAME"; then
    ok "Servicio '$APP_NAME' en marcha."
else
    echo ""
    die "El servicio no arrancó. Comprueba los logs:  journalctl -u $APP_NAME -n 50"
fi

# ── Nginx ─────────────────────────────────────────────────────
section "Configurando Nginx"
FRONTEND_DIR="$APP_DIR/artifacts/erasmus-web/dist/public"

cat > "/etc/nginx/sites-available/$APP_NAME" << NGINXEOF
server {
    listen 80;
    server_name $SERVER_DOMAIN;
    client_max_body_size 50M;

    # ── Frontend: archivos estáticos del build de Vite ──────
    root $FRONTEND_DIR;
    index index.html;

    # ── API → servidor Express ───────────────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # ── Archivos subidos → servidor Express ──────────────────
    location /uploads/ {
        proxy_pass         http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
    }

    # ── Páginas de movilidad → servidor Express ───────────────
    # Express devuelve HTML con OG tags a crawlers de redes sociales
    # y sirve index.html al resto de navegadores (comportamiento SPA normal).
    location ~ ^/movilidades/\d+$ {
        proxy_pass         http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 30s;
    }

    # ── SPA: cualquier ruta desconocida devuelve index.html ──
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINXEOF

ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
rm -f /etc/nginx/sites-enabled/default

if nginx -t >/dev/null 2>&1; then
    systemctl restart nginx
    ok "Nginx configurado y reiniciado."
else
    warn "La configuración de Nginx tiene errores — comprueba: nginx -t"
fi

# ── Cloudflare Tunnel (opcional) ──────────────────────────────
echo ""
echo -e "  ${CYAN}Cloudflare Tunnel permite acceso HTTPS externo sin abrir puertos en el router.${NC}"
echo -e "  ${CYAN}Si lo configuras aquí, el panel de administración funcionará correctamente.${NC}"
echo ""
read -rp "  Token de Cloudflare Tunnel (Enter para omitir): " CF_TOKEN

if [ -n "$CF_TOKEN" ]; then
    section "Instalando Cloudflare Tunnel"
    ARCH=$(dpkg --print-architecture)
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb"
    curl -fsSL -o /tmp/cloudflared.deb "$CF_URL" || \
        curl -fsSL -o /tmp/cloudflared.deb \
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb"
    dpkg -i /tmp/cloudflared.deb >/dev/null 2>&1
    rm -f /tmp/cloudflared.deb
    cloudflared service install "$CF_TOKEN"
    systemctl enable cloudflared --quiet
    systemctl start cloudflared
    # Habilitar cookies seguras (el túnel Cloudflare proporciona HTTPS)
    sed -i 's/^SECURE_COOKIES=false$/SECURE_COOKIES=true/' "$CONFIG_DIR/env"
    systemctl restart "$APP_NAME"
    ok "Cloudflare Tunnel instalado. Cookies seguras activadas (HTTPS)."
fi

# ── Script de actualización rápida ────────────────────────────
cat > "$APP_DIR/update.sh" << 'UPDATEEOF'
#!/bin/bash
# Actualización rápida de la plataforma Erasmus+ SEA
set -e
cd "$(dirname "$0")"

# Cargar variables de entorno
ENV_FILE="/etc/sea-erasmus/env"
if [ -f "$ENV_FILE" ]; then
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^[[:space:]]*#.*$ || -z "$key" ]] && continue
        export "$key=$value" 2>/dev/null || true
    done < "$ENV_FILE"
fi

echo "[1/6] Actualizando código..."
git pull --quiet
echo "[2/6] Instalando dependencias..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo "[3/6] Compilando API..."
pnpm --filter @workspace/api-server run build
echo "[4/6] Compilando frontend..."
PORT=3000 BASE_PATH=/ API_PORT=${PORT:-8080} NODE_ENV=production pnpm --filter @workspace/erasmus-web run build
echo "[5/6] Sincronizando esquema de base de datos..."
pnpm --filter @workspace/db run push-force
echo "[6/6] Reiniciando servicio..."
systemctl restart sea-erasmus
echo "✓ Actualización completada."
UPDATEEOF
chmod +x "$APP_DIR/update.sh"

# ── Resumen final ─────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
hr
echo -e "  ${GREEN}${BOLD}INSTALACIÓN COMPLETADA ✓${NC}"
hr
echo ""
if [ -n "$CF_TOKEN" ]; then
    echo -e "  ${BOLD}URL de acceso:${NC}    (dominio configurado en Cloudflare)"
else
    echo -e "  ${BOLD}URL de acceso:${NC}    http://$SERVER_IP"
fi
echo -e "  ${BOLD}Panel de admin:${NC}   /admin/login"
echo -e "  ${BOLD}Usuario admin:${NC}    $ADMIN_USERNAME"
echo ""
echo -e "  ${BOLD}Comandos útiles:${NC}"
echo "    Estado del servicio:   systemctl status $APP_NAME"
echo "    Ver logs en tiempo real: journalctl -u $APP_NAME -f"
echo "    Reiniciar servicio:    systemctl restart $APP_NAME"
echo "    Actualizar plataforma: sudo bash $APP_DIR/update.sh"
echo ""
echo -e "  ${BOLD}Archivos clave:${NC}"
echo "    Configuración:  $CONFIG_DIR/env"
echo "    Aplicación:     $APP_DIR"
echo "    Subidas:        $APP_DIR/uploads/"
echo "    Logs nginx:     /var/log/nginx/"
echo ""
echo -e "  ${YELLOW}IMPORTANTE: Guarda la contraseña del administrador en un lugar seguro.${NC}"
echo -e "  ${YELLOW}La configuración con credenciales está en: $CONFIG_DIR/env${NC}"
hr
echo ""
