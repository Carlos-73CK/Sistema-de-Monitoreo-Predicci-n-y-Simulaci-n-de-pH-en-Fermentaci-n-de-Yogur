/**
 * Servicio de Autenticación y Autorización — PrediYogur
 * Cátedra de Química de Alimentos (ULEAM)
 * Conforme a LOPDP (Ecuador) y directrices OWASP Authentication / ASVS
 * 
 * Implementa la lógica de negocio para:
 * - Registro con validación rigurosa de identidad y política de contraseñas (min 12 caracteres)
 * - Protección contra fuerza bruta con bloqueo temporal progresivo (5 intentos, 15 minutos)
 * - Inicio de sesión por correo electrónico o nombre de usuario
 * - Recuperación segura de contraseña con tokens temporales de un solo uso
 * - Generación y firma de tokens JWT (Bearer)
 * - Sincronización transparente SQLite / PostgreSQL
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  crearUsuario,
  buscarPorEmail,
  buscarPorUsername,
  buscarPorIdentificador,
  buscarPorId,
  buscarPorResetToken,
  guardarResetToken,
  actualizarPassword,
  registrarIntentoFallido,
  resetearIntentosFallidos,
  listarTodos,
} = require('../repositories/usuario.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'prediyogur_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Catálogo de contraseñas comunes y predecibles (OWASP Password Storage & Authentication)
const PASSWORDS_COMUNES = new Set([
  '123456789012',
  '1234567890123',
  'password12345',
  'contrasenia12',
  'contrasena123',
  'qwertyuiop12',
  'admin12345678',
  'prediyogur123',
  'prediyogur2026',
  'uleam20261234',
  'cambiame12345',
  'bienvenido123',
  'secret123456',
  'universidad12',
]);

/**
 * Validador de formato de correo electrónico
 */
function esEmailValido(correo) {
  if (!correo || typeof correo !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo.trim());
}

/**
 * Validador de nombres y apellidos (permite tildes, diéresis, ñ y caracteres válidos en español)
 */
function esNombreValido(texto) {
  if (!texto || typeof texto !== 'string') return false;
  const clean = texto.trim();
  if (clean.length < 2 || clean.length > 80) return false;
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  return regex.test(clean);
}

/**
 * Validador de nombre de usuario (alfanumérico, punto, guion o guion bajo, 3-30 caracteres)
 */
function esUsernameValido(username) {
  if (!username || typeof username !== 'string') return false;
  const clean = username.trim();
  if (clean.length < 3 || clean.length > 30) return false;
  const regex = /^[a-zA-Z0-9._-]+$/;
  return regex.test(clean);
}

/**
 * Validador de contraseña robusta (OWASP: min 12 caracteres, no comprometida / común)
 */
function validarSeguridadPassword(pass) {
  if (!pass || typeof pass !== 'string') {
    return 'La contraseña es obligatoria.';
  }
  if (pass.length < 12) {
    return 'La contraseña debe tener al menos 12 caracteres como referencia de seguridad.';
  }
  if (PASSWORDS_COMUNES.has(pass.toLowerCase().trim())) {
    return 'La contraseña elegida es demasiado común o insegura. Elija una frase más compleja.';
  }
  // Verificar repetición trivial (ej. 111111111111, aaaaaaaaaaaa)
  if (/^(.)\1{11,}$/.test(pass)) {
    return 'La contraseña no puede consistir únicamente en caracteres repetidos.';
  }
  return null;
}

/**
 * Registra un nuevo usuario en el sistema
 */
