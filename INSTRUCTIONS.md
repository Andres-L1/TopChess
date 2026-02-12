# AJEDREZTOPCHESS - Instrucciones de Instalación

Sigue estos pasos para ejecutar la plataforma en tu máquina local.

## 1. Inicialización y Dependencias

# 1. Instalación y Dependencias

Si has clonado este repositorio o tienes los archivos generados:

```bash
# Instalar todas las dependencias definidas en package.json (Recomendado para asegurar versiones estables)
npm install
```

> **Nota importante:** El proyecto está configurado para usar versiones estables de Vite (v6) y Tailwind (v3) para evitar conflictos. No actualices manualmente las dependencias a menos que sepas lo que haces.

> **Nota:** Si experimentas errores de compilación con las versiones más recientes (Vite 7, React 19, Tailwind 4), considera usar versiones estables (Vite 5/6, React 18, Tailwind 3).

## 2. Configuración de Archivos

Asegúrate de que los siguientes archivos estén en su lugar (ya generados):
- `src/firebase.js`: Configura tus credenciales reales de Firebase.
- `src/App.jsx`: Rutas principales.
- `src/pages/`: Home.jsx, Classroom.jsx, TeacherDashboard.jsx.
- `src/components/`: Board.jsx.
- `src/index.css`: Estilos globales y configuración de colores.
- `tailwind.config.js`: Configuración de rutas de contenido.

## 3. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## 4. Uso del MVP

1. **Home:** Verás la lista de profesores (simulada/desde Firebase).
2. **Roles:** Usa el selector en el Navbar para cambiar entre "Soy Alumno" y "Soy Profesor".
   - Como **Profesor**: Ve a tu Dashboard o entra a tu Aula para mover piezas.
   - Como **Alumno**: Entra al Aula para ver la clase.
3. **Aula:** El tablero se sincroniza vía Firebase. El audio es simulado (Mock Token) para este MVP.
4. **Dashboard:** "Terminar Clase" calcula tus ganancias según la tabla de comisiones.

## Solución de Problemas

- **Advertencias en IDE:** Si ves advertencias sobre `@tailwind`, asegúrate de tener instalada la extensión "Tailwind CSS IntelliSense" y reinicia VS Code. El archivo `postcss.config.js` ya está incluido para soportarlo.
- **Errores de Construcción (Build):**
  - Asegúrate de usar Node.js v18 (LTS) o superior.
  - Si `npm run build` falla, intenta ejecutar `npm run dev` ya que el servidor de desarrollo es más permisivo.
  - Evita espacios en la ruta del proyecto si es posible (ej. cambiar "App TopChess" a "App-TopChess").
