
# 🐘 Guía Completa de Configuración e Integración con Neon PostgreSQL — PrediYogur (ULEAM)

Este documento describe paso a paso cómo aprovisionar, configurar, verificar y operar la base de datos central de **PrediYogur** en **Neon Serverless PostgreSQL**, manteniendo intacta la arquitectura híbrida **Offline-First (SQLite + Neon)**.

---

## 1.Cómo Crear o Preparar la Base de Datos en Neon

1. Ingrese a su consola de [Neon (https://console.neon.tech)](https://console.neon.tech).
2. Seleccione su proyecto o cree uno nuevo con motor **PostgreSQL 15 / 16 / 17** en la región correspondiente (`us-east-2` / AWS Ohio).
3. Verifique que exista la base de datos `neondb` y el rol propietario `neondb_owner`.
4. **Importante (Seguridad de Credenciales):** Si alguna contraseña anterior fue expuesta, diríjase a **Settings → Roles & Databases** (o **Reset Password**) y rote la contraseña de `neondb_owner` antes de usarla.

---

## 2. Cómo Obtener la Cadena de Conexión (Pooler + SSL)

1. En el **Dashboard** de Neon, haga clic en el botón **Connect** (o en el panel **Connection Details**).
2. Active la casilla **Connection pooling** (el host terminará en `-pooler`, por ejemplo: `ep-small-salad-bdlzp55d-pooler.c-8.us-east-2.aws.neon.tech`).
3. Copie la cadena de conexión URI con `sslmode=require`:
   ```text
   postgresql://neondb_owner:TU_NUEVA_CONTRASENA@ep-small-salad-bdlzp55d-pooler.c-8.us-east-2.aws.neon.tech:5432/neondb?sslmode=require
   ```

---

## 3. Cómo Configurar `backend/.env`

1. En la carpeta `backend/`, cree el archivo `.env` a partir de la plantilla `backend/.env.example`:
   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```
2. Edite `backend/.env` y coloque su cadena `DATABASE_URL` real con la contraseña rotada:
   ```env
   PORT=5000
   NODE_ENV=development

   DATABASE_URL=postgresql://neondb_owner:TU_NUEVA_CONTRASENA@ep-small-salad-bdlzp55d-pooler.c-8.us-east-2.aws.neon.tech:5432/neondb?sslmode=require
   DB_SSL=true
   DB_POOL_MAX=10
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=10000

   JWT_SECRET=prediyogur_super_secret_key_2026
   JWT_EXPIRES_IN=7d
   ```
3. **Regla de Seguridad:** `backend/.env` está protegido en `.gitignore` y **jamás** debe subirse a GitHub ni incluirse en commits.

---

## 4. Cómo Instalar las Dependencias

Desde la raíz del proyecto o dentro de `backend/`, ejecute:

```powershell
cd backend
npm install
```

---

## 5. Cómo Ejecutar el Esquema SQL (`neon_schema.sql`)

Puede ejecutar los scripts SQL directamente desde el **Neon SQL Editor** en el navegador o desde su terminal local.

### Opción A: Desde Neon SQL Editor (Navegador Web)
1. Abra el **SQL Editor** en la consola de Neon seleccionando la base de datos `neondb`.
2. Copie el contenido íntegro de `database/neon_schema.sql`, péguelo en el editor y pulse **Run**.

### Opción B: Desde la Terminal Local (Automatizado con Node.js)
Una vez configurado `backend/.env`, ejecute desde la raíz del monorepo:
```powershell
npm run db:init
```
*(Este comando ejecuta en orden exacto `neon_schema.sql` → `neon_seeds.sql` → `neon_views.sql`).*

---

## 6. Cómo Insertar los Datos Científicos Iniciales (`neon_seeds.sql`)

Si utiliza el **Neon SQL Editor**:
1. Abra una nueva pestaña en el **SQL Editor** de Neon.
2. Copie y ejecute el contenido completo de `database/neon_seeds.sql`.
3. Este script es **100% idempotente** (`ON CONFLICT ... DO UPDATE / DO NOTHING`): carga los catálogos de sustratos y azúcares, los 3 usuarios institucionales con contraseñas cifradas (`bcrypt`) y los **6 lotes experimentales de referencia del Dr. Stalin Santacruz** (`LOTE-CHV-40-2.5` a `LOTE-CHV-44-7.5`) junto con sus **37 lecturas experimentales reales** sin duplicar registros si se vuelve a ejecutar.

---

## 7. Cómo Ejecutar las Vistas Analíticas (`neon_views.sql`)

Si utiliza el **Neon SQL Editor**:
1. Copie y ejecute el contenido de `database/neon_views.sql` después de haber ejecutado `neon_schema.sql` y `neon_seeds.sql`.
2. Creará las 6 vistas analíticas:
   - `vw_resumen_ensayos_usuario`
   - `vw_cinetica_fermentacion_auditoria`
   - `vw_lotes_referencia_santacruz`
   - `vw_historial_predicciones_hill`
   - `vw_dataset_feedback_validado`
   - `vw_auditoria_operaciones_recientes`

---

## 8. Cómo Probar la Conexión a Neon

Ejecute el script de verificación incluido en el backend:

```powershell
node backend/src/scripts/testNeonConnection.js
```

O mediante el script de NPM en `backend/`:

```powershell
npm --prefix backend run db:test-neon
```

El script ejecuta la consulta diagnóstica oficial:
```sql
SELECT
    NOW() AS fecha_servidor,
    current_database() AS base_datos,
    current_user AS usuario_actual,
    version() AS version_postgresql;
```

---

## 9. Cómo Verificar las Tablas y los 6 Lotes Científicos en Neon

En el **Neon SQL Editor**, ejecute las siguientes consultas de verificación:

```sql
-- 1. Listar las 9 tablas del esquema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar los 6 lotes de referencia del Dr. Stalin Santacruz y sus lecturas reales
SELECT * FROM vw_lotes_referencia_santacruz;
```

---

## 10. Solución de Errores Comunes

| Error / Síntoma | Causa Probable | Solución |
| :--- | :--- | :--- |
| `password authentication failed for user "neondb_owner"` (`28P01`) | La contraseña en `backend/.env` es incorrecta o fue rotada en la consola de Neon. | Copie la nueva cadena desde Neon Console y actualice `DATABASE_URL` en `backend/.env`. |
| `SSL/TLS required` | La conexión se intentó sin SSL. | Asegúrese de que `DATABASE_URL` termine en `?sslmode=require` y que `DB_SSL=true` esté en `backend/.env`. |
| `ETIMEDOUT` o `ENOTFOUND` | Sin acceso a internet o firewall bloqueando el puerto `5432`. | Verifique su conexión de red. Mientras tanto, el backend continuará operando de forma transparente sobre SQLite local y registrará el motivo en `sincronizacion_historial`. |
| `relation "ensayos" does not exist` (`42P01`) | Se conectó a `neondb` pero aún no se ha corrido `neon_schema.sql`. | Ejecute `database/neon_schema.sql` en el Neon SQL Editor o corra `npm run db:init`. |