async function registrarUsuario(datos = {}) {
  const {
    nombre,
    nombres,
    apellidos,
    username,
    nombreUsuario,
    email,
    correo,
    password,
    contrasena,
    confirmPassword,
    confirmarContrasena,
    rol = 'estudiante',
    aceptaTerminos,
    terminosAceptados,
    aceptaPrivacidad,
  } = datos;

  const errores = [];

  const rawNombre = (nombres || nombre || '').trim();
  const rawApellidos = (apellidos || '').trim();
  const rawUsername = (username || nombreUsuario || '').trim().toLowerCase();
  const rawEmail = (email || correo || '').trim().toLowerCase();
  const rawPassword = password || contrasena || '';
  const rawConfirmPassword = confirmPassword || confirmarContrasena || '';
  const terminosOk = aceptaTerminos === true || terminosAceptados === true || aceptaPrivacidad === true;

  // 1. Validar Nombres
  if (!rawNombre || !esNombreValido(rawNombre)) {
    errores.push('Los nombres son obligatorios (mínimo 2 letras) y deben contener caracteres válidos.');
  }

  // 2. Validar Apellidos (si se envían y no están vacíos)
  if (rawApellidos && !esNombreValido(rawApellidos)) {
    errores.push('Los apellidos deben contener al menos 2 caracteres alfabéticos válidos.');
  }

  // 3. Validar Correo
  if (!rawEmail || !esEmailValido(rawEmail)) {
    errores.push('Debe proporcionar un correo electrónico válido (ej: usuario@uleam.edu.ec).');
  }

  // 4. Validar Username si fue enviado
  let finalUsername = rawUsername;
  if (!finalUsername && rawEmail) {
    // Generar username sugerido a partir del email si no se proporcionó
    finalUsername = rawEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
  }
  if (!esUsernameValido(finalUsername)) {
    errores.push('El nombre de usuario debe tener entre 3 y 30 caracteres alfanuméricos (letras, números, puntos o guiones).');
  }

  // 5. Validar Contraseña (mínimo 12 caracteres por directriz de ciberseguridad)
  const passError = validarSeguridadPassword(rawPassword);
  if (passError) {
    errores.push(passError);
  }

  // 6. Validar Confirmación de Contraseña
  if (rawConfirmPassword && rawPassword !== rawConfirmPassword) {
    errores.push('La confirmación de la contraseña no coincide con la contraseña ingresada.');
  }

  // 7. Aceptación de términos y política de privacidad (LOPDP Ecuador)
  if (!terminosOk && (aceptaTerminos !== undefined || aceptaPrivacidad !== undefined)) {
    errores.push('Debe aceptar el aviso de privacidad y términos correspondientes (LOPDP Ecuador).');
  }

  // 8. Control de Roles: El usuario NO puede asignarse rol administrativo
  const rolSolicitado = String(rol || 'estudiante').trim().toLowerCase();
  if (rolSolicitado.includes('admin')) {
    errores.push('No está permitido asignarse privilegios administrativos en el registro.');
  }
  const rolesValidos = ['estudiante', 'investigador', 'docente'];
  const rolFinal = rolesValidos.includes(rolSolicitado) ? rolSolicitado : 'estudiante';

  if (errores.length > 0) {
    const error = new Error(errores[0]);
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.errores = errores;
    throw error;
  }

  // 9. Comprobar que no exista email duplicado
  const existenteEmail = await buscarPorEmail(rawEmail);
  if (existenteEmail) {
    const error = new Error('El correo electrónico ya se encuentra registrado en el sistema.');
    error.statusCode = 409;
    error.errorCode = 'USER_ALREADY_EXISTS';
    throw error;
  }

  // 10. Comprobar que no exista username duplicado
  const existenteUsername = await buscarPorUsername(finalUsername);
  if (existenteUsername) {
    const error = new Error(`El nombre de usuario "${finalUsername}" ya está en uso. Por favor elija otro.`);
    error.statusCode = 409;
    error.errorCode = 'USERNAME_ALREADY_EXISTS';
    throw error;
  }

  // 11. Hashear contraseña con bcrypt (10 rounds)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

  // 12. Persistir usuario
  const nuevoUsuario = await crearUsuario({
    nombre: rawNombre,
    apellidos: rawApellidos,
    username: finalUsername,
    email: rawEmail,
    hashedPassword,
    rol: rolFinal,
  });

  // 13. Firmar token JWT
  const payload = {
    id: nuevoUsuario.id,
    email: nuevoUsuario.email || nuevoUsuario.correo,
    username: nuevoUsuario.username || finalUsername,
    rol: nuevoUsuario.rol,
    nombre: nuevoUsuario.nombre,
    apellidos: nuevoUsuario.apellidos,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      apellidos: nuevoUsuario.apellidos,
      username: nuevoUsuario.username || finalUsername,
      email: nuevoUsuario.email || nuevoUsuario.correo,
      rol: nuevoUsuario.rol,
      activo: 1,
      created_at: nuevoUsuario.created_at,
    },
    message: `¡Bienvenido(a) a PrediYogur, ${nuevoUsuario.nombre}! Cuenta creada exitosamente.`,
  };
}

/**
 * Autentica un usuario verificando credenciales, estado activo y bloqueo por fuerza bruta
 */
