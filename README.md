# 🥛 PrediYogur

**Sistema de Monitoreo, Predicción y Simulación de pH en Fermentación de Yogur**

Plataforma universitaria y de investigación biotecnológica desarrollada en conjunto con el **Dr. Stalin Santacruz Terán**, docente investigador de la **Facultad de Ciencias de la Vida y Tecnologías** y la **Maestría en Alimentos** de la **Universidad Laica Eloy Alfaro de Manabí (ULEAM)**.

---

## 📋 Descripción del Sistema

**PrediYogur** es una solución integral orientada a optimizar el seguimiento experimental y pedagógico de la fermentación láctica (tanto para leche de vaca tradicional como formulaciones alternativas vegetales a base de chocho, coco, etc.). 

El sistema implementa el modelo biofísico no lineal de **Hill** con asimilación de datos en tiempo real, calibrado específicamente para el cultivo láctico comercial **Chivería** (*Streptococcus thermophilus* + *Lactobacillus delbrueckii subsp. bulgaricus*):
- **Meta de corte estricta:** **pH 4.50** (coagulación óptima de caseínas, máxima firmeza y prevención de sinéresis).
- **Rendimiento bioestadístico validado:** $R^2 = 0.9774$ (97.74% de precisión), $RMSE = 0.0961$, $MAE = 0.0773$.
- **Alertas térmicas:** Monitoreo continuo de la ventana óptima de incubación (41 °C – 43 °C).
- **Persistencia autónoma:** Base de datos SQLite local lista para usar sin necesidad de configurar servidores de base de datos externos para pruebas locales y demostraciones.

---

## 📂 Arquitectura del Repositorio

El proyecto está diseñado bajo una **arquitectura desacoplada** estructurada como un monorepo:

```text
PrediYogur/
├── backend/      # Servidor API REST en Node.js + Express + SQLite autónomo integrado
│   ├── src/ai/         # Algoritmos cinéticos (Hill), predicción y persistencia SQLite
│   ├── src/public/     # Frontend Web Responsivo (accesible desde PC y celulares)
│   └── src/server.js   # Punto de entrada del servidor (puerto 5000)
├── mobile/       # Aplicación móvil nativa en React Native (Android / iOS)
│   ├── src/screens/    # Pantallas nativas (Dashboard, Nuevo Ensayo, Monitoreo, Simulación)
│   ├── src/navigation/ # React Navigation
│   └── src/services/   # Cliente Axios conectado al backend
├── database/     # Scripts DDL y semillas para PostgreSQL (opcional para producción)
├── docs/         # Documentación de arquitectura (ARCHITECTURE.md) y despliegue
└── package.json  # Scripts raíz para orquestar todo el espacio de trabajo
```

---

## 🚀 Guía Rápida para Levantar el Sistema

