# **Documentación del Proyecto: Planificación de Servicios**

## **Índice**
1. [Descripción del Proyecto](#descripcion-del-proyecto)
2. [Tecnologías Utilizadas](#tecnologias-utilizadas)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación](#instalacion)
5. [Variables de Entorno](#variables-de-entorno)
6. [Uso](#uso)
7. [Funcionalidades Principales](#funcionalidades-principales)
8. [Despliegue en Vercel](#despliegue-en-vercel)
9. [Contribuciones](#contribuciones)

---

## 1. **Descripción del Proyecto**

Este proyecto es una **aplicación de planificación de servicios** diseñada para gestionar y visualizar servicios a lo largo del año. Los usuarios pueden crear, editar y ver servicios con detalles como cliente, móvil, chofer, origen, destino, horario y observaciones. La aplicación está desarrollada con **React** en el frontend y **Supabase** como base de datos, con integración en **Vercel** para el despliegue.

## 2. **Tecnologías Utilizadas**

- **React**: Framework para la construcción de interfaces de usuario.
- **Supabase**: Base de datos PostgreSQL con API REST y autenticación.
- **Vercel**: Plataforma de despliegue para frontend.
- **UUID**: Para generar identificadores únicos.
- **Slick Carousel**: Carrusel utilizado para la navegación entre los días del año.

## 3. **Requisitos Previos**

Antes de iniciar, asegúrate de tener lo siguiente instalado en tu entorno:

- [Node.js](https://nodejs.org/) (v12 o superior)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [Cuenta en Supabase](https://supabase.com/) con un proyecto configurado

## 4. **Instalación**

Sigue los siguientes pasos para instalar y configurar el proyecto localmente:

1. Clona este repositorio:

    ```bash
    git clone https://github.com/usuario/repo-planificacion-servicios.git
    cd repo-planificacion-servicios
    ```

2. Instala las dependencias necesarias:

    ```bash
    npm install
    ```

3. Crea un archivo `.env.local` en la raíz del proyecto y agrega tus **variables de entorno** necesarias (ver sección [Variables de Entorno](#variables-de-entorno)).

4. Inicia el servidor de desarrollo:

    ```bash
    npm start
    ```

El proyecto estará disponible en `http://localhost:3000`.

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
