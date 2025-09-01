# PatitoClassbook
# Libro de Clases — Jardín Patito

Pequeño **libro de clases virtual** para jardín infantil, 100% **sin backend**.  
Permite **marcar asistencia**, **registrar observaciones** y **generar un reporte diario** listo para imprimir/guardar como PDF.  
Funciona solo con **HTML + CSS + JavaScript + JSON** y **persistencia en `localStorage`** del navegador.

---

## ✨ Funcionalidades

- **Listado de alumnos por sala** con foto (o iniciales si no hay imagen).
- **Asistencia** por alumno con 4 estados: Presente / Ausente / Tarde / Justificado.
- **Observaciones** por alumno (marcables como *importantes*).
- **Editar / Borrar observaciones** desde la tarjeta o el panel derecho.
- **Desmarcar asistencia** (clic de nuevo en el botón activo o “Quitar marca”).
- **Filtros y búsqueda** (por nombre, estado, “con observaciones”).
- **Resumen** en vivo: contadores P/A/T/J.
- **Importar/Exportar JSON** del día (para respaldo o traspaso).
- **Reporte diario** imprimible que incluye encabezado, tabla de asistencia y observaciones.
- **Imprime solo el reporte**: el resto de la UI no aparece en papel.

---

## 🧱 Tech / Dependencias

- **Bootstrap 5** (CDN) para estilos y componentes básicos.
- **Vanilla JS** (sin frameworks) en `app.js`.
- **`localStorage`** para persistencia por **sala+fecha** en el dispositivo.
- **`alumnos.json`** como catálogo de salas y alumnos de prueba.


---

## 📁 Estructura del repo

- `index.html`: Página principal con la interfaz del libro de clases.
- `styles.css`: Estilos personalizados del proyecto.
- `app.js`: Lógica en JavaScript para asistencia y observaciones.
- `alumnos.json`: Datos de ejemplo de salas y alumnos.
