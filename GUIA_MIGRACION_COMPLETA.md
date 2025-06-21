# 🚀 GUÍA COMPLETA DE MIGRACIÓN STOCKIT

## 📋 **Dos Métodos de Migración Disponibles**

Ahora tienes **DOS OPCIONES** para migrar StockIT entre PCs:

---

## 🏠 **OPCIÓN 1: MIGRACIÓN LOCAL COMPLETA**
### *(Con todos tus datos actuales)*

### 📦 **Ventajas:**
- ✅ **Backup completo de BD** con todos tus datos reales
- ✅ **Configuraciones específicas** de tu entorno actual
- ✅ **Estado exacto** del proyecto funcionando
- ✅ **Archivos personalizados** y modificaciones locales

### 🔧 **Ejecución:**
1. **En tu PC de casa:**
   ```cmd
   migrar_proyecto.bat
   ```

### 📁 **Qué incluye:**
- Código completo desde tu PC actual
- Backup automático de la base de datos
- Todas las configuraciones personalizadas
- Scripts de instalación automática

---

## 🌐 **OPCIÓN 2: MIGRACIÓN DESDE GITHUB**
### *(Código limpio más reciente)*

### 📦 **Ventajas:**
- ✅ **Código más reciente** desde GitHub
- ✅ **Versión limpia** sin archivos temporales
- ✅ **Fácil transporte** (más liviano)
- ✅ **Sin dependencias** entre PCs

### ⚠️ **Consideraciones:**
- ❌ Requiere **configuración manual de BD**
- ❌ No incluye **datos actuales** de tu sistema

### 🔧 **Ejecución:**
1. **En tu PC de casa:**
   ```cmd
   migrar_desde_github.bat
   ```

### 📁 **Qué incluye:**
- Código descargado desde GitHub
- Scripts para crear BD desde cero
- Backup de BD local (si existe)
- Instrucciones paso a paso

---

## 🤔 **¿CUÁL ELEGIR?**

### 👍 **Elige MIGRACIÓN LOCAL si:**
- Tienes **datos importantes** en StockIT que quieres conservar
- Quieres **exactamente el mismo estado** en la PC de oficina
- Prefieres **instalación automática** sin configuración manual

### 👍 **Elige MIGRACIÓN GITHUB si:**
- Quieres la **versión más reciente** del código
- No tienes datos importantes o puedes crearlos de nuevo
- Prefieres **empezar limpio** en la PC de oficina
- Tu internet es **más rápido** que transferir archivos

---

# 🏠 **PARTE 1: MIGRACIÓN LOCAL COMPLETA**

### 📦 **Paso 1: Ejecutar Migración Local**

1. **Abre terminal en la carpeta raíz de StockIT**
2. **Ejecuta:**
   ```cmd
   migrar_proyecto.bat
   ```

### 🎯 **Qué hace este script:**
- ✅ Verifica integridad del proyecto
- ✅ Crea backup automático de BD con timestamp
- ✅ Copia archivos necesarios (excluyendo temporales)
- ✅ Genera scripts de instalación automática
- ✅ Crea instrucciones detalladas
- ✅ Organiza todo en estructura para transporte

### 📁 **Resultado:**
Carpeta: `C:\Temp\StockIT_Local_[timestamp]`

### 🚛 **Paso 2: Transportar**
- **USB:** Copia toda la carpeta
- **Correo:** Comprime y envía
- **Red local:** Copia directamente

### 🏢 **Paso 3: Instalar en PC Oficina**
1. **Copia la carpeta** al PC de oficina
2. **Ejecuta:** `Scripts\instalar_en_oficina.bat`
3. **¡Listo!** StockIT funcionando idéntico

---

# 🌐 **PARTE 2: MIGRACIÓN DESDE GITHUB**

### 📦 **Paso 1: Ejecutar Migración GitHub**

1. **Verifica que tengas Git instalado**
2. **Abre terminal en cualquier carpeta**
3. **Ejecuta:**
   ```cmd
   migrar_desde_github.bat
   ```

