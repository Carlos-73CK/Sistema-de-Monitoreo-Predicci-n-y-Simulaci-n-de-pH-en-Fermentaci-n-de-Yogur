/**
 * Especificación OpenAPI 3.0 — PrediYogur API REST
 * Cátedra de Química de Alimentos (ULEAM)
 * 
 * Documentación interactiva para Swagger UI:
 * Expuesta en /api/docs para visualización, pruebas y evaluación académica.
 */

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: '🥛 PrediYogur API REST — Plataforma Biotecnológica',
    version: '1.0.0',
    description: `
**Sistema de Monitoreo, Predicción y Simulación de pH en Fermentación de Yogur**
*Facultad de Ciencias de la Vida y Tecnologías — Universidad Laica Eloy Alfaro de Manabí (ULEAM)*

### 🔬 Características Principales:
- **Modelo de Hill Biofísico:** Calibrado para cultivo láctico *Chivería* con $R^2 = 0.9774$, $\\text{RMSE} = 0.0961$, $\\text{MAE} = 0.0773$.
- **Punto de Corte Biológico:** Meta estricta de coagulación de $\\kappa$-caseína a **pH 4.50**.
- **Seguridad:** Autenticación JWT con encriptación bcrypt (cost factor 10 rounds) y control de acceso basado en roles (RBAC).
- **Persistencia Dual:** Motor SQLite autónomo local con arquitectura lista para PostgreSQL / Supabase.
- **Trazabilidad:** Exportación científica de datos en formatos CSV y JSON para Excel y OriginLab.
    `,
    contact: {
      name: 'Carlos Delgado (Director de Proyecto) & Dr. Stalin Santacruz (Asesor Científico)',
      email: 'carlos.delgado@uleam.edu.ec',
      url: 'https://www.uleam.edu.ec',
    },
    license: {
      name: 'ISC License — ULEAM 2026',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Servidor Local de Desarrollo (Node.js + Express)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese su token JWT en el formato: Bearer <token>',
      },
    },
    schemas: {
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Carlos Delgado' },
          email: { type: 'string', format: 'email', example: 'carlos.delgado@uleam.edu.ec' },
          rol: { type: 'string', enum: ['docente', 'investigador', 'estudiante'], example: 'investigador' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ParametrosSimulacion: {
        type: 'object',
        required: ['temperatura_c', 'masa_inoculo_g', 'volumen_ml'],
        properties: {
          temperatura_c: { type: 'number', minimum: 35, maximum: 48, example: 42.0 },
          masa_inoculo_g: { type: 'number', minimum: 1, maximum: 100, example: 18.75 },
          volumen_ml: { type: 'number', minimum: 50, maximum: 5000, example: 250 },
          tipo_sustrato: { type: 'string', enum: ['vaca', 'vegetal_chocho', 'vegetal_coco'], example: 'vaca' },
          tipo_azucar: { type: 'string', enum: ['sacarosa', 'lactosa', 'glucosa'], example: 'sacarosa' },
          intervalo_minutos: { type: 'integer', default: 15, example: 15 },
        },
      },
      LecturaLaboratorio: {
        type: 'object',
        required: ['tiempo_minutos', 'ph'],
        properties: {
          tiempo_minutos: { type: 'integer', minimum: 0, example: 60 },
          ph: { type: 'number', minimum: 3.8, maximum: 7.2, example: 5.95 },
          temperatura: { type: 'number', example: 42.0 },
          indice_refraccion: { type: 'number', nullable: true, example: 9.8 },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Verificación de Salud del Servidor y Base de Datos',
        tags: ['Sistema'],
        responses: {
          200: {
            description: 'Servicio en línea con estado de bases de datos y motor IA.',
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Registro de nuevo usuario con bcrypt y JWT',
        tags: ['Autenticación'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'email', 'password'],
                properties: {
                  nombre: { type: 'string', example: 'Nuevo Investigador' },
                  email: { type: 'string', format: 'email', example: 'investigador.nuevo@uleam.edu.ec' },
                  password: { type: 'string', minLength: 6, example: 'secreto2026' },
                  rol: { type: 'string', enum: ['docente', 'investigador', 'estudiante'], default: 'estudiante' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario registrado exitosamente con token JWT.' },
          400: { description: 'Error de validación en los campos enviados.' },
          409: { description: 'El correo electrónico ya existe en el sistema.' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Inicio de sesión y obtención de token JWT',
        tags: ['Autenticación'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'carlos.delgado@uleam.edu.ec' },
                  password: { type: 'string', example: 'carlos2026' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Autenticación exitosa con token Bearer.' },
          401: { description: 'Credenciales inválidas.' },
        },
      },
    },
    '/api/v1/auth/usuarios': {
      get: {
        summary: 'Listado de usuarios precalibrados para switch de perfil',
        tags: ['Autenticación'],
        responses: {
          200: { description: 'Lista de usuarios disponibles en el laboratorio.' },
        },
      },
    },
    '/api/v1/auth/perfil': {
      get: {
        summary: 'Obtiene el perfil del usuario autenticado',
        tags: ['Autenticación'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Perfil recuperado con éxito.' },
          401: { description: 'Token no proporcionado o expirado.' },
        },
      },
    },
    '/api/ai/metrics': {
      get: {
        summary: 'Métricas Científicas de Validación del Modelo Hill',
        tags: ['Modelo Cinético (Hill)'],
        responses: {
          200: { description: 'Métricas de validación (R² = 0.9774, RMSE = 0.0961, MAE = 0.0773).' },
        },
      },
    },
    '/api/ai/dataset': {
      get: {
        summary: 'Dataset experimental del Dr. Stalin Santacruz',
        tags: ['Modelo Cinético (Hill)'],
        responses: {
          200: { description: 'Lotes base y recuento de muestras experimentales.' },
        },
      },
    },
    '/api/ai/simulate': {
      post: {
        summary: 'Simulación Cinética Completa ("What-If")',
        tags: ['Modelo Cinético (Hill)'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ParametrosSimulacion' },
            },
          },
        },
        responses: {
          200: { description: 'Curva cinética calculada con tiempo al corte pH 4.50 y viscosidad mPa·s.' },
          400: { description: 'Parámetros fuera de rango biológico.' },
        },
      },
    },
    '/api/ai/predict': {
      post: {
        summary: 'Predice un punto cinético individual en minuto t',
        tags: ['Modelo Cinético (Hill)'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['minutos'],
                properties: {
                  minutos: { type: 'integer', example: 120 },
                  temperatura_c: { type: 'number', example: 42 },
                  masa_inoculo_g: { type: 'number', example: 18.75 },
                  volumen_ml: { type: 'number', example: 250 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Punto cinético estimado.' },
        },
      },
    },
    '/api/ai/recalibrate': {
      post: {
        summary: 'Recalibración Dinámica en Tiempo Real (Data Assimilation)',
        tags: ['Modelo Cinético (Hill)'],
        responses: {
          200: { description: 'Curva recalibrada con nuevo tiempo de corte ajustado.' },
        },
      },
    },
    '/api/ai/trials': {
      get: {
        summary: 'Listado de Ensayos Archivados',
        tags: ['Ensayos & Monitoreo'],
        parameters: [
          { in: 'query', name: 'usuario_email', schema: { type: 'string' }, description: 'Filtrar por correo' },
          { in: 'query', name: 'mis_ensayos', schema: { type: 'boolean' }, description: 'Filtrar solo ensayos propios' },
        ],
        responses: {
          200: { description: 'Lista de ensayos ordenados cronológicamente.' },
        },
      },
      post: {
        summary: 'Crear Nuevo Ensayo Experimental',
        tags: ['Ensayos & Monitoreo'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lote_id', 'temperatura_c', 'masa_inoculo_g', 'volumen_ml'],
                properties: {
                  lote_id: { type: 'string', example: 'LOTE-EXP-2026-A' },
                  investigador: { type: 'string', example: 'Carlos Delgado' },
                  temperatura_c: { type: 'number', example: 42.0 },
                  masa_inoculo_g: { type: 'number', example: 18.75 },
                  volumen_ml: { type: 'number', example: 250 },
                  tipo_sustrato: { type: 'string', example: 'vaca' },
                  tipo_azucar: { type: 'string', example: 'sacarosa' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ensayo creado y persistido con proyección inicial.' },
        },
      },
    },
    '/api/ai/trials/{loteId}': {
      get: {
        summary: 'Detalle de Ensayo con Proyección Recalculada',
        tags: ['Ensayos & Monitoreo'],
        parameters: [
          { in: 'path', name: 'loteId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Detalle del ensayo con lecturas y curva dinámica.' },
          404: { description: 'Ensayo no encontrado.' },
        },
      },
      delete: {
        summary: 'Eliminar un Ensayo Experimental',
        tags: ['Ensayos & Monitoreo'],
        parameters: [
          { in: 'path', name: 'loteId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Ensayo eliminado exitosamente.' },
        },
      },
    },
    '/api/ai/trials/{loteId}/readings': {
      post: {
        summary: 'Registrar Lectura Periódica de Laboratorio (pH, Temp, Brix)',
        tags: ['Ensayos & Monitoreo'],
        parameters: [
          { in: 'path', name: 'loteId', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LecturaLaboratorio' },
            },
          },
        },
        responses: {
          200: { description: 'Lectura registrada y proyección de corte recalibrada.' },
        },
      },
    },
    '/api/ai/trials/{loteId}/export': {
      get: {
        summary: 'Exportar Datos del Ensayo en CSV o JSON',
        tags: ['Ensayos & Monitoreo'],
        parameters: [
          { in: 'path', name: 'loteId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'formato', schema: { type: 'string', enum: ['csv', 'json'], default: 'csv' } },
        ],
        responses: {
          200: { description: 'Archivo descargable CSV o payload JSON.' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
