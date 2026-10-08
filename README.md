# Global League ⚽

Aplicación web full-stack para la gestión de ligas deportivas (equipos, jugadores, árbitros, torneos y calendarios de partidos).

## 📋 Tecnologías

- **Frontend:** React 19 + Vite + TailwindCSS + React Router
- **Backend:** Node.js + Express
- **Base de datos:** MySQL

## 🚀 Requisitos previos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [MySQL](https://www.mysql.com/) (servidor local o remoto)
- [Git](https://git-scm.com/)

## 📥 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/42325443/Global-League.git
cd Global-League
```

### 2. Instalar dependencias

Dependencias del **frontend** (en la raíz del proyecto):

```bash
npm install
```

Dependencias del **backend**:

```bash
cd backend
npm install
```

### 3. Configurar la base de datos

Crea una base de datos vacía en MySQL y importa los scripts:

```bash
# Crear la base de datos
mysql -u root -p -e "CREATE DATABASE global_league;"

# Importar la estructura de tablas
mysql -u root -p global_league < database/schema.sql

# Importar los datos de prueba
mysql -u root -p global_league < database/seed.sql
```

Scripts de migración adicionales disponibles en `database/`:

| Archivo | Descripción |
|---------|-------------|
| `schema.sql` | Estructura completa de tablas |
| `seed.sql` | Datos iniciales de prueba |
| `migracion_modelo_integral.sql` | Migración del modelo integral |
| `migracion_fixture_partidos.sql` | Migración de fixture y partidos |
| `migracion_capitan_y_baja_equipos.sql` | Migración de capitán y bajas de equipos |

### 4. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/` con tus credenciales de MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=global_league
PORT=5000
```

## ▶️ Ejecutar el proyecto

Necesitarás **dos terminales** (el backend y el frontend corren en puertos distintos):

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

El backend arranca en `http://localhost:5000` (o el puerto que hayas configurado).

### Terminal 2 — Frontend

```bash
npm run dev
```

El frontend arranca en `http://localhost:5173` (puerto por defecto de Vite).

## 📝 Comandos disponibles

| Comando | Propósito |
|---------|-----------|
| `npm run dev` | Iniciar frontend en modo desarrollo |
| `npm run build` | Compilar frontend para producción |
| `npm run preview` | Previsualizar build de producción |
| `cd backend && npm run dev` | Iniciar backend con recarga automática (nodemon) |
| `cd backend && npm start` | Iniciar backend en producción |
| `npm run lint` | Ejecutar ESLint |

## 🏗️ Estructura del proyecto

```
Global-League/
├── backend/                 # Servidor API (Express + MySQL)
│   ├── src/
│   │   ├── controllers/     # Lógica de las rutas
│   │   ├── middleware/      # requireAuth.js (autenticación)
│   │   ├── routes/          # Definición de rutas
│   │   ├── services/        # Lógica de negocio (fixtureService.js)
│   │   └── config/          # Configuración de base de datos
├── database/                # Scripts SQL
├── public/                  # Assets estáticos
└── src/                     # Aplicación React
    ├── components/          # Componentes UI reutilizables
    ├── context/             # AuthContext (gestión de autenticación)
    ├── lib/                 # api.js (cliente HTTP al backend)
    └── views/               # Páginas de la aplicación
```

## 📦 Variables de entorno

El backend utiliza las siguientes variables de entorno (archivo `.env` en `backend/`):

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_HOST` | Host del servidor MySQL | `localhost` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | (vacío) |
| `DB_NAME` | Nombre de la base de datos | `global_league` |
| `PORT` | Puerto del servidor | `5000` |

## 🛠️ Desarrollo

- El frontend se comunica con el backend a través de `src/lib/api.js` (revisa la URL base configurada).
- Para producción, primero construye el frontend (`npm run build`) y luego ejecuta el backend con `npm start`.

## 📄 Licencia

ISC
