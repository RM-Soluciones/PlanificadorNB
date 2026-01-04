# 📋 Instrucciones para Configurar la Base de Datos

Para que las nuevas funcionalidades funcionen correctamente, necesitas crear las tablas de **choferes** y **móviles** en tu base de datos Supabase.

## 🔧 Pasos para Configurar

### 1. Acceder a Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto
3. Ve a tu proyecto: `zynbyczhbsplsyfbuvwu`

### 2. Ejecutar el Script SQL
1. En el panel lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en **"+ New Query"** para crear una nueva consulta
3. Abre el archivo `setup_database.sql` que se encuentra en la raíz del proyecto
4. **Copia TODO el contenido** del archivo
5. **Pégalo** en el editor SQL de Supabase
6. Haz clic en **"Run"** o presiona `Ctrl + Enter` para ejecutar el script

### 3. Verificar que se Crearon Correctamente
Después de ejecutar el script, deberías ver:
- ✅ Tablas `choferes` y `moviles` creadas
- ✅ Políticas RLS (Row Level Security) habilitadas
- ✅ Datos iniciales insertados (choferes y móviles que ya tenías)

Para verificar, puedes ejecutar:
```sql
SELECT * FROM choferes;
SELECT * FROM moviles;
```

## 🎯 Nuevas Funcionalidades

Una vez configurada la base de datos, tu aplicación tendrá 3 pestañas:

### 📅 1. Planificador (Pestaña Principal)
- Vista del calendario de servicios
- Agregar/editar/eliminar servicios
- Filtros por chofer y móvil
- Generación de informes PDF
- **Funciona igual que antes**

### 🚐 2. Gestión de Recursos
**Nueva funcionalidad** para administrar choferes y móviles:
- ➕ **Agregar** nuevos choferes y móviles
- ✏️ **Editar** nombres existentes
- 🗑️ **Eliminar** recursos que ya no uses
- Los cambios se reflejan automáticamente en el planificador

### 🗑️ 3. Administración de Datos
**Nueva funcionalidad** para limpiar datos antiguos:
- 📊 Ver **estadísticas** de uso (total de servicios, espacio usado)
- 📆 Ver servicios agrupados **por mes**
- 🔍 **Filtrar** servicios por mes específico
- ☑️ **Seleccionar** servicios individuales o todos
- 🗑️ **Eliminar** servicios seleccionados o meses completos
- Útil cuando el almacenamiento se llena

## 🔐 Importante sobre Seguridad

El script actual permite que cualquier usuario pueda leer y escribir en las tablas. **Para producción**, considera modificar las políticas RLS para que solo usuarios autenticados puedan modificar datos:

```sql
-- Ejemplo: Solo permitir escritura a usuarios autenticados
CREATE POLICY "Enable insert for authenticated users only" ON public.choferes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 🚀 Iniciar la Aplicación

Una vez ejecutado el script SQL:

```bash
npm start
```

La aplicación se abrirá en `http://localhost:3000`

## ⚠️ Solución de Problemas

### Error: "relation choferes does not exist"
- **Causa**: No se ejecutó el script SQL
- **Solución**: Sigue los pasos 1-2 arriba

### No aparecen choferes/móviles en los selectores
- **Causa**: Las tablas están vacías o hay error en la consulta
- **Solución**: Verifica en SQL Editor que las tablas tengan datos:
  ```sql
  SELECT COUNT(*) FROM choferes;
  SELECT COUNT(*) FROM moviles;
  ```

### Error de permisos (RLS)
- **Causa**: Las políticas RLS están bloqueando el acceso
- **Solución**: Verifica que las políticas se crearon correctamente en la tabla "Authentication" > "Policies"

## 📞 Contacto

Si tienes problemas con la configuración, revisa:
1. Que el script SQL se ejecutó sin errores
2. Que las tablas existen en "Table Editor"
3. Que las políticas RLS están activas

---

**¡Listo!** Tu aplicación ahora tiene un sistema completo de gestión de recursos y limpieza de datos. 🎉