### 🎯 **Qué hace este script:**
- ✅ Descarga código más reciente desde GitHub
- ✅ Intenta crear backup de BD local (si existe)
- ✅ Genera scripts de instalación específicos
- ✅ Crea instrucciones para configuración manual
- ✅ Prepara estructura optimizada

### 📁 **Resultado:**
Carpeta: `C:\Temp\StockIT_GitHub_[timestamp]`

### 🚛 **Paso 2: Transportar**
- **USB:** Copia toda la carpeta (más liviana)
- **Correo:** Comprime y envía (tamaño menor)
- **Red local:** Transferencia más rápida

### 🏢 **Paso 3: Instalar en PC Oficina**

#### **A. Instalación Automática de Código:**
1. **Ejecuta:** `Scripts\instalar_desde_github.bat`
2. **Instala automáticamente:** Node.js dependencies

#### **B. Configuración Manual de BD:**

**OPCIÓN B1 - BD Nueva (Recomendado):**
1. **Instala SQL Server Express**
2. **Ejecuta en SSMS:** `Scripts\crear_bd_inicial.sql`
3. **Ejecuta migraciones:** `backend\src\database\migrations\`
4. **Ejecuta SPs:** `backend\src\database\stored_procedures\`

**OPCIÓN B2 - Restaurar Backup (Si existe):**
1. **Restaura en SSMS:** `Database\StockIT_Local_Backup_*.bak`

#### **C. Configurar .env:**
1. **backend\.env:** Configuración de BD
2. **frontend\.env:** URL del backend

#### **D. Ejecutar Aplicación:**
```cmd
# Terminal 1 - Backend
cd C:\Proyectos\StockIT\backend
npm run dev

# Terminal 2 - Frontend  
cd C:\Proyectos\StockIT\frontend
npm run dev
```

---

## 📊 **COMPARACIÓN DE MÉTODOS**

| Aspecto | Migración Local | Migración GitHub |
|---------|----------------|------------------|
| **Datos** | ✅ Conserva todo | ❌ BD desde cero |
| **Configuración** | ✅ Automática | ⚠️ Manual |
| **Código** | Estado actual | ✅ Más reciente |
| **Tamaño** | Mayor | ✅ Menor |
| **Tiempo Setup** | ✅ Mínimo | Mayor |
| **Limpieza** | Actual | ✅ Completamente limpio |
| **Internet** | No requerido | ✅ Requerido |

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comunes - Migración Local:**
- **Error backup BD:** Verifica SQL Server corriendo
- **Archivos grandes:** USA USB en lugar de correo
- **Permisos:** Ejecuta como administrador

### **Problemas Comunes - Migración GitHub:**
- **Git no encontrado:** Instala desde git-scm.com
- **Error clone:** Verifica conexión internet
- **BD no conecta:** Revisa connection string en .env

---

## 🆘 **SOPORTE ADICIONAL**

### 📚 **Documentación:**
- `docs\README.md` - Documentación técnica
- `docs\MANUAL_USUARIO.md` - Manual de usuario
- `CHANGELOG.md` - Historial de cambios

### 🛠️ **Logs y Debug:**
- `backend\logs\` - Logs de aplicación
- Console de navegador - Errores frontend
- SQL Server logs - Errores de BD

### 📞 **Canales de Ayuda:**
- GitHub Issues para reportar problemas
- Documentación en `docs\` para referencias
- Logs detallados para diagnóstico

---

## ✅ **VERIFICACIÓN FINAL**

Independientemente del método elegido, verifica que:

1. **✅ Backend corriendo** en puerto 3001
2. **✅ Frontend corriendo** en puerto 3000  
3. **✅ Base de datos conectada** y respondiendo
4. **✅ Login funcionando** con usuario de prueba
5. **✅ Dashboard cargando** datos correctamente

¡Tu migración de StockIT estará **100% completa**! 