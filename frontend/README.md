# Gestor de Citas para Estudio de Tatuajes 'TOPARPA TATTOO'

Este proyecto es una aplicación web full-stack diseñada para administrar eficientemente las operaciones de un estudio de tatuajes. Permite la gestión de clientes, citas, gastos y la generación de reportes financieros.

## ✨ Características Principales

- **Autenticación de Usuarios:** Sistema de inicio de sesión seguro para proteger el acceso a la aplicación. (La funcionalidad de registro de nuevos usuarios está contemplada pero pendiente de implementación completa en el frontend).
- **Gestión de Clientes (CRUD):**
    - Crear, leer, actualizar y eliminar perfiles de clientes.
    - Almacenamiento de información de contacto y notas relevantes.
- **Gestión de Citas (CRUD):**
    - Agendar nuevas citas asociadas a clientes.
    - Visualización de citas en un calendario interactivo (mes y agenda).
    - Editar detalles de citas existentes (fecha, hora, duración, artista, descripción, precio, estado de pago).
    - Marcar citas como completadas, canceladas o no asistidas.
    - Control de conflictos horarios al agendar o modificar citas.
- **Gestión de Gastos (CRUD):**
    - Registrar nuevos gastos con descripción, monto, categoría y fecha.
    - Listar, editar y eliminar gastos existentes. (La asociación de gastos a un `user_id` específico está comentada en el código backend y podría implementarse a futuro).
- **Dashboard Principal:**
    - Resumen financiero del mes actual (ingresos, gastos, beneficio).
    - Conteo de clientes totales y citas para el día actual.
    - Listado de citas programadas para hoy.
    - Listado de citas próximas con saldo pendiente.
    - Accesos directos a funciones comunes.
- **Generación de Reportes:**
    - Generar reportes financieros detallados (diarios y mensuales).
    - Exportar reportes como imágenes PNG.
- **Interfaz Responsiva:** Diseño adaptable a diferentes tamaños de pantalla.
- **Notificaciones:** Uso de toasts para feedback al usuario sobre operaciones.

## 💻 Tecnologías Utilizadas

### Backend (`/backend`)

- **Node.js:** Entorno de ejecución para JavaScript del lado del servidor.
- **Express.js:** Framework web para Node.js, utilizado para construir la API REST.
- **PostgreSQL:** Sistema de gestión de bases de datos relacional.
- **`pg` (node-postgres):** Cliente de PostgreSQL para Node.js.
- **`bcrypt`:** Librería para el hashing de contraseñas.
- **`jsonwebtoken` (JWT):** Para la generación y verificación de tokens de autenticación.
- **`cors`:** Middleware para habilitar Cross-Origin Resource Sharing.
- **`dotenv`:** Para la gestión de variables de entorno.
- **`date-fns`:** Librería para la manipulación avanzada de fechas y horas.
- **`nodemon`:** Herramienta para el desarrollo que reinicia automáticamente el servidor ante cambios.

### Frontend (`/frontend`)

- **React:** Librería para construir interfaces de usuario.
- **Vite:** Herramienta de frontend de próxima generación para desarrollo y construcción rápidos.
- **React Router DOM:** Para la gestión de rutas en la aplicación de una sola página (SPA).
- **Axios:** Cliente HTTP basado en promesas para realizar peticiones a la API.
- **Tailwind CSS:** Framework CSS de utilidad primero para un diseño rápido y personalizado.
- **`date-fns`:** Para formateo y manipulación de fechas en el cliente.
- **`react-big-calendar`:** Componente de calendario para mostrar y gestionar citas.
- **`react-datepicker`:** Componente para la selección de fechas y horas.
- **`react-toastify`:** Para mostrar notificaciones (toasts) al usuario.
- **`react-confirm-alert`:** Para mostrar diálogos de confirmación.
- **`lucide-react`:** Colección de iconos SVG.
- **`html2canvas`:** Para capturar capturas de pantalla de elementos HTML (usado en reportes).
- **`react-currency-input-field`:** Componente para inputs de moneda formateados.
- **ESLint:** Para el análisis estático de código y mantenimiento de la calidad.

## 📁 Estructura del Proyecto (Simplificada)

/
├── backend/
│   ├── controllers/      # Lógica de negocio para cada ruta
│   ├── middleware/       # Middlewares (ej. autenticación)
│   ├── routes/           # Definición de rutas de la API
│   ├── config/           # Configuración (ej. conexión a BD)
│   ├── server.js         # Punto de entrada del backend
│   └── package.json
│
└── frontend/
├── src/
│   ├── assets/         # Recursos estáticos (imágenes, etc. - si aplica)
│   ├── components/     # Componentes reutilizables de React
│   ├── contexts/       # Contextos de React (ej. AuthContext)
│   ├── pages/          # Componentes de página (vistas principales)
│   ├── services/       # Lógica para interactuar con la API (api.js, authService.js, etc.)
│   ├── App.jsx         # Componente raíz de la aplicación
│   ├── main.jsx        # Punto de entrada del frontend
│   └── index.css       # Estilos globales y Tailwind
├── public/             # Archivos públicos (ej. index.html, favicon)
└── package.json


## ⚙️ Pre-requisitos

- Node.js (se recomienda versión LTS, v18.x o superior según `package.json` del backend y frontend)
- npm (generalmente viene con Node.js) o Yarn
- PostgreSQL (instalado y un servidor corriendo)

## 🚀 Instalación y Configuración

Sigue estos pasos para poner en marcha el proyecto en tu entorno local:

### 1. Clonar el Repositorio

git clone [https://github.com/AlexJ236/Gestor-de-Citas-para-Estudio-de-Tatuajes-TOPARPA-TATTOO.git](https://github.com/AlexJ236/Gestor-de-Citas-para-Estudio-de-Tatuajes-TOPARPA-TATTOO.git)
cd TOPARPA GESTION

### 2. Configuración del Backend

cd backend
npm install

### Crea un archivo .env en la raíz de la carpeta /backend y configura las siguientes variables de entorno:

DB_USER=tu_usuario_postgres
DB_HOST=localhost
DB_DATABASE=toparpa_tattoo_db
DB_PASSWORD=tu_contraseña_postgres
DB_PORT=5432
JWT_SECRET=un_secreto_muy_largo_y_dificil_de_adivinar_para_jwt # ¡CAMBIA ESTO!
PORT=5001

### Configuración de la Base de Datos:

Asegúrate de que tu servidor PostgreSQL esté corriendo.

Crea una base de datos con el nombre que especificaste en DB_DATABASE (ej. toparpa_tattoo_db).

IMPORTANTE: Ejecuta el script SQL proporcionado (o que hayas creado) para definir la estructura de las tablas en tu base de datos. Este script debe incluir:

- users: id (SERIAL PRIMARY KEY), username (VARCHAR UNIQUE NOT NULL), password_hash (VARCHAR NOT NULL), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP).
- clients: id (SERIAL PRIMARY KEY), name (VARCHAR NOT NULL), phone (VARCHAR), email (VARCHAR UNIQUE), notes (TEXT), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP).
- appointments: id (SERIAL PRIMARY KEY), client_id (INTEGER REFERENCES clients(id) ON DELETE CASCADE), user_id (INTEGER REFERENCES users(id)), appointment_time (TIMESTAMP WITH TIME ZONE NOT NULL), duration_minutes (INTEGER DEFAULT 60), description (TEXT), artist (VARCHAR), total_price (NUMERIC(10,0)), amount_paid (NUMERIC(10,0) DEFAULT 0), payment_status (VARCHAR(20) DEFAULT 'pending'), status (VARCHAR(20) DEFAULT 'scheduled'), deposit_paid_at (TIMESTAMP WITH TIME ZONE), completed_at (TIMESTAMP WITH TIME ZONE), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP). (Considera añadir updated_at también a appointments si aún no lo has hecho).
- expenses: id (SERIAL PRIMARY KEY), description (VARCHAR NOT NULL), amount (NUMERIC(10,0) NOT NULL), category (VARCHAR), expense_date (DATE NOT NULL), user_id (INTEGER REFERENCES users(id) NULL), created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP), updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP). (La columna user_id en expenses es opcional y actualmente no se está utilizando activamente en la lógica de creación del backend).

### Ejemplo de cómo ejecutar un script SQL con psql (reemplaza los placeholders):

psql -U tu_usuario_postgres -d toparpa_tattoo_db -f ruta/a/tu/script_tablas.sql

### 3. Configuración del Frontend

cd ../frontend
npm install

El frontend está configurado para conectarse al backend en http://localhost:5001/api. Si necesitas cambiar esto, modifica el archivo frontend/src/services/api.js.

### ධ Scripts Disponibles

- Desde la carpeta /backend:
npm start: Inicia el servidor de backend en modo producción.
npm run dev: Inicia el servidor de backend en modo desarrollo con nodemon (reinicia automáticamente con los cambios).

- Desde la carpeta /frontend:
npm run dev: Inicia el servidor de desarrollo del frontend (generalmente en http://localhost:5173).
npm run build: Compila la aplicación de frontend para producción (en la carpeta /frontend/dist).
npm run lint: Ejecuta ESLint para analizar el código del frontend.
npm run preview: Sirve la build de producción localmente para previsualización.

### 🔑 Autenticación

La autenticación se maneja mediante JSON Web Tokens (JWT).
Al iniciar sesión, el backend genera un token que el frontend almacena en sessionStorage.
Todas las peticiones subsecuentes a rutas protegidas de la API desde el frontend incluyen este token en la cabecera Authorization como un Bearer token.
El backend verifica este token para autorizar el acceso.
La funcionalidad de registro de nuevos usuarios (POST /api/auth/register) está implementada en el backend (authController.js), pero la llamada desde el frontend (authService.js) está marcada como TODO y no hay una interfaz de usuario para ello actualmente.

### 📄 Endpoints de la API (Resumen)

Todos los endpoints están prefijados con /api. Las rutas que gestionan datos de clientes, citas y gastos requieren autenticación.

Autenticación (/auth):
POST /login: Iniciar sesión.
POST /register: Registrar un nuevo usuario.
Clientes (/clients):
GET /: Obtener todos los clientes.
POST /: Crear un nuevo cliente.
GET /:id: Obtener un cliente por ID.
PUT /:id: Actualizar un cliente.
DELETE /:id: Eliminar un cliente.
Citas (/appointments):
GET /: Obtener todas las citas.
POST /: Crear una nueva cita.
GET /:id: Obtener una cita por ID.
PUT /:id: Actualizar una cita.
DELETE /:id: Eliminar una cita.
Gastos (/expenses):
GET /: Obtener todos los gastos (acepta query params startDate, endDate).
POST /: Crear un nuevo gasto.
GET /:id: Obtener un gasto por ID.
PUT /:id: Actualizar un gasto.
DELETE /:id: Eliminar un gasto.
Reportes (/reports):
GET /summary: Obtener resumen financiero (query params year, month).
GET /daily: Obtener datos para reporte diario (query params year, month, day).
GET /monthly: Obtener datos para reporte mensual (query params year, month).

### 📝 Licencia

Este proyecto se distribuye bajo la Licencia ISC. Puedes encontrar los detalles de la licencia en los archivos package.json de cada subdirectorio (frontend y backend) o añadir un archivo LICENSE en la raíz del proyecto con el texto completo de la licencia.
-------------------------------------------------------------------------------------------------------------------------------------
¡Hecho por AlexJ236!