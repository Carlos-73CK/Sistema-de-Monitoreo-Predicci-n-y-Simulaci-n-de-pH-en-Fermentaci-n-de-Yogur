# PrediYogur

**Sistema de Monitoreo, Predicción y Simulación de pH en Fermentación de Yogur**

Plataforma universitaria y de investigación desarrollada en conjunto con el **Dr. Stalin Santacruz**, docente investigador de la **Facultad de Ciencias de la Vida y Tecnologías** de la **Universidad Laica Eloy Alfaro de Manabí (ULEAM)**.

---

## 📋 Descripción del Sistema

**PrediYogur** es una solución integral orientada a optimizar el seguimiento experimental y pedagógico de la fermentación láctica (tanto para leche tradicional de vaca como alternativas vegetales a base de chocho, coco, etc.). 

El sistema permite:
- **Monitorear** variables críticas del proceso (pH, temperatura, masa de inóculo y tipo de sustratos).
- **Predecir** el tiempo estimado para alcanzar el pH óptimo de corte (4.5).
- **Alertar** tempranamente desviaciones térmicas fuera de la ventana óptima (41 °C – 43 °C).
- **Simular** escenarios ("What-If Analysis") para comparar curvas cinéticas ante variaciones de formulación y temperatura.

---

## 📂 Estructura del Repositorio

El proyecto está organizado en tres áreas técnicas principales:

```text
PrediYogur/
├── database/     # Scripts de base de datos PostgreSQL, esquemas DDL y migraciones
├── backend/      # API REST en Node.js + Express (config, controllers, middlewares, routes)
└── mobile/       # Aplicación móvil en React Native (pantallas, navegación, componentes)
```

### Detalle de Módulos

1. **`database/`**
   - Gestión del modelo relacional en PostgreSQL.
   - Almacenamiento de ensayos, lotes, series temporales de lecturas (tiempo, pH, temperatura) y mediciones de viscosidad final.

2. **`backend/`**
   - Servidor y API REST construido con Node.js y Express.
   - Autenticación segura mediante JWT y bcrypt.
   - `src/config/`: Conexión a base de datos y variables de configuración.
   - `src/controllers/`: Lógica de negocio y manejo de peticiones.
   - `src/middlewares/`: Validación de datos, control de acceso y manejo de errores.
   - `src/routes/`: Definición de endpoints de la API.

3. **`mobile/`**
   - Interfaz de usuario desarrollada con React Native.
   - Enfoque centrado en la visualización interactiva y superposición de curvas cinéticas.
   - `src/assets/`: Recursos estáticos (imágenes, iconos).
   - `src/components/common/`: Componentes reutilizables de UI.
   - `src/context/`: Estado global de la aplicación.
   - `src/navigation/`: Flujos y enrutamiento de pantallas.
   - `src/screens/`: Vistas principales (monitoreo, ingreso de datos, simulaciones).
   - `src/services/`: Consumo de la API REST.
   - `src/styles/`: Temas y estilos base.

---

## 👥 Organización del Equipo

- **Carlos Delgado:** Director de Proyecto / Coordinación General y Desarrollo Móvil
- **Alex Patiño:** Base de Datos (PostgreSQL)
- **Juan Murillo:** Backend (Node.js + Express)
- **Jordan Mesa:** API REST e Integraciones
- **Jinger Pérez:** Frontend y Visualización de Datos