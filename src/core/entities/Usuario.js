// Domain Entity: Usuario
export class Usuario {
  constructor(data) {
    this.id_usuario = data.id_usuario || data.id;
    this.id_alumno = data.id_alumno;
    this.email = data.email;
    this.password = data.password; // Solo para uso interno, nunca exponer
    this.rol = data.rol || 'padre';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  // Domain methods
  isAdmin() {
    return String(this.rol).toLowerCase() === 'admin';
  }

  isPadre() {
    return String(this.rol).toLowerCase() === 'padre';
  }

  canAccessMCP() {
    return this.isAdmin();
  }

  // Factory methods
  static fromSheetRow(row, headers = ['id_usuario', 'id_alumno', 'email', 'password', 'rol']) {
    const data = {};
    headers.forEach((header, index) => {
      data[header] = row[index] || '';
    });
    return new Usuario(data);
  }

  static fromJSON(data) {
    return new Usuario(data);
  }

  // Data sanitization
  toSafeJSON() {
    const safe = { ...this };
    delete safe.password;
    return safe;
  }

  toSheetRow() {
    return [
      this.id_usuario,
      this.id_alumno || '',
      this.email,
      this.password || '',
      this.rol
    ];
  }
}