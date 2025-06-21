# 🚀 GUÍA COMPLETA DE MIGRACIÓN STOCKIT

## 📋 **Resumen del Proceso**

Esta guía te permitirá migrar el proyecto StockIT de tu PC de casa a la PC de la oficina de manera completamente automatizada.

---

## 🏠 **PARTE 1: PREPARACIÓN EN PC DE CASA**

### 📦 **Paso 1: Ejecutar Migración Automática**

1. **Abre una terminal en la carpeta raíz de StockIT**
2. **Ejecuta el script de migración:**
   ```cmd
   migrar_proyecto.bat
   ```

### 🎯 **Qué hace este script:**
- ✅ Verifica la integridad del proyecto
- ✅ Crea backup automático de la base de datos
- ✅ Copia todos los archivos necesarios (excluyendo temporales)
- ✅ Genera scripts de instalación automática
- ✅ Crea instrucciones detalladas paso a paso
- ✅ Organiza todo en una estructura limpia

### 📁 **Resultado:**
Se creará una carpeta con todo lo necesario en:
```
C:\Temp\StockIT_Migracion_YYYYMMDD_HHMM\
├── StockIT\                          (Código fuente limpio)
├── Database\                         (Backup de BD)
│   └── StockIT_Backup_YYYYMMDD.bak
├── Scripts\                          (Scripts automáticos)
│   ├── instalar_en_oficina.bat      (Instalación automática)
│   └── crear_backup.sql             (Script de backup)
├── Config\                           (Configuraciones)
│   ├── configuracion_trabajo.md     (Configuración detallada)
│   ├── design-UX-UI-guide.md        (Guía de diseño)
│   └── docs\                        (Documentación)
└── 🚀_INSTRUCCIONES_INSTALACION.txt  (Guía paso a paso)
```

### 💾 **Paso 2: Copiar a USB o Enviar por Correo**
- Copia toda la carpeta `StockIT_Migracion_YYYYMMDD_HHMM` a USB
- O comprímela y envíala por correo/OneDrive

---

## 🏢 **PARTE 2: INSTALACIÓN EN PC DE LA OFICINA**

### 🔧 **Requisitos Previos:**
- [ ] Windows 10/11
- [ ] Conexión a Internet (para descargar Node.js y SQL Server)

### 📋 **Paso 1: Instalar Dependencias**

#### **Node.js:**
1. Descargar desde: https://nodejs.org
2. Instalar con configuración por defecto
3. Verificar: abrir cmd y ejecutar `node --version`

#### **SQL Server Express:**
1. Descargar desde Microsoft
2. Instalar con configuración por defecto
3. Instancia: `.\SQLEXPRESS` o `NOMBREPC\SQLEXPRESS`

#### **SQL Server Management Studio (Opcional pero recomendado):**
1. Descargar desde Microsoft
2. Para gestionar la base de datos fácilmente

### 🚀 **Paso 2: Instalación Automática**

1. **Copia la carpeta de migración a la PC de destino**
2. **Ejecuta el instalador automático:**
   ```cmd
   Scripts\instalar_en_oficina.bat
   ```

### 🎯 **Qué hace el instalador:**
- ✅ Verifica que Node.js esté instalado
- ✅ Crea el directorio `C:\Proyectos\`
- ✅ Copia todos los archivos del proyecto
- ✅ Instala automáticamente las dependencias del backend
- ✅ Instala automáticamente las dependencias del frontend
- ✅ Te guía para los pasos finales

### 🗄️ **Paso 3: Restaurar Base de Datos**

#### **Opción A: Con SQL Server Management Studio**
1. Abrir SSMS
2. Conectar a `.\SQLEXPRESS`
3. Clic derecho en "Bases de datos" → "Restaurar base de datos"
4. Seleccionar "Dispositivo" → Buscar archivo `Database\StockIT_Backup_YYYYMMDD.bak`
5. Cambiar nombre a `StockIT`
6. Clic en "Aceptar"

#### **Opción B: Con línea de comandos**
```cmd
sqlcmd -S .\SQLEXPRESS -E -Q "RESTORE DATABASE StockIT FROM DISK='RUTA_COMPLETA\Database\StockIT_Backup_YYYYMMDD.bak'"
```

### ⚙️ **Paso 4: Configurar Variables de Entorno**

#### **Crear archivo `backend\.env`:**
```env
# Configuración Base de Datos SQL Server
DB_HOST=NOMBREPC\SQLEXPRESS
DB_PORT=1433
DB_NAME=StockIT
DB_USER=tu_usuario_sql
DB_PASSWORD=tu_password_sql
DB_INTEGRATED=true

