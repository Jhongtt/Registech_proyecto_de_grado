# Frontend — Registech

Interfaz web del sistema **Registech**: gestión de inventario de equipos, préstamos, mantenimiento, inventario de menor cuantía (PMC), reportes y configuración.

## Stack

| Tecnología | Uso |
| --- | --- |
| React 19 + Vite 8 | Base de la aplicación (SPA) |
| TypeScript | No utilizado (proyecto en JavaScript) |
| Bootstrap 5.3 | Sistema de estilos base |
| Bootstrap Icons | Iconografía |
| SweetAlert2 | Alerts y modales de confirmación |
| Chart.js + react-chartjs-2 | Gráficas del panel |
| Axios | Cliente HTTP hacia la API |
| React Router 7 | Rutas protegidas por rol |
| ESLint 10 (react-hooks v7) | Linting |

## Estructura del proyecto

```
src/
├── api/
│   └── apiRoutes.js          # Centraliza todas las URL del backend
├── assets/                   # Imágenes estáticas
├── components/
│   ├── layout/               # Layout general de la app
│   │   ├── Layout.jsx        # Shell: sidebar + header + contenido
│   │   ├── Sidebar.jsx       # Navegación lateral (filtrada por rol)
│   │   └── Header.jsx        # Barra superior (tema, notificaciones, usuario)
│   ├── dashboard/
│   │   └── DashboardAdmin.jsx# Panel principal (KPI, gráficas, órdenes)
│   ├── equipos/
│   │   ├── EquipoCard.jsx    # Tarjeta de equipo con acciones y foto
│   │   ├── ModalPrestamo.jsx # Modal de nuevo préstamo
│   │   └── ModalRegistroEquipo.jsx # Alta de equipo
│   ├── ui/
│   │   └── Paginador.jsx     # Paginación numerada reutilizable
│   ├── Login.jsx             # Login con cuentas demo y recuperación
│   ├── Equipos.jsx           # Inventario (grilla con filtros)
│   ├── Tecnologia.jsx        # Vista admin de inventario
│   ├── Prestamos.jsx         # Préstamos activos (multi-equipo)
│   ├── HistorialPrestamos.jsx# Historial de préstamos
│   ├── GestionPrestamos.jsx  # Contenedor admin (activos + historial + KPI)
│   ├── Soportes.jsx          # Mantenimiento / órdenes con evidencia
│   ├── Historiales.jsx       # Historial de mantenimientos
│   ├── GestionMantenimiento.jsx # Contenedor (KPIs por rol + pestañas)
│   ├── Departamentos.jsx     # Áreas (admin)
│   ├── PMC.jsx               # Inventario menor y solicitudes
│   ├── Reportes.jsx          # Exportación CSV/Excel (admin)
│   ├── Empleados.jsx         # Gestión de empleados (admin)
│   ├── RecursosHumano.jsx    # Gestión de usuarios
│   ├── Notificaciones.jsx    # Campana de notificaciones
│   └── Configuracion.jsx     # Perfil, contraseña y tema
├── context/
│   └── AuthContext.jsx       # Sesión, login/logout y rol
├── utils/
│   └── equipoUtils.js        # Utilidades de equipo/fechas
├── App.jsx                   # Rutas protegidas según rol
├── index.css                 # Design system (tokens, dark mode, clases)
└── main.jsx                  # Entrada de la app
```

## Diseño (design system)

Todo el tema se define con **variables CSS** en `src/index.css`:

| Token | Valor (light) | Valor (dark) |
| --- | --- | --- |
| `--brand` | `#2563eb` (azul) | `#60a5fa` |
| `--accent` | `#7c3aed` (morado) | — |
| `--bg-app` | `#f8fafc` | `#0f172a` |
| `--bg-surface` | `#ffffff` | `#1e293b` |
| `--bg-surface-2` | `#f1f5f9` | `#334155` |
| `--sidebar-w` / colapsado | `250px` / `64px` | igual |
| `--header-h` | `56px` | igual |

Características principales:

- **Modo claro/oscuro** persistido en `localStorage`; el tema se aplica antes del render (script en `index.html`) para evitar parpadeo.
- **Layout**: sidebar colapsable + header fijo. En pantallas `≤768px` el sidebar colapsa automáticamente.
- **Botones pill** (`rounded-pill`) y componentes Bootstrap personalizados (tablas con `thead.table-header`, `nav-pills`, badges de estado).
- **Tablas responsivas** con `.table-responsive` y `overflow-x:auto` también en modales (`.modal-body`).
- **Estados vacíos** consistentes (`.empty-state`) y **paginación numerada** (`ui/Paginador.jsx`).
- Tarjetas de equipo con foto, número de serie, estado y acciones siempre visibles (sin depender del hover).

## Login

- Autenticación con token JWT + cookie CSRF.
- **Cuentas demo** desplegables para sustentación:
  - Administrador — `admin@registech.com` / `admin123`
  - Técnico Mantenimiento — `soporte@registech.com` / `soporte123`
  - Inventario — `inventario@registech.com` / `rh123`
- Recuperación de contraseña con código de 6 dígitos (3 pasos).

## Módulos y acceso por rol

| Módulo | Admin | Inventario | Soporte |
| --- | :---: | :---: | :---: |
| Panel Principal (KPI, gráficas, órdenes por aprobar) | ✓ | ✓ | ✓ |
| Equipos / Personal (inventario + alta de equipos) | ✓ | ✓ | — |
| Préstamos (activos + historial) | ✓ | — | — |
| Mantenimiento (órdenes + historial) | ✓ | — | ✓ |
| Departamentos | ✓ | — | — |
| Inventario PMC (registrar, stock ±1, solicitudes) | ✓ | ✓ | — |
| Reportes (CSV/Excel) | ✓ | — | — |
| Empleados | ✓ | — | — |
| Configuración (perfil, contraseña, tema) | ✓ | ✓ | ✓ |
| Notificaciones (header) | ✓ | ✓ | ✓ |

**Nota**: admin e inventario pueden **agregar equipos y registrar productos PMC**; el backend lo valida con `requireRol('admin','inventario')`.

## Últimas mejoras de UX y estabilidad

- Corrección de tildes en textos visibles (menú, títulos, tablas).
- Scroll horizontal en tablas y modales (mejora en móvil).
- Paginación numerada en: inventario de equipos, préstamos activos, historial de préstamos e historial de mantenimientos.
- Botones sólidos para acciones críticas (Mover / Extravío / devolución).
- Nombres reales de técnico y reportante en tablas e historiales (JOIN con usuarios).
- Seguridad: evidencias servidas por endpoint autenticado (sin carpeta `/uploads` pública), protección contra path traversal, CSRF en escrituras.
- Eliminación de dependencias y código muerto; ESLint en 0 errores.
- Test del backend: 21/21 suites pasando (setup en `backend/tests/setup.js`).

## Aportes por persona (según historial de git)

- **Jhongtt** — Rama `fix/arreglos-ux-estabilidad`: diseño y layout general, panel de control, botones sólidos, alineación de roles frontend-backend, estabilidad del backend (pool de Postgres, schema.prisma, manejo de errores), y las últimas mejoras de UX/paginación/seguridad.
- **narilin** (compañero) — Login con Google (OAuth 2.0), reCAPTCHA, préstamos de múltiples equipos, devolución parcial de artículos, historial de uso de equipos, reportes de daño con notificación a soporte, gestión de empleados y mantenimiento.
- **alycano** (principal del repositorio) — Módulo Inventario PMC, notificaciones en el header, integración de imágenes con Supabase y base del frontend.
- **Cesar Cardona** — Registro y recuperación de cuenta, devolución parcial de equipos.

## Comandos útiles

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (Vite, puerto 5173)
npm run lint     # ESLint (0 errores / warnings controlados)
npm run build    # build de producción
npm run preview  # previsualizar el build
```

> Ejecuta el backend en `http://localhost:3000` (ver `backend/README.md`) y configura `frontend/.env` con `VITE_API_URL`.