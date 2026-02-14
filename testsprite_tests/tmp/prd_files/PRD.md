# Product Requirements Document (PRD) - TopChess

## 1. Visión General del Proyecto
**TopChess** es una plataforma premium de clases de ajedrez online diseñada para conectar a profesores de alto nivel con alumnos apasionados. El enfoque principal es ofrecer una experiencia de aula virtual inmersiva, con sincronización de tablero en tiempo real y comunicación de alta calidad.

- **Nombre del Proyecto:** TopChess
- **Estado:** MVP (Minimum Viable Product)
- **Tecnologías Core:** React (Vite), Firebase (Auth & Firestore), LiveKit (Audio/Video), Chessground.

## 2. Roles de Usuario
La plataforma distingue tres tipos de usuarios:
1. **Alumno:** Busca profesores, asiste a clases virtuales, gestiona su progreso y saldo.
2. **Profesor:** Gestiona su perfil, imparte clases mediante el aula virtual, analiza partidas y gestiona sus ganancias.
3. **Administrador:** Supervisa la actividad global, gestiona usuarios y visualiza métricas de la plataforma. (Acceso restringido por email).

## 3. Características Principales (MVP)

### 3.1. Sistema de Autenticación y Onboarding
- **Login:** Integración con Google Auth vía Firebase.
- **Acceso rápido:** Modo de prueba (Test Login) para roles de alumno y profesor.
- **Onboarding:** Pantalla de selección de rol ("Quiero Aprender" vs "Quiero Enseñar") para nuevos usuarios, guardando el perfil en Firestore.

### 3.2. Mercado de Profesores (Home)
- Visualización de tarjetas de profesores con fotos, valoración, especialidad y precio por clase.
- Filtros de búsqueda y navegación intuitiva.

### 3.3. Aula Virtual (Classroom) - El Núcleo
- **Tablero Interactivo:** Basado en `Chessground` y `chess.js` para validación de movimientos.
- **Sincronización:** Reflejo inmediato de movimientos entre profesor y alumno usando Firestore.
- **Comunicación:** Integración de Audio y Video en tiempo real mediante LiveKit.
- **Herramientas de Análisis:** Capacidad de mover piezas libremente para explicar conceptos tácticos y estratégicos.

### 3.4. Dashboards Personalizados
- **Profesor:** Vista de ganancias totales, número de clases impartidas, lista de alumnos y gestión de disponibilidad.
- **Alumno:** Calendario de clases próximas, historial de clases y balance de wallet.

### 3.5. Sistema Económico (Wallet)
- Visualización de saldo en moneda local (EUR/USD).
- Cálculo de comisiones automático al finalizar una clase.
- Interfaz premium para "Retirar Fondos" (simulado en MVP).

### 3.6. Chat en Tiempo Real
- Mensajería directa entre alumnos y profesores integrada para coordinación.

## 4. Diseño y Estética
La plataforma sigue un lenguaje de diseño **Premium y Moderno**:
- **Estilo:** Dark mode profundo (`#161512`) con acentos en dorado (`gold`) y texto en gris claro (`#bababa`).
- **IU:** Glassmorphism (efectos de cristal translúcido) con desenfoque de fondo y bordes sutiles.
- **Animaciones:** Transiciones de página y micro-interacciones fluidas usando `Framer Motion`.

## 5. Stack Tecnológico
| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18, Vite 5/6 |
| **Estilos** | Tailwind CSS v3 |
| **Backend/DB** | Firebase Firestore |
| **Autenticación** | Firebase Auth |
| **Videoconferencia**| LiveKit |
| **Lógica de Ajedrez**| Chess.js (v1.4.0) & Chessground |
| **Internacionalización**| i18next & react-i18next |

## 6. Roadmap / Próximos Pasos
1. **Integración de Pagos:** Conexión real con Stripe para recargas de saldo y pagos a profesores.
2. **Sistema de Notificaciones:** Avisos push e email para recordatorios de clases.
3. **Grabación de Clases:** Almacenamiento y revisión de sesiones previas en formato PGN o video.
4. **Base de Datos de Aperturas:** Herramienta interactiva para que el profesor asigne repertorios específicos a sus alumnos.