### 📌 Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 LTS o 20 LTS recomendada)
- [Git](https://git-scm.com/)

---

### Opción A: Levantar Backend + Web Responsiva (Recomendada para Pruebas Inmediatas)

El backend incluye una base de datos **SQLite local autónoma** (`backend/data/prediyogur_local.sqlite`) que se inicializa automáticamente, por lo que **no necesitas instalar PostgreSQL ni Docker para empezar a probar**.

1. **Clonar el repositorio (si aún no lo tienes):**
   ```bash
   git clone https://github.com/Carlos-73CK/Sistema-de-Monitoreo-Predicci-n-y-Simulaci-n-de-pH-en-Fermentaci-n-de-Yogur.git
   cd Sistema-de-Monitoreo-Predicci-n-y-Simulaci-n-de-pH-en-Fermentaci-n-de-Yogur
   ```

2. **Instalar dependencias del backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Iniciar el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Acceder a la plataforma:**
   * **Desde tu computadora:** Abre tu navegador web en [http://localhost:5000](http://localhost:5000).
   * **Desde tu teléfono móvil (Web Responsiva):**
     1. Conecta tu celular a la **misma red Wi-Fi** de tu computadora.
     2. En tu PC, abre una terminal y consulta tu dirección IP local (ejecuta `ipconfig` en Windows o `ifconfig` en Linux/Mac; ej. `192.168.1.15`).
     3. Abre el navegador de tu celular (Chrome o Safari) e ingresa:
        ```text
        http://TU_IP_LOCAL:5000   (Ejemplo: http://192.168.1.15:5000)
        ```
     4. La interfaz se adaptará fluidamente a la pantalla del móvil con controles táctiles optimizados.

---

### Opción B: Levantar la Aplicación Móvil Nativa (React Native)

Si deseas compilar y ejecutar la app móvil nativa ubicada en la carpeta `mobile/`:

1. **Asegúrate de que el backend esté corriendo** (en el puerto 5000, tal como se indicó en la Opción A).

2. **Instalar dependencias del módulo móvil:**
   ```bash
   cd mobile
   npm install
   ```

3. **Iniciar el empaquetador Metro de React Native:**
   ```bash
   npm start
   ```

4. **Ejecutar en tu dispositivo:**
   * **En Android (Emulador de Android Studio o teléfono conectado por USB con Depuración activa):**
     En una nueva terminal dentro de `mobile/`:
     ```bash
     npm run android
     ```
   * **En iOS (requiere macOS y Xcode):**
     ```bash
     npm run ios
     ```

> 💡 **Nota sobre la IP en Móvil:**  
> En el archivo `mobile/src/services/api.js`, la URL por defecto para emuladores Android es `http://10.0.2.2:5000/api`. Si ejecutas la app en un teléfono físico por USB o Wi-Fi, actualiza la constante `DEFAULT_BASE_URL` con la IP local de tu computadora (ejemplo: `http://192.168.1.15:5000/api`).

---

### Opción C: Comandos desde la Raíz del Monorepo

Desde la carpeta principal del proyecto puedes utilizar los atajos directos:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev:backend` | Inicia el servidor backend en `backend/` con recarga automática. |
| `npm run dev:mobile` | Inicia el bundler de Metro en `mobile/`. |
| `npm run android` | Compila y levanta la app móvil en Android. |
| `npm run ios` | Compila y levanta la app móvil en iOS (macOS). |
| `npm run docker:up` | *(Opcional)* Levanta los servicios con Docker Compose (PostgreSQL + API). |
| `npm run db:init` | *(Opcional)* Carga el esquema y semillas iniciales en PostgreSQL. |

---

## 🔬 Módulos y Pestañas del Sistema

1. **⚡ Nuevo Ensayo / Simulador Cinético ("What-If"):**
   * Configuración de variables de incubación (temperatura, inóculo, volumen, tipo de sustrato y azúcar).
   * Escenarios precalibrados del Dr. Stalin Santacruz (Óptimo 42 °C/7.5%, Lento 2.5%, Frío 40 °C, Calor 44 °C).
   * Estimación instantánea del tiempo al punto de corte (pH 4.50) y viscosidad reológica en mPa·s.
   * Botón para crear el ensayo y transferirlo automáticamente al gestor de monitoreo activo.

2. **📁 Ensayos & Lotes Archivados (Monitoreo Activo & SQLite):**
   * Archivo cronológico ordenado (ensayos más recientes arriba) con persistencia permanente en SQLite.
   * Al abrir un ensayo, despliega la curva interactiva con **puntos reales medidos superpuestos sobre la predicción de Hill**.
   * Panel de ingreso de lecturas periódicas de laboratorio (tiempo transcurrido, pH potenciómetro, temperatura de baño y °Brix refractómetro).
   * Recálculo dinámico de la hora de corte a pH 4.50 ante cada nueva medición.
   * Blindaje ante recarga de página (`F5`): no se pierde ningún dato ni avance.

3. **⏱️ Demostrador en Vivo & Recalibración IA:**
   * Demostrador pedagógico de 1 clic para presentaciones académicas y evaluaciones.
   * Simulación instantánea de perturbaciones biológicas:
     * ⚡ **Acelerado:** Acidificación rápida (-25 min).
     * ❄️ **Enfriamiento:** Retraso por baja térmica (+40 min).
     * ⭐ **Nominal:** Cinética teórica ideal.
   * Comparador gráfico de doble curva (Curva Teórica vs. Nueva Curva Recalibrada) con margen de incertidumbre bayesiano.

4. **🧬 Bioquímica & Escala pH (ULEAM):**
   * Fundamento bromatológico del colapso micelar de kappa-caseína entre pH 4.80 y 4.50.
   * Guía para la prevención de sinéresis y sobreacidificación.

5. **🧠 Aprendizaje Continuo (Feedback Loop):**
   * Incorporación de lotes finalizados con viscosidad experimental real.
   * Validación fisicoquímica y reentrenamiento dinámico de los coeficientes del modelo.

6. **📊 Métricas Científicas del Modelo:**
   * Validación bioestadística con $R^2 = 0.9774$, $RMSE = 0.0961$ y $MAE = 0.0773$.
   * Ficha técnica y respaldo metodológico del Dr. Stalin Santacruz Terán.

---

## 📡 Endpoints Principales de la API REST

* `GET /api/health` — Verificación de estado del servidor y base de datos.
* `GET /api/ai/metrics` — Métricas bioestadísticas de validación del modelo ($R^2$, RMSE, MAE).
* `GET /api/ai/dataset` — Dataset experimental de calibración del Dr. Santacruz.
* `POST /api/ai/simulate` — Simulación de trayectoria cinética Hill ("What-If").
* `POST /api/ai/recalibrate` — Recalibración dinámica a partir de lecturas observadas.
* `GET /api/ai/trials` — Listado de todos los ensayos archivados en SQLite.
* `GET /api/ai/trials/:loteId` — Detalle de un ensayo con curva recalculada y lecturas.
* `POST /api/ai/trials` — Creación y persistencia de un nuevo ensayo.
* `POST /api/ai/trials/:loteId/readings` — Registro de una lectura periódica de laboratorio.
* `DELETE /api/ai/trials/:loteId/readings/:min` — Eliminación de una lectura específica.
* `DELETE /api/ai/trials/:loteId` — Eliminación de un ensayo experimental.

---

## 👥 Equipo de Desarrollo

* **Carlos Delgado:** Director de Proyecto / Coordinación General y Desarrollo Móvil
* **Alex Patiño:** Base de Datos (PostgreSQL & SQLite)
* **Juan Murillo:** Backend (Node.js + Express)
* **Jordan Meza:** API REST e Integraciones
* **Jinger Pérez:** Frontend y Visualización de Datos

---

## 📄 Licencia y Reconocimientos
Proyecto de titulación e investigación académica para la **Universidad Laica Eloy Alfaro de Manabí (ULEAM)**, desarrollado bajo la dirección metodológica del **Dr. Stalin Gustavo Santacruz Terán**. Distribuido bajo Licencia ISC.
