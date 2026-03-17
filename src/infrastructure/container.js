import { UsuarioRepositorySheets } from './database/sheets/UsuarioRepositorySheets.js';
import { UsuarioRepositoryMock } from './database/mock/UsuarioRepositoryMock.js';
import { AlumnosRepositorySheets } from './database/sheets/AlumnosRepositorySheets.js';
import { AlumnosRepositoryMock } from './database/mock/AlumnosRepositoryMock.js';
import { AsistenciasRepositorySheets } from './database/sheets/AsistenciasRepositorySheets.js';
import { AsistenciasRepositoryMock } from './database/mock/AsistenciasRepositoryMock.js';
import { MaterialesRepositorySheets } from './database/sheets/MaterialesRepositorySheets.js';
import { MaterialesRepositoryMock } from './database/mock/MaterialesRepositoryMock.js';

let _container = null;

export function getContainer() {
  if (_container) return _container;

  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';

  const usuarioRepository = useSheets ? new UsuarioRepositorySheets() : new UsuarioRepositoryMock();
  const alumnosRepository = useSheets ? new AlumnosRepositorySheets() : new AlumnosRepositoryMock();
  const asistenciasRepository = useSheets ? new AsistenciasRepositorySheets() : new AsistenciasRepositoryMock();
  const materialesRepository = useSheets ? new MaterialesRepositorySheets() : new MaterialesRepositoryMock();

  _container = {
    useSheets,
    repositories: {
      usuarioRepository,
      alumnosRepository,
      asistenciasRepository,
      materialesRepository,
    },
  };

  return _container;
}

