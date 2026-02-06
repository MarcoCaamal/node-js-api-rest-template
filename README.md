# Node.js API REST Template

Template profesional para APIs REST con Node.js, TypeScript, Express y las mejores prácticas de desarrollo.

## Características

- **TypeScript** - Tipado estático para mayor seguridad y mantenibilidad
- **Express** - Framework web rápido y minimalista
- **Prisma** - ORM moderno para bases de datos
- **ESLint + Prettier** - Linting y formateo automático de código (estilo Standard)
- **Vitest** - Framework de testing rápido con soporte TypeScript
- **Husky + lint-staged** - Git hooks para validar código antes de commits
- **pnpm** - Gestor de paquetes rápido y eficiente

## Requisitos Previos

- Node.js >= 18
- pnpm >= 10

## Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Configurar las variables de entorno en .env
```

## Scripts Disponibles

### Desarrollo

```bash
# Iniciar servidor en modo desarrollo con hot-reload
pnpm dev
```

### Build y Producción

```bash
# Compilar TypeScript a JavaScript
pnpm build

# Iniciar servidor en producción
pnpm start
```

### Testing

```bash
# Ejecutar tests en modo watch
pnpm test

# Ejecutar tests con interfaz UI
pnpm test:ui

# Generar reporte de cobertura
pnpm test:coverage
```

### Linting y Formateo

```bash
# Verificar errores de linting
pnpm lint

# Corregir errores de linting automáticamente
pnpm lint:fix

# Formatear código con Prettier
pnpm format

# Verificar formateo sin modificar archivos
pnpm format:check
```

## Estructura del Proyecto

```
.
├── src/                    # Código fuente
│   └── index.ts           # Punto de entrada de la aplicación
├── tests/                 # Tests
│   └── example.test.ts    # Ejemplo de test
├── dist/                  # Archivos compilados (generado)
├── .husky/                # Git hooks
│   └── pre-commit        # Hook de pre-commit
├── eslint.config.js      # Configuración de ESLint
├── .prettierrc           # Configuración de Prettier
├── .prettierignore       # Archivos ignorados por Prettier
├── .lintstagedrc.json    # Configuración de lint-staged
├── .editorconfig         # Configuración del editor
├── vitest.config.ts      # Configuración de Vitest
├── tsconfig.json         # Configuración de TypeScript
└── package.json          # Dependencias y scripts
```

## Configuración de Linting y Formateo

Este proyecto utiliza:

- **ESLint 9** con configuración estilo Standard
  - Sin punto y coma (`;`)
  - Comillas simples (`'`)
  - Indentación de 2 espacios
  - Reglas estrictas de TypeScript

- **Prettier** integrado con ESLint
  - Formateo automático consistente
  - Configuración sincronizada con Standard

- **Husky + lint-staged**
  - Pre-commit hook que ejecuta linting y formateo automáticamente
  - Solo valida archivos modificados para mejor rendimiento

## Testing

Este proyecto usa **Vitest**, un framework de testing moderno y rápido:

- API compatible con Jest
- Soporte nativo para TypeScript
- Hot Module Replacement (HMR)
- Coverage con v8
- Interfaz UI opcional

### Escribir Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('Mi Feature', () => {
  it('debe hacer algo', () => {
    expect(true).toBe(true)
  })
})
```

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development
```

## Git Hooks

Al hacer commit, automáticamente se ejecutará:

1. **lint-staged** - Ejecuta ESLint y Prettier en archivos modificados
2. Si hay errores, el commit será rechazado
3. Los errores de formateo se corrigen automáticamente

Para saltar los hooks (no recomendado):

```bash
git commit --no-verify
```

## Configuración del Editor

### VS Code

Instalar extensiones recomendadas:

- ESLint
- Prettier
- EditorConfig

Agregar a `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

ISC