# Configuración del Servidor
PORT=8000
NODE_ENV=development

# JWT para autenticación
JWT_SECRET=StockIT_Oficina_2024_ClaveSegura123
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
```

#### **Crear archivo `frontend\.env`:**
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_TITLE=StockIT - Sistema de Inventario
```

### 🚀 **Paso 5: Ejecutar StockIT**

#### **Terminal 1 - Backend:**
```cmd
cd C:\Proyectos\StockIT\backend
npm run dev
```

#### **Terminal 2 - Frontend:**
```cmd
cd C:\Proyectos\StockIT\frontend
npm run dev
```

### 🌐 **Paso 6: Verificar Funcionamiento**
- Backend: http://localhost:8000/api/dashboard/stats
- Frontend: http://localhost:3000

---

## 🔍 **PARTE 3: VERIFICACIÓN AUTOMÁTICA**

### ✅ **Script de Verificación**
Para verificar que todo funciona correctamente:
```cmd
verificar_migracion.bat
```

### 🎯 **Qué verifica:**
- ✅ Estructura de directorios
- ✅ Node.js instalado
- ✅ Dependencias instaladas
- ✅ Archivos .env creados
- ✅ SQL Server funcionando
- ✅ Base de datos StockIT disponible
- ✅ Backend respondiendo
- ✅ Frontend respondiendo

---

## 🆘 **SOLUCIÓN DE PROBLEMAS COMUNES**

### ❌ **Error: No se puede conectar a la base de datos**
**Solución:**
1. Verificar que SQL Server Express esté ejecutándose
2. Verificar el nombre de la PC en `DB_HOST`
3. Para obtener el nombre: cmd → `hostname`
4. Cambiar `DB_HOST=NOMBREPC\SQLEXPRESS`

### ❌ **Error: Puerto ocupado**
**Solución:**
1. Cambiar `PORT=8001` en `backend\.env`
2. Cambiar `VITE_API_URL=http://localhost:8001/api` en `frontend\.env`

### ❌ **Error: Módulos no encontrados**
**Solución:**
```cmd
cd C:\Proyectos\StockIT\backend
npm install

cd C:\Proyectos\StockIT\frontend  
npm install
```

### ❌ **Error: Login no funciona**
**Solución:**
1. Verificar `JWT_SECRET` en `backend\.env`
2. Usar una clave única y segura

---

## 📊 **CHECKLIST DE MIGRACIÓN COMPLETA**

### 🏠 **En PC de Casa:**
- [ ] Ejecutado `migrar_proyecto.bat`
- [ ] Verificado backup de base de datos
- [ ] Copiado carpeta de migración a USB/correo

### 🏢 **En PC de Oficina:**
- [ ] Node.js instalado
- [ ] SQL Server Express instalado
- [ ] Ejecutado `Scripts\instalar_en_oficina.bat`
- [ ] Base de datos restaurada
- [ ] Archivos `.env` creados
- [ ] Backend ejecutándose en puerto 8000
- [ ] Frontend ejecutándose en puerto 3000
- [ ] Login funcionando correctamente
- [ ] Ejecutado `verificar_migracion.bat` con éxito

---

## 🎉 **¡MIGRACIÓN COMPLETADA!**

Una vez completados todos los pasos, StockIT estará funcionando completamente en la PC de la oficina con:

- ✅ **Toda la funcionalidad**: Inventario, Asignaciones, Reparaciones, Reportes
- ✅ **Todos los datos**: Usuarios, productos, historial
- ✅ **Configuración optimizada**: Para el entorno de oficina
- ✅ **Documentación completa**: Manuales y guías disponibles

### 🌐 **URLs de Acceso:**
- **Frontend Principal:** http://localhost:3000
- **API Backend:** http://localhost:8000/api

---

## 📞 **Soporte**

Si necesitas ayuda durante la migración:
1. Revisa los archivos de log en `backend\logs\`
2. Ejecuta `verificar_migracion.bat` para diagnóstico
3. Consulta `Config\configuracion_trabajo.md` para configuración detallada

**¡StockIT listo para usar en tu oficina!** 🚀 