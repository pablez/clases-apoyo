// Domain Entity: Alumno
export class Alumno {
  constructor(data) {
    this.id = data.id || data.id_alumno;
    this.nombre = data.nombre || '';
    this.edad = data.edad;
    this.curso = data.curso || '';
    this.telefono_padre = data.telefono_padre || '';
    this.materias = Array.isArray(data.materias) 
      ? data.materias 
      : (typeof data.materias === 'string' 
        ? data.materias.split(',').map(s => s.trim()).filter(Boolean)
        : []);
    this.clases_compradas = Number(data.clases_compradas) || 0;
    this.horas = data.horas || '';
    this.id_usuario = data.id_usuario || data.idUsuario;
    this._usuario = data._usuario || null; // Linked user data
  }

  // Domain methods
  hasMateria(materia) {
    return this.materias.includes(materia);
  }

  canAttendClass() {
    return this.clases_compradas > 0;
  }

  // Factory methods
  static fromSheetRow(row, headers = ['id', 'nombre', 'edad', 'curso', 'telefono_padre', 'materias', 'clases_compradas', 'horas', 'id_usuario']) {
    const data = {};
    headers.forEach((header, index) => {
      data[header] = row[index] || '';
    });
    return new Alumno(data);
  }

  static fromJSON(data) {
    return new Alumno(data);
  }

  // Data transformation
  toSheetRow() {
    return [
      this.id,
      this.nombre,
      this.edad,
      this.curso,
      this.telefono_padre,
      Array.isArray(this.materias) ? this.materias.join(', ') : this.materias,
      this.clases_compradas,
      this.horas || '',
      this.id_usuario || ''
    ];
  }

  toSafeJSON() {
    const safe = { ...this };
    // Remove any sensitive data if present
    if (safe._usuario && safe._usuario.password) {
      safe._usuario = { ...safe._usuario };
      delete safe._usuario.password;
    }
    return safe;
  }
}