# f_chat Frontend

SPA de React para f_chat: panel de conversaciones de WhatsApp, editor de flows conversacionales de IA, catálogo, y administración multi-tenant.

## Repos relacionados

Este es el frontend de un proyecto de dos repos. Para correr la app completa, clona también el backend:

```bash
git clone https://github.com/FrankOrozcoGT/f_chat_backend.git
```

Ver [f_chat_backend](https://github.com/FrankOrozcoGT/f_chat_backend) para la API NestJS.

## Stack Tecnológico (2026)

- **React 19.2** - Biblioteca UI con nuevo compilador y Actions API
- **TypeScript 5.9** - Tipado estático
- **Vite 7** - Build tool ultra-rápido
- **TanStack Query v5** - Gestión de estado del servidor
- **Zustand v5** - Gestión de estado de UI
- **Axios** - Cliente HTTP
- **Socket.IO Client** - WebSocket para comunicación en tiempo real
- **Vitest** - Framework de testing
- **React Testing Library** - Testing de componentes

## Arquitectura

### Patrón: Feature Colocation + Server/Client State Separation

```
src/
├── features/              # Features por dominio
│   └── {feature}/
│       ├── api/          # TanStack Query hooks
│       ├── components/   # Componentes de presentación
│       ├── hooks/        # Hooks propios del feature
│       ├── types.ts
│       └── store.ts      # Zustand - UI state
│
├── routing/               # Guards y páginas de acceso propias de la app (no genéricas)
├── layouts/                # Layouts compartidos
│
├── shared/                 # Código verdaderamente compartido entre features
│   ├── ui/                # Componentes base
│   ├── components/
│   ├── hooks/              # Hooks utilitarios
│   └── lib/                # Helpers (errors.ts, date.ts, etc.)
│
├── lib/                    # Infraestructura transversal
│   ├── api.ts              # Axios instance
│   ├── websocket.ts        # WebSocket client
│   └── queryClient.ts      # TanStack Query config
│
├── App.tsx
└── main.tsx
```

Reglas de la arquitectura:
- Sin barrel files (`index.ts` que reexportan) — se importa siempre del archivo real.
- Todos los imports usan el alias `@/`, sin excepción — cero imports relativos (`./`, `../`).
- `shared/` y `lib/` nunca importan de `features/`.
- Manejo de errores centralizado vía `shared/lib/errors.ts` (`getErrorMessage`) — nunca `error instanceof Error ? ... : ...` manual ni casts.

### Separación de Estado

- **Server State** → TanStack Query (datos del backend)
- **Client State** → Zustand (estado de UI)

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint

# Testing
npm run test           # Modo watch
npm run test:ui        # UI interactiva
npm run test:coverage  # Con cobertura
```

## Configuración

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configurar las variables de entorno:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   VITE_WS_URL=http://localhost:3000
   ```

## Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

## Convenciones

### Naming
- **Components**: PascalCase
- **Hooks**: camelCase con prefijo `use`
- **Stores**: camelCase con sufijo `Store`

### Query Keys Pattern
```typescript
export const entityKeys = {
  all: ['entity'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters: F) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
}
```

### WebSocket Pattern
```typescript
// Cleanup en useEffect
useEffect(() => {
  ws.on('event', handler)
  return () => ws.off('event', handler)
}, [])
```

## Integraciones

### Backend REST API
- Base URL configurable vía env
- Autenticación: JWT en headers
- Interceptores para manejo de errores

### Backend WebSocket
- Conexión con auth token
- Reconexión automática
- Rooms para aislamiento

## Estado del proyecto

Este proyecto no recibe desarrollo activo de mi parte, pero queda disponible como referencia y punto de partida para quien quiera continuarlo. Si lo usas y quieres seguir mejorándolo, o simplemente quieres decirme qué te pareció, sos bienvenido a abrir un issue o un PR — forks son bienvenidos.

## Licencia

[MIT License](LICENSE)

## Contribuir

Contribuciones bienvenidas — abre un issue primero para discutir el cambio. Este proyecto sigue el [Contributor Covenant](CODE_OF_CONDUCT.md).
