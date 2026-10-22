# Contrato Formal de la API REST — PrediYogur

**Proyecto:** PrediYogur — Monitoreo, Predicción y Simulación Cinética de pH en Fermentación de Yogur  
**Institución:** Universidad Laica Eloy Alfaro de Manabí (ULEAM)  
**Patrocinador Científico:** Dr. Stalin Gustavo Santacruz Terán  
**Líder de Desarrollo:** Carlos Delgado  
**Versión de API:** `1.1.0`  
**Motor de Persistencia Principal:** SQLite Local Autónomo (`backend/data/prediyogur_local.sqlite`) con fallback standby a PostgreSQL.

---

## 1. Estructura Estándar de Respuesta JSON

Todas las respuestas en formato JSON de la API siguen el patrón unificado:

```json
{
  "success": true,
  "data": {},
  "message": "Descripción clara del resultado de la operación.",
  "error": null
}
```

En caso de fallo (`4xx` o `5xx`):

```json
{
  "success": false,
  "data": null,
  "message": "Mensaje explicativo del error.",
  "error": "CÓDIGO_O_DETALLE_ERROR",
  "errores": ["Array opcional con validaciones específicas"]
}
```

---

## 2. Endpoints de Verificación de Salud

### `GET /api/health`
Verifica el estado operativo del backend, la conectividad con SQLite autónomo y PostgreSQL opcional, y el estado del motor cinético.

- **Autenticación:** No requerida.
- **Respuesta 200 OK:**
  ```json
  {
    "status": "ok",
    "service": "PrediYogur Platform",
    "mode": "local_prototype_autonomous",
    "databases": {
      "sqlite_local": "connected",
      "postgresql": "optional_standby (modo prototipo local activo)"
    },
    "ai_engine": "calibrado_r2_0.9774",
    "timestamp": "2026-10-22T00:00:00.000Z"
  }
  ```

---

## 3. Módulo de Autenticación (`/api/v1/auth` y `/api/auth`)

Soporta emisión y verificación de JSON Web Tokens (JWT) con hashing bcrypt (10 rondas).

### `POST /api/v1/auth/register`
Registra un nuevo usuario en la base de datos (investigador, docente o estudiante).

- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "nombre": "Carlos Delgado",
    "email": "carlos.delgado@uleam.edu.ec",
    "password": "mi_password_segura",
    "rol": "investigador"
  }
  ```
  * `nombre` *(string, requerido)*: Mínimo 2 caracteres.
  * `email` *(string, requerido)*: Formato de correo válido.
  * `password` *(string, requerido)*: Mínimo 6 caracteres.
  * `rol` *(string, opcional)*: `'estudiante'` (default), `'docente'`, o `'investigador'`.
- **Respuestas:**
  - `201 Created`: Usuario creado exitosamente con token JWT emitido.
  - `400 Bad Request`: Datos incompletos o fuera de formato.
  - `409 Conflict`: Correo electrónico ya registrado previamente.

### `POST /api/v1/auth/login`
Autentica a un usuario registrado y devuelve un JWT firmado con expiración de 7 días.

- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "carlos.delgado@uleam.edu.ec",
    "password": "carlos2026"
  }
  ```
- **Respuestas:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 2,
          "nombre": "Carlos Delgado",
          "email": "carlos.delgado@uleam.edu.ec",
          "rol": "investigador",
          "created_at": "2026-10-22T00:00:00.000Z"
        }
      },
      "message": "¡Bienvenido(a) a PrediYogur, Carlos Delgado!",
      "error": null
    }
    ```
  - `400 Bad Request`: Parámetros `email` o `password` ausentes.
  - `401 Unauthorized`: Credenciales inválidas (usuario inexistente o contraseña incorrecta).

### `GET /api/v1/auth/perfil`
Obtiene los datos del perfil del usuario actualmente autenticado.

- **Headers:** `Authorization: Bearer <token_jwt>`
- **Respuestas:**
  - `200 OK`: Perfil del usuario validado.
  - `401 Unauthorized`: Token no proporcionado o mal formado.
  - `403 Forbidden`: Token expirado o firma inválida.

### `GET /api/v1/auth/usuarios`
Retorna el listado público de investigadores y auxiliares de laboratorio disponibles para asignación de ensayos.

- **Autenticación:** No requerida.
- **Respuesta 200 OK:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "nombre": "Dr. Stalin Santacruz Terán",
        "email": "dr.santacruz@uleam.edu.ec",
        "rol": "investigador",
        "creado_en": "2026-10-22T00:00:00.000Z"
      }
    ],
    "message": "Listado de usuarios recuperado con éxito.",
    "error": null
  }
  ```

---

## 4. Gestión de Ensayos Experimentales (`/api/ai/trials`)

Permite gestionar el ciclo de vida completo de un lote experimental de fermentación en SQLite autónomo.

### `GET /api/ai/trials`
Lista todos los ensayos registrados en el sistema, con capacidad de filtrado por usuario investigador.

- **Headers:** Opcional `Authorization: Bearer <token_jwt>`
- **Query Params:**
  - `usuario_email` *(string, opcional)*: Filtra por el correo del responsable.
  - `mis_ensayos` *(boolean, opcional)*: Si es `true` y el usuario está autenticado, filtra los ensayos del usuario en sesión.
- **Respuesta 200 OK:**
  ```json
  {
    "success": true,
    "data": {
      "total": 1,
      "filtro_usuario": "todos",
      "trials": [
        {
          "id": 1,
          "lote_id": "LOTE-EXP-2026",
          "investigador": "Carlos Delgado",
          "usuario_email": "carlos.delgado@uleam.edu.ec",
          "tipo_sustrato": "vaca",
          "tipo_azucar": "sacarosa",
          "temperatura_c": 42.0,
          "masa_inoculo_g": 18.75,
          "volumen_ml": 250,
          "porcentaje_inoculo": 7.5,
          "tiempo_corte_inicial_horas": 4.25,
          "tiempo_corte_inicial_minutos": 255,
          "tiempo_corte_estimado_horas": 4.25,
          "tiempo_corte_estimado_minutos": 255,
          "diferencia_minutos": 0,
          "estado": "EN_CURSO",
          "lecturas": [
            {
              "tiempo_minutos": 0,
              "ph": 6.5,
              "temperatura": 42.0,
              "indice_refraccion": null,
              "registrado_en": "2026-10-22T00:00:00.000Z"
            }
          ],
          "total_lecturas": 1,
          "diagnostico": "Crecimiento exponencial óptimo",
          "creado_en": "2026-10-22T00:00:00.000Z",
          "actualizado_en": "2026-10-22T00:00:00.000Z"
        }
      ]
    },
    "message": "Listado de ensayos de laboratorio recuperado de SQLite.",
    "error": null
  }
  ```

### `POST /api/ai/trials`
Crea e inicializa un nuevo ensayo de laboratorio con condiciones fisicoquímicas iniciales.

- **Headers:** `Content-Type: application/json`, Opcional `Authorization: Bearer <token_jwt>`
- **Body:**
  ```json
  {
    "lote_id": "LOTE-B2-CHOCHO",
    "investigador": "Carlos Delgado",
    "temperatura_c": 42.0,
    "masa_inoculo_g": 18.75,
    "volumen_ml": 250,
    "tipo_sustrato": "vaca",
    "tipo_azucar": "sacarosa"
  }
  ```
- **Respuestas:**
  - `201 Created`: Ensayo inicializado en SQLite con lectura base en T0.
  - `400 Bad Request`: Parámetros fuera de rangos biológicos permitidos.

### `GET /api/ai/trials/:loteId`
Obtiene los detalles de un ensayo específico, su historial de lecturas y la proyección recalibrada en tiempo real.

- **Parámetros Path:** `loteId` (Código identificador del ensayo).
- **Respuestas:**
  - `200 OK`: Ensayo recuperado junto a proyecciones cinéticas dinámicas.
  - `404 Not Found`: Ensayo no encontrado.

### `POST /api/ai/trials/:loteId/readings`
Registra una lectura fisicoquímica periódica observada (pH, temperatura, °Brix) en un ensayo existente y recalibra la proyección dinámica restante.

- **Parámetros Path:** `loteId`
- **Body:**
  ```json
  {
    "tiempo_minutos": 60,
    "ph": 5.95,
    "temperatura": 42.1,
    "indice_refraccion": 9.8
  }
  ```
- **Respuestas:**
  - `200 OK`: Lectura guardada y tiempo de corte recalibrado dinámicamente.
  - `400 Bad Request`: pH (< 3.8 o > 7.2) o tiempo (< 0 min) fuera de límites fisicoquímicos.
  - `404 Not Found`: Ensayo no registrado.

### `DELETE /api/ai/trials/:loteId/readings/:min`
Elimina una lectura errónea específica y recalibra la curva con las lecturas restantes (no permite eliminar la lectura base T0).

- **Parámetros Path:** `loteId`, `min` (minuto de la lectura).
- **Respuestas:** `200 OK`, `400 Bad Request` (si min=0), `404 Not Found`.

### `DELETE /api/ai/trials/:loteId`
Elimina un ensayo experimental de SQLite.

- **Parámetros Path:** `loteId`
- **Respuestas:** `200 OK` o `404 Not Found`.

---

## 5. Exportación de Datos de Ensayos (`/api/ai/trials/:loteId/export`)

Permite a investigadores como el Dr. Stalin Santacruz exportar las lecturas cinéticas de cualquier ensayo para su análisis en herramientas analíticas como **OriginLab**, **R**, **Python** o **Microsoft Excel**.

### `GET /api/ai/trials/:loteId/export`

- **Parámetros Path:**
  - `loteId` *(string, requerido)*: Identificador del ensayo (ej. `LOTE-EXP-2026`).
- **Query Params:**
  - `formato` *(string, opcional)*: Formato de salida. Valores soportados:
    - `'csv'` *(predeterminado)*: Archivo plano CSV con encabezados estándar.
    - `'json'`: Objeto JSON con la información íntegra del ensayo y sus lecturas.

#### Comportamiento `formato=csv` (o por defecto):
- **Headers de Respuesta:**
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename="${loteId}_cinetica.csv"`
- **Estructura del Contenido CSV:**
  ```csv
  tiempo_minutos,ph,temperatura,indice_refraccion,fecha_registro
  0,6.5,42,,2026-10-22T00:00:00.000Z
  60,5.8,42,9.5,2026-10-22T01:00:00.000Z
  ```
- **Código HTTP:** `200 OK`

#### Comportamiento `formato=json`:
- **Headers de Respuesta:**
  - `Content-Type: application/json`
- **Estructura del JSON:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "lote_id": "LOTE-EXP-2026",
      "investigador": "Carlos Delgado",
      "usuario_email": "carlos.delgado@uleam.edu.ec",
      "tipo_sustrato": "vaca",
      "tipo_azucar": "sacarosa",
      "temperatura_c": 42.0,
      "masa_inoculo_g": 18.75,
      "volumen_ml": 250,
      "porcentaje_inoculo": 7.5,
      "tiempo_corte_estimado_horas": 4.25,
      "tiempo_corte_estimado_minutos": 255,
      "estado": "EN_CURSO",
      "lecturas": [
        {
          "tiempo_minutos": 0,
          "ph": 6.5,
          "temperatura": 42.0,
          "indice_refraccion": null,
          "registrado_en": "2026-10-22T00:00:00.000Z"
        }
      ]
    }
  }
  ```
- **Código HTTP:** `200 OK`

#### Errores posibles:
- `404 Not Found`: Si el lote especificado no existe en la persistencia SQLite.
  ```json
  {
    "success": false,
    "data": null,
    "message": "El ensayo con lote 'LOTE-NO-EXISTE' no existe.",
    "error": "TRIAL_NOT_FOUND"
  }
  ```
- `400 Bad Request`: Si se solicita un formato no soportado (distinto a `csv` o `json`).

---

## 6. Endpoints de Inteligencia Artificial y Simulación Cinética

| Método | Ruta | Descripción | Respuesta |
|---|---|---|---|
| `GET` | `/api/ai/metrics` | Métricas científicas de validación del modelo predictivo ($R^2$, RMSE, MAE). | `200 OK` con $R^2 > 0.95$. |
| `GET` | `/api/ai/dataset` | Dataset base experimental del Dr. Santacruz y estadísticas de feedback continuo. | `200 OK` con matriz de lotes. |
| `POST` | `/api/ai/simulate` | Simulación cinética integral "What-If" con cálculo de corte y viscosidad final. | `200 OK` con array de trayectoria temporal. |
| `POST` | `/api/ai/predict` | Predice un punto cinético individual en un tiempo $t$ (minutos). | `200 OK` con pH predicho y corte. |
| `POST` | `/api/ai/recalibrate` | Recalibra proyecciones dinámicas asimilando lecturas observadas. | `200 OK` con curva corregida. |
| `GET` | `/api/ai/simulations` | Historial de simulaciones persistidas en SQLite. | `200 OK` con listado histórico. |
| `POST` | `/api/ai/feedback` | Feedback loop para incorporar nuevos lotes validados al dataset (requiere JWT). | `201 Created`. |

---

## 7. Ejecución de la Suite de Pruebas Automatizadas

La suite de pruebas puede ejecutarse sin librerías pesadas externas mediante:

```bash
cd backend
npm test
```

O directamente desde la raíz del proyecto:

```bash
node backend/scripts/test-api.js
```
