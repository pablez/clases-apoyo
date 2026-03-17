# Nueva Arquitectura Clean Architecture

## Estructura de Directorios

```
src/
├── core/                    # Domain Layer (Entidades y reglas de negocio)
│   ├── entities/           # Entidades de dominio (Usuario, Alumno, etc.)
│   ├── repositories/       # Interfaces de repositorios
│   └── services/           # Servicios de dominio
│
├── application/            # Application Layer (Casos de uso y servicios)
│   ├── services/           # Servicios de aplicación
│   ├── usecases/          # Casos de uso (MCPAccessUseCase, etc.)
│   └── dtos/              # Data Transfer Objects para APIs
│
├── infrastructure/        # Infrastructure Layer (Adaptadores externos)
│   ├── database/          # Adaptadores de base de datos
│   │   ├── sheets/        # Implementación Google Sheets
│   │   └── mock/          # Implementación Mock para desarrollo
│   ├── external/          # Servicios externos
│   │   └── mcp/           # Servicios MCP (Power BI)
│   └── web/               # Infraestructura web (middlewares, etc.)
│
├── presentation/          # Presentation Layer (UI y controladores)
│   ├── components/        # Componentes UI organizados por dominio
│   │   ├── auth/          # Componentes de autenticación
│   │   ├── alumnos/       # Componentes de gestión de alumnos
│   │   ├── admin/         # Componentes de administración
│   │   └── shared/        # Componentes compartidos
│   ├── pages/             # Páginas de Astro (mantienen estructura actual)
│   ├── hooks/             # React/Preact hooks
│   └── layouts/           # Layouts de página
│
├── shared/               # Shared Layer (Utilidades y configuración)
│   ├── config/           # Configuración de la aplicación
│   ├── utils/            # Utilidades compartidas
│   └── types/            # Definiciones de tipos
│
└── assets/              # Recursos estáticos
    └── styles/          # Estilos CSS
```

## Principios de la Arquitectura

### 1. Separación de Responsabilidades
- **Core**: Contiene la lógica de negocio pura, sin dependencias externas
- **Application**: Orquesta casos de uso y coordina entre capas
- **Infrastructure**: Maneja detalles de implementación (BD, APIs externas)  
- **Presentation**: Maneja la interfaz de usuario y entrada/salida
- **Shared**: Utilidades y configuración compartida entre capas

### 2. Dependency Inversion
- Las capas internas no dependen de las externas
- Los repositorios se definen como interfaces en `core/repositories`
- Las implementaciones están en `infrastructure/database`
- La inyección de dependencias se maneja en el bootstrap

### 3. Data Flow
```
User Input → Presentation → Application → Core ← Infrastructure
                                  ↑              ↓
                               Use Cases → Repository Interface → Repository Implementation
```

## Configuración del Usuario Admin MCP

### Usuario Autorizado
- **Email**: `admin@clasesapoyo.com`
- **Rol**: `admin`  
- **Permisos MCP**: ✅ Habilitado

### Endpoints MCP
- `GET /api/mcp/models?operation=status` - Verificar acceso
- `GET /api/mcp/models?operation=list` - Listar modelos 
- `GET /api/mcp/models?operation=connect&modelId=X` - Conectar a modelo
- `POST /api/mcp/models` - Operaciones avanzadas

### Autenticación MCP
Los endpoints MCP requieren:
1. Token válido (cookie `session` o header `Authorization: Bearer <token>`)
2. Usuario con rol `admin`
3. Email en lista de autorizados MCP (`AppConfig.mcp.authorizedEmails`)

## Migración de Código Existente

### 1. Componentes UI
Los componentes existentes se pueden mover gradualmente:
```
components/LoginForm.jsx → presentation/components/auth/LoginForm.jsx
components/AlumnosManager.jsx → presentation/components/alumnos/AlumnosManager.jsx
components/AttendanceManager.jsx → presentation/components/admin/AttendanceManager.jsx
```

### 2. Servicios y Repositorios
```
services/alumnos.js → mantener como servicio cliente
infrastructure/sheets/ → infrastructure/database/sheets/
infrastructure/mock/ → infrastructure/database/mock/
```

### 3. APIs
Los endpoints pueden usar gradualmente la nueva arquitectura:
```javascript
// Ejemplo: /api/usuarios/index.js refactorizado
import { MCPAccessUseCase } from '../../application/usecases/MCPAccessUseCase.js';
import { UsuarioDTO, ApiResponseDTO } from '../../application/dtos/index.js';
```

## Beneficios de la Nueva Arquitectura

### 1. Escalabilidad
- Fácil agregar nuevas funcionalidades
- Componentes reutilizables por dominio
- Separación clara de responsabilidades

### 2. Mantenibilidad 
- Código más organizado y predecible
- Fácil testing unitario por capas
- Reducción de acoplamiento

### 3. Seguridad
- DTOs previenen exposición accidental de datos sensibles
- Validación centralizada de acceso MCP
- Logs de auditoría estructurados

### 4. Desarrollo
- Nuevos desarrolladores encuentran código más fácilmente
- Patrones consistentes entre módulos
- Configuración centralizada

## Próximos Pasos

1. **Migración Gradual**: Empezar moviendo componentes por dominio
2. **Tests**: Agregar tests unitarios usando la nueva estructura
3. **Documentación**: Crear guías específicas por módulo
4. **Optimización**: Aplicar patrones como Repository Pattern completamente