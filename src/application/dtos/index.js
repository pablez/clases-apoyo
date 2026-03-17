// Data Transfer Objects for safe API responses

export class UsuarioDTO {
  constructor(usuario) {
    this.id_usuario = usuario.id_usuario || usuario.id;
    this.email = usuario.email;
    this.rol = usuario.rol;
    this.id_alumno = usuario.id_alumno;
    this.created_at = usuario.created_at;
    this.updated_at = usuario.updated_at;
    // Password is intentionally omitted for security
  }

  static fromEntity(usuario) {
    return new UsuarioDTO(usuario);
  }

  static fromArray(usuarios) {
    return usuarios.map(u => new UsuarioDTO(u));
  }
}

export class AlumnoDTO {
  constructor(alumno) {
    this.id = alumno.id || alumno.id_alumno;
    this.nombre = alumno.nombre;
    this.edad = alumno.edad;
    this.curso = alumno.curso;
    this.telefono_padre = alumno.telefono_padre;
    this.materias = alumno.materias;
    this.clases_compradas = alumno.clases_compradas;
    this.horas = alumno.horas;
    this.id_usuario = alumno.id_usuario;
    
    // Include sanitized user data if present
    if (alumno._usuario) {
      this._usuario = new UsuarioDTO(alumno._usuario);
    }
  }

  static fromEntity(alumno) {
    return new AlumnoDTO(alumno);
  }

  static fromArray(alumnos) {
    return alumnos.map(a => new AlumnoDTO(a));
  }
}

export class MCPAccessDTO {
  constructor(data) {
    this.user = data.user ? new UsuarioDTO(data.user) : null;
    this.authorized = data.authorized;
    this.capabilities = data.capabilities || [];
    this.available_features = data.available_features || [];
    this.configuration = data.configuration || {};
    this.access_level = data.access_level || 'admin';
    this.expires_at = data.expires_at;
  }

  static fromAccessValidation(data) {
    return new MCPAccessDTO(data);
  }
}

export class ApiResponseDTO {
  constructor(data, success = true, message = null, metadata = {}) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }

  static success(data, message = null, metadata = {}) {
    return new ApiResponseDTO(data, true, message, metadata);
  }

  static error(message, metadata = {}) {
    return new ApiResponseDTO(null, false, message, metadata);
  }

  static paginated(data, pagination) {
    return new ApiResponseDTO(data, true, null, { pagination });
  }
}