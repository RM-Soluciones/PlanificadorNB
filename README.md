# **Planificador de Servicios - Empresa de Logística**

## **Índice**
1. [Descripción del Proyecto](#descripcion-del-proyecto)
2. [Nuevas Funcionalidades](#nuevas-funcionalidades)
3. [Tecnologías Utilizadas](#tecnologias-utilizadas)
4. [Requisitos Previos](#requisitos-previos)
5. [Instalación](#instalacion)
6. [Configuración de Base de Datos](#configuracion-de-base-de-datos)
7. [Uso](#uso)
8. [Funcionalidades Principales](#funcionalidades-principales)
9. [Despliegue en Vercel](#despliegue-en-vercel)
10. [Contribuciones](#contribuciones)

---

## 1. **Descripción del Proyecto**

Este proyecto es una **aplicación de planificación de servicios** diseñada para empresas de logística. Permite gestionar y visualizar servicios a lo largo del año con detalles como cliente, móvil, chofer, origen, destino, horario y observaciones. La aplicación está desarrollada con **React** en el frontend y **Supabase** como base de datos.

### **Características Principales:**
- 📅 Planificación visual de servicios por días
- 🚐 Gestión dinámica de choferes y móviles
- 🗑️ Administración de datos y limpieza de almacenamiento
- 📊 Informes PDF personalizados
- 🔄 Actualizaciones en tiempo real
- 🎨 Interfaz responsive y amigable

---

## 2. **Nuevas Funcionalidades** ⭐

### **Sistema de 3 Pestañas (Solo para usuarios autenticados):**

#### 📅 **Pestaña 1: Planificador**
- Vista de calendario con servicios
- Agregar/editar/eliminar servicios
- Filtros por chofer y móvil
- Semáforo de disponibilidad de recursos
- Generación de informes PDF

#### 🚐 **Pestaña 2: Gestión de Recursos**
- **Agregar** nuevos choferes y móviles
- **Editar** nombres de recursos existentes
- **Eliminar** recursos obsoletos
- Gestión dinámica sin necesidad de modificar código
- Actualización automática en el planificador

#### 🗑️ **Pestaña 3: Administración de Datos**
- **Estadísticas** de uso y almacenamiento
- **Vista por meses** de servicios
- **Filtros** por períodos específicos
- **Selección múltiple** de servicios
- **Eliminación masiva** para liberar espacio
- Confirmaciones de seguridad

---

## 3. **Tecnologías Utilizadas**

- **React 18**: Framework para interfaces de usuario
- **Supabase**: Base de datos PostgreSQL con API REST
- **React-Select**: Selectores mejorados con búsqueda
- **jsPDF**: Generación de informes PDF
- **date-fns**: Manipulación de fechas
- **React Toastify**: Notificaciones elegantes
- **CSS3**: Estilos responsive modernos

---

## 4. **Requisitos Previos**

Antes de iniciar, asegúrate de tener:

- [Node.js](https://nodejs.org/) (v14 o superior)
- [npm](https://www.npmjs.com/) (viene con Node.js)
- [Cuenta en Supabase](https://supabase.com/) con un proyecto configurado
- PowerShell con permisos de ejecución (Windows)

---

## 5. **Instalación**

### Paso 1: Clonar el Proyecto

```bash
git clone https://github.com/usuario/repo-planificacion-servicios.git
cd PlanificadorNB
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Supabase

Actualiza las credenciales en `src/supabaseClient.js`:

```javascript
const supabaseUrl = 'TU_URL_DE_SUPABASE';
const supabaseAnonKey = 'TU_CLAVE_ANONIMA';
```

---

## 6. **Configuración de Base de Datos** 🔧

⚠️ **MUY IMPORTANTE**: Debes ejecutar el script SQL antes de usar las nuevas funcionalidades.

### Paso 1: Acceder a Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Abre tu proyecto
3. Ve al **SQL Editor**

### Paso 2: Ejecutar el Script
1. Abre el archivo `setup_database.sql` del proyecto
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"**

### Paso 3: Verificar
Ejecuta en el SQL Editor:

```sql
SELECT * FROM choferes;
SELECT * FROM moviles;
```

Deberías ver las listas de choferes y móviles cargadas.

📖 **Para más detalles, consulta:** [`INSTRUCCIONES_SETUP.md`](INSTRUCCIONES_SETUP.md)

---

## 7. **Uso**

### Iniciar la Aplicación

```bash
npm start
```

La aplicación se abrirá en `http://localhost:3000`

### Iniciar Sesión

- Haz clic en **"Iniciar Sesión"**
- Contraseña por defecto: **`admin123`**
- Una vez autenticado, verás las 3 pestañas principales

### Navegación

#### 📅 Pestaña Planificador
1. **Ver servicios**: Navega por los días del año
2. **Agregar servicio**: Clic en "+ Servicio" en cualquier día
3. **Editar servicio**: Clic en una tarjeta de servicio
4. **Eliminar servicio**: En el modal, clic en "Eliminar"
5. **Filtrar**: Usa los selectores de chofer/móvil
6. **Generar PDF**: Completa fechas y filtros, clic en "Generar Informe"

#### 🚐 Pestaña Gestión de Recursos
1. **Agregar**: Clic en "+ Agregar Chofer/Móvil"
2. **Editar**: Clic en ✏️ al lado del nombre
3. **Eliminar**: Clic en 🗑️ (con confirmación)

#### 🗑️ Pestaña Administración de Datos
1. **Ver estadísticas**: Tarjetas superiores
2. **Filtrar por mes**: Selector de mes
3. **Seleccionar**: Checks individuales o "Seleccionar Todos"
4. **Eliminar**: Botones de eliminación (con confirmación)

---

## 8. **Funcionalidades Principales**

## 5. **Variables de Entorno**

Debes configurar las siguientes variables de entorno en el archivo `.env.local` para conectar la aplicación con **Supabase**:

```plaintext
REACT_APP_SUPABASE_URL=https://tusupabaseurl.supabase.co
REACT_APP_SUPABASE_KEY=tuapisecretkey
```

### Obtener las claves:

1. **Supabase URL** y **Supabase Key** se encuentran en tu proyecto de Supabase en el panel de control, bajo la sección **Settings > API**.

## 6. **Uso**

### Visualizar el calendario:
- Al abrir la aplicación, verás un carrusel que permite navegar entre los **días del mes**. Puedes avanzar y retroceder entre los meses y los días utilizando los botones de navegación.

### Agregar un servicio:
1. Haz clic en el botón `+ Servicio` en cualquier día del calendario.
2. Completa el formulario con los siguientes datos:
   - Cliente
   - Servicio
   - Móvil (puedes agregar más móviles si es necesario)
   - Chofer (puedes agregar más choferes si es necesario)
   - Origen y Destino
   - Horario
   - Observaciones
3. Guarda el servicio.

### Editar o ver detalles de un servicio:
1. Cada servicio tiene botones para ver los detalles y editar la información.
2. Puedes marcar un servicio como **finalizado** al hacer clic en el botón correspondiente.

## 7. **Funcionalidades Principales**

### Autenticación y Seguridad
- Supabase está configurado para controlar el acceso a los datos. Puedes personalizar las políticas de seguridad en **Supabase** si lo deseas.

### Carrusel de días:
- La aplicación muestra un carrusel que te permite navegar entre los días del mes y los meses del año. Los datos de los servicios se muestran en cada tarjeta de día.

### Gestión de servicios:
- Los servicios están asociados con fechas específicas (día, mes, año) y puedes agregar información relevante como cliente, choferes, móviles, origen, destino y horario.

### Resumen de servicios:
- Los servicios pueden ser visualizados en un modal detallado y editados en cualquier momento.

### Backend con Supabase:
- **Supabase** almacena toda la información sobre los servicios. Las operaciones CRUD (crear, leer, actualizar, eliminar) se manejan a través de su API REST.

## 8. **Despliegue en Vercel**

Para desplegar esta aplicación en **Vercel**, sigue estos pasos:

1. **Sube tu repositorio a GitHub** (si aún no lo has hecho).
2. **Vincula el proyecto con Vercel**:
    - Ve a [Vercel](https://vercel.com/) y crea un nuevo proyecto.
    - Vincula tu repositorio de GitHub.
    - Configura las **variables de entorno** en Vercel (`REACT_APP_SUPABASE_URL` y `REACT_APP_SUPABASE_KEY`).
3. **Despliega el proyecto**:
    - Vercel realizará el despliegue automáticamente cada vez que hagas un push a tu repositorio.
    - Una vez desplegado, la aplicación estará disponible en una URL del tipo `https://tu-proyecto.vercel.app`.

## 9. **Contribuciones**

Si deseas contribuir al proyecto, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una rama con tu función: `git checkout -b mi-nueva-funcion`.
3. Haz commit de tus cambios: `git commit -m 'Agregar nueva función'`.
4. Sube los cambios: `git push origin mi-nueva-funcion`.
5. Crea un **pull request** para que tus cambios sean revisados.

---
