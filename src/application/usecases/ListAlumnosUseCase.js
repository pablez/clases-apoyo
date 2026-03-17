import { AuthUtils } from '../../shared/utils/AuthUtils.js';

export class ListAlumnosUseCase {
  constructor({ alumnosRepository, usuarioRepository }) {
    this.alumnosRepository = alumnosRepository;
    this.usuarioRepository = usuarioRepository;
  }

  /**
   * - Sin token: retorna todos (sanitizados si vienen con _usuario)
   * - Con token:
   *   - si token coincide con alumno.id => retorna ese alumno
   *   - si token coincide con usuario.id_usuario:
   *      - admin => retorna todos
   *      - padre => retorna alumnos linkeados por alumnos_ids (csv o array)
   */
  async execute({ token } = {}) {
    const alumnos = await this.alumnosRepository.list();
    const sanitizeAlumno = a => {
      const copy = { ...a };
      if (copy.password) delete copy.password;
      if (copy._usuario && copy._usuario.password) {
        copy._usuario = { ...copy._usuario };
        delete copy._usuario.password;
      }
      return copy;
    };

    const allSanitized = (alumnos || []).map(sanitizeAlumno);
    if (!token) return allSanitized;

    const tokenInfo = AuthUtils.parseToken(token);
    const possibleId = tokenInfo?.userId;
    if (!possibleId) throw new Error('No autorizado');

    const alumnoMatch = (alumnos || []).find(a => String(a.id || '') === String(possibleId));
    if (alumnoMatch) return [sanitizeAlumno(alumnoMatch)];

    // Resolve as usuario
    const usuario = await this.usuarioRepository.getById(possibleId);
    if (!usuario) throw new Error('No autorizado');

    if (AuthUtils.isAdmin(usuario)) return allSanitized;

    const linked = new Set();
    const idsVal = usuario.alumnos_ids;
    if (Array.isArray(idsVal)) idsVal.forEach(id => linked.add(String(id)));
    else if (typeof idsVal === 'string' && idsVal.trim()) {
      idsVal.split(',').forEach(id => linked.add(String(id).trim()));
    }

    return (alumnos || [])
      .filter(a => linked.has(String(a.id || '')))
      .map(sanitizeAlumno);
  }
}

