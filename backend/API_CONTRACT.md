# Contrato API REST Base - PrediYogur

Formato estándar de respuesta:

```json
{
  "success": true,
  "data": {},
  "message": "...",
  "error": "..."
}
```

| Método | Ruta | Parámetros | Respuesta esperada |
|---|---|---|---|
| POST | `/api/auth/register` | Body sugerido: `nombre`, `email`, `password` | `201` con `success: true`, usuario simulado y mensaje de registro. |
| POST | `/api/auth/login` | Body sugerido: `email`, `password` | `200` con `success: true`, token simulado y datos de usuario. |
| GET | `/api/ensayos` | Sin parámetros | `200` con `success: true` y lista de ensayos (simulada). |
| POST | `/api/ensayos` | Body obligatorio: `tipo_leche`, `tipo_azucar`, `masa_leche`, `masa_inoculo` | `201` con ensayo creado (simulado). Si faltan campos: `400` con `success: false` y detalle de error. |
| GET | `/api/ensayos/:id` | Path: `id` | `200` con detalle del ensayo (simulado). |
| PATCH | `/api/ensayos/:id/finalizar` | Path: `id`; Body opcional: `ph_final` | `200` con estado finalizado (simulado). |
| POST | `/api/ensayos/:id/lecturas` | Path: `id`; Body con lectura manual (ej. `tiempo_min`, `ph`, `temperatura_c`) | `201` con lectura registrada (simulada). |
| POST | `/api/ensayos/:id/importar` | Path: `id`; Body opcional de metadatos de importación | `202` con estado de importación pendiente (simulado). |
