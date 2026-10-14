# Guía de Puesta en Marcha y Despliegue — PrediYogur

Esta guía describe cómo levantar y ejecutar la plataforma **PrediYogur** tanto para desarrollo local como para demostraciones académicas.

---

## ⚡ Opción 1: Despliegue Rápido con Docker (Recomendada)

Si tienes Docker y Docker Compose instalados:

```bash
# 1. Levantar PostgreSQL y Backend API automáticamente
docker-compose up -d

# 2. Verificar estado de los contenedores
docker-compose ps
```

* **PostgreSQL** iniciará en el puerto `5432` y ejecutará de forma automática `database/schema.sql` y `database/seeds.sql`.
* **Backend API** iniciará en `http://localhost:5000`. Puedes comprobarlo entrando en tu navegador a:
  `http://localhost:5000/health` (debe responder `{"status":"ok","db":"connected"}`).

Para apagar los servicios:
```bash
docker-compose down
```

---

## 🛠️ Opción 2: Ejecución Manual en Entorno Local

### 1. Base de Datos (PostgreSQL)
1. Crea la base de datos en tu servidor local de PostgreSQL:
   ```sql
   CREATE DATABASE prediyogur_db;
   ```
2. Ejecuta el script automatizado de aprovisionamiento desde la raíz del proyecto:
   ```bash
   npm run db:init
   ```
   *(Este script conectará a PostgreSQL y cargará automáticamente las tablas y los 6 lotes experimentales reales del Dr. Stalin Santacruz).*

---

### 2. Backend (Node.js + Express)
1. Instala dependencias y configura variables de entorno:
   ```bash
   cd backend
   npm install
   # Copia el archivo de ejemplo si no tienes .env:
   cp .env.example .env
   ```
2. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor quedará escuchando en `http://localhost:5000`*.

---

### 3. Aplicación Móvil (React Native)
1. Instala dependencias:
   ```bash
   cd mobile
   npm install
   ```
2. Inicia el servidor de empaquetado (Metro Bundler):
   ```bash
   npm start
   ```
3. Ejecuta en tu dispositivo o emulador:
   * **Android:** Presiona `a` en la terminal de Metro o ejecuta `npm run android`.
   * **iOS (en macOS):** Presiona `i` o ejecuta `npm run ios`.

---

## 🧪 Verificación de Salud del Sistema

| Servicio | URL / Comando | Respuesta Esperada |
| :--- | :--- | :--- |
| **Backend Health** | `GET http://localhost:5000/health` | `{"status":"ok","db":"connected"}` |
| **API Ensayos** | `GET http://localhost:5000/api/ensayos` | Listado JSON con los 6 lotes precargados |
| **App Móvil** | Pantalla Dashboard | Muestra lote activo, métricas de pH y temperatura |
| **Simulador What-If** | Pantalla Simulador | Proyección en tiempo real de corte y viscosidad |