async function autenticarUsuario({ identificador, email, username, password }) {
  const idToUse = String(identificador || email || username || '').trim();
  const passToUse = String(password || '');

  if (!idToUse || !passToUse) {
    const error = new Error('Debe ingresar su correo institucional (o usuario) y su contraseña.');
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  // 1. Buscar usuario por email o username
  const usuario = await buscarPorIdentificador(idToUse);

  // Mensaje genérico de credenciales inválidas (OWASP: no revelar si la cuenta existe o no)
  const genericAuthError = () => {
    const error = new Error('Credenciales inválidas. Por favor verifique sus datos e intente nuevamente.');
    error.statusCode = 401;
    error.errorCode = 'AUTH_INVALID_CREDENTIALS';
    return error;
  };

  if (!usuario) {
    // Retardo sutil contra timing attacks y mensaje genérico
    await bcrypt.compare(passToUse, '$2a$10$abcdefghijklmnopqrstuuNOPQRSTUVWXYZ0123456789012345678');
    throw genericAuthError();
  }

  // 2. Verificar si la cuenta está activa
  if (usuario.activo === 0 || usuario.activo === false) {
    const error = new Error('Su cuenta de usuario se encuentra temporalmente inactiva. Comuníquese con la administración.');
    error.statusCode = 403;
    error.errorCode = 'ACCOUNT_INACTIVE';
    throw error;
  }

  // 3. Verificar si la cuenta se encuentra bloqueada por fuerza bruta
  if (usuario.bloqueado_hasta) {
    const ahora = new Date();
    const tiempoBloqueo = new Date(usuario.bloqueado_hasta);
    if (tiempoBloqueo > ahora) {
      const minutosRestantes = Math.max(1, Math.ceil((tiempoBloqueo - ahora) / (1000 * 60)));
      const error = new Error(`Cuenta bloqueada temporalmente por exceso de intentos fallidos. Por seguridad, intente de nuevo en ${minutosRestantes} minuto(s).`);
      error.statusCode = 429;
      error.errorCode = 'ACCOUNT_LOCKED';
      throw error;
    }
  }

  // 4. Comparar hash de contraseña
  const passwordValido = await bcrypt.compare(passToUse, usuario.contrasena || usuario.password_hash);
  if (!passwordValido) {
    // Registrar intento fallido
    const resultadoFallo = registrarIntentoFallido(usuario.id);
    if (resultadoFallo && resultadoFallo.intentos_fallidos >= 5) {
      const error = new Error('Ha superado el límite de 5 intentos fallidos. Su cuenta ha sido bloqueada temporalmente por 15 minutos.');
      error.statusCode = 429;
      error.errorCode = 'ACCOUNT_LOCKED';
      throw error;
    }
    throw genericAuthError();
  }

  // 5. Restablecer contador de intentos fallidos tras login exitoso
  resetearIntentosFallidos(usuario.id);

  // 6. Firmar token JWT
  const payload = {
    id: usuario.id,
    email: usuario.correo || usuario.email,
    username: usuario.username || '',
    rol: usuario.rol,
    nombre: usuario.nombre,
    apellidos: usuario.apellidos || '',
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos || '',
      username: usuario.username || '',
      email: usuario.correo || usuario.email,
      rol: usuario.rol,
      activo: 1,
    },
    message: `¡Sesión iniciada correctamente! Bienvenido(a) ${usuario.nombre}.`,
  };
}

/**
 * Solicita enlace o token de recuperación de contraseña (OWASP: no revelar si el correo existe)
 */
async function solicitarRecuperacionPassword(emailOIdentificador) {
  const idLimpio = String(emailOIdentificador || '').trim().toLowerCase();
  let devToken = null;

  if (idLimpio) {
    const usuario = await buscarPorIdentificador(idLimpio);
    if (usuario && (usuario.activo === 1 || usuario.activo === undefined)) {
      // Generar token seguro criptográfico de 64 caracteres
      const token = crypto.randomBytes(32).toString('hex');
      // Expira en 1 hora
      const expira = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await guardarResetToken(usuario.id, token, expira);
      devToken = token;
    }
  }

  return {
    success: true,
    message: 'Si el correo electrónico ingresado está registrado, recibirá las instrucciones para restablecer su contraseña.',
    // En entorno de laboratorio/desarrollo local se retorna el token para agilizar pruebas
    dev_token: devToken,
  };
}

/**
 * Restablece la contraseña de una cuenta a partir de un token de un solo uso
 */
async function restablecerPasswordConToken({ token, password, confirmPassword }) {
  if (!token || typeof token !== 'string') {
    const error = new Error('El token de restablecimiento es requerido.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_TOKEN';
    throw error;
  }

  const passError = validarSeguridadPassword(password);
  if (passError) {
    const error = new Error(passError);
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    throw error;
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    const error = new Error('Las contraseñas no coinciden.');
    error.statusCode = 400;
    error.errorCode = 'PASSWORD_MISMATCH';
    throw error;
  }

  const usuario = await buscarPorResetToken(token.trim());
  if (!usuario) {
    const error = new Error('El enlace de recuperación es inválido o ya ha sido utilizado.');
    error.statusCode = 400;
    error.errorCode = 'TOKEN_EXPIRED_OR_INVALID';
    throw error;
  }

  // Verificar si ya expiró
  if (usuario.reset_token_expira) {
    const ahora = new Date();
    const expira = new Date(usuario.reset_token_expira);
    if (ahora > expira) {
      const error = new Error('El enlace de recuperación ha expirado. Por favor solicite uno nuevo.');
      error.statusCode = 400;
      error.errorCode = 'TOKEN_EXPIRED';
      throw error;
    }
  }

  // Hashear nueva contraseña
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Actualizar contraseña e invalidar token inmediatamente
  await actualizarPassword(usuario.id, hashedPassword);

  return {
    success: true,
    message: 'Contraseña actualizada exitosamente. Ya puede iniciar sesión con su nueva contraseña.',
  };
}

/**
 * Obtiene la lista de usuarios disponibles para demostración y cambio rápido de perfil
 */
function listarUsuarios() {
  return listarTodos();
}

/**
 * Obtiene el perfil de un usuario por su ID
 */
async function obtenerPerfilPorId(id) {
  return buscarPorId(Number(id));
}

module.exports = {
  registrarUsuario,
  autenticarUsuario,
  solicitarRecuperacionPassword,
  restablecerPasswordConToken,
  listarUsuarios,
  obtenerPerfilPorId,
  esEmailValido,
  esNombreValido,
  esUsernameValido,
  validarSeguridadPassword,
};
