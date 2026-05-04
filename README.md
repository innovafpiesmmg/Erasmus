# Plataforma Erasmus+ SEA

**"The small big changes"** — Proyecto Erasmus+ KA229 coordinado por el IES Manuel Martín González (Guía de Isora, Tenerife, España).

Duración: 01/09/2025 – 31/08/2027 · Acrónimo: **SEA**

---

## Países socios

| País | Centro |
|------|--------|
| 🇪🇸 España *(coordinador)* | IES Manuel Martín González |
| 🇹🇷 Turquía | Karatay Mehmet-Hanife Yapici Anadolu Lisesi |
| 🇱🇻 Letonia | Rēzeknes Valsts ģimnāzija |
| 🇷🇴 Rumanía | Liceul Teoretic "Emil Racoviță" |
| 🇵🇹 Portugal | Escola Secundária de Loulé |
| 🇲🇰 Macedonia | SOU "Kocho Racin" |

---

## Características

### Sitio público
- **Portada** con imagen hero, sección de socios, línea de tiempo de movilidades, galería y actividades
- **Página de socios** (`/socios`) con tarjetas por país, modal de detalle, enlaces a web y redes sociales
- **Detalle de movilidad** (`/movilidades/:id`) con ficha del centro de acogida, actividades y galería de fotos con lightbox
- **Detalle de actividad** (`/actividades/:id`)
- **Galería** (`/galeria`) organizada por año académico
- Mapa Leaflet con los 6 países socios

### Panel de administración (`/admin`)
- Gestión de socios, movilidades, actividades y medios
- Subida de imágenes y documentos
- Configuración del sitio (título, subtítulo, textos)
- Autenticación segura con sesión por cookie

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS + Framer Motion |
| Backend | Express 5 (Node.js 20) |
| Base de datos | PostgreSQL + Drizzle ORM |
| Monorepo | pnpm workspaces |
| Proxy inverso | Nginx |
| Proceso | systemd |

---

## Instalación en servidor Ubuntu

### Requisitos
- Ubuntu 22.04 o 24.04 LTS
- Acceso root
- Conexión a Internet

### Instalación automática

```bash
curl -fsSL https://raw.githubusercontent.com/innovafpiesmmg/Erasmus/main/install.sh | sudo bash
```

O clonando primero el repositorio:

```bash
git clone https://github.com/innovafpiesmmg/Erasmus
cd Erasmus
sudo bash install.sh
```

El instalador realizará automáticamente:

1. Instalación de Node.js 20, pnpm, PostgreSQL, Nginx y Git
2. Creación de la base de datos PostgreSQL con contraseña aleatoria
3. **Solicitud interactiva** del nombre de usuario y contraseña del administrador
4. Compilación del servidor API y del frontend web
5. Sincronización del esquema de base de datos
6. Configuración del servicio systemd
7. Configuración de Nginx (archivos estáticos + proxy API)
8. Instalación opcional de **Cloudflare Tunnel** (para acceso HTTPS externo sin abrir puertos)

### Variables de entorno

La configuración se guarda en `/etc/sea-erasmus/env` (solo accesible por root):

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://sea_erasmus:PASSWORD@localhost:5432/sea_erasmus
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_contraseña
SECURE_COOKIES=false          # true si usas Cloudflare Tunnel o HTTPS
```

> **Nota:** `SECURE_COOKIES=false` es necesario para despliegues sin HTTPS.
> El instalador lo activa automáticamente a `true` si configuras Cloudflare Tunnel.

### Comandos útiles tras la instalación

```bash
# Estado del servicio
systemctl status sea-erasmus

# Ver logs en tiempo real
journalctl -u sea-erasmus -f

# Reiniciar
systemctl restart sea-erasmus

# Actualizar a la última versión
sudo bash /var/www/sea-erasmus/update.sh
```

---

## Arquitectura de producción

```
Internet
    │
    ▼
 Nginx :80
    ├── /          → archivos estáticos (Vite build)
    ├── /api/*     → proxy → Express :8080
    └── /uploads/* → proxy → Express :8080
                              │
                              ▼
                      PostgreSQL :5432
```

---

## Desarrollo local

### Requisitos previos
- Node.js 20+
- pnpm 9+
- PostgreSQL en ejecución

### Configuración

```bash
# Clonar el repositorio
git clone https://github.com/innovafpiesmmg/Erasmus
cd Erasmus

# Instalar dependencias
pnpm install

# Variables de entorno (crear en el panel de Replit o como .env local)
# DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD

# Sincronizar esquema de base de datos
pnpm --filter @workspace/db run push

# Arrancar el servidor API (puerto 8080)
pnpm --filter @workspace/api-server run dev

# Arrancar el frontend (en otra terminal)
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/erasmus-web run dev
```

### Estructura del monorepo

```
Erasmus/
├── artifacts/
│   ├── api-server/          # Servidor Express (API REST)
│   │   └── src/
│   │       ├── routes/      # Endpoints: partners, mobilities, activities, media, auth
│   │       └── lib/         # Logger, seed, uploads
│   └── erasmus-web/         # Frontend React + Vite
│       ├── public/          # Imágenes estáticas, favicon
│       └── src/
│           ├── pages/       # Landing, socios, movilidades, galería, admin…
│           └── components/  # PublicHeader, AdminLayout, etc.
├── lib/
│   ├── db/                  # Esquema Drizzle + conexión PostgreSQL
│   ├── api-spec/            # OpenAPI spec + generación de cliente (Orval)
│   └── api-client-react/    # Hooks React Query generados
├── install.sh               # Autoinstalador Ubuntu
└── update.sh                # Script de actualización rápida
```

### Regenerar el cliente API tras cambios en la spec

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Licencia

Proyecto educativo desarrollado para el programa **Erasmus+ KA229**.
IES Manuel Martín González · Guía de Isora, Tenerife · España.
