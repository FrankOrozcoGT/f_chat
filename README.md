# Frontend - fcoder

React frontend para control remoto de agentes Claude. Parte del sistema fcoder.

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
│       └── store.ts      # Zustand - UI state
│
├── layouts/              # Layouts compartidos
│
├── shared/               # Componentes reutilizables
│   ├── ui/              # Componentes base
│   └── hooks/           # Hooks utilitarios
│
├── lib/                  # Config y utilidades
│   ├── api.ts           # Axios instance
│   ├── websocket.ts     # WebSocket client
│   └── queryClient.ts   # TanStack Query config
│
├── App.tsx
└── main.tsx
```

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

## Project ID

```
9e1b6c02-3723-41c3-89ac-fc349866e60a
```

Este ID se usa para asociar el proyecto con las memorias y reglas en el sistema de MCP.
