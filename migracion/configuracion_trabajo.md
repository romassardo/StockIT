# CONFIGURACIÓN STOCKIT EN PC DEL TRABAJO

## 🎯 ARCHIVOS QUE DEBES MODIFICAR

### 1. **CREAR ARCHIVO .env EN BACKEND**
Crear archivo: `backend\.env`
```
# Configuración Base de Datos SQL Server
DB_HOST=TU_PC_TRABAJO\SQLEXPRESS
DB_PORT=1433
DB_NAME=StockIT
DB_USER=tu_usuario_sql
DB_PASSWORD=tu_password_sql
DB_INTEGRATED=false

# Configuración del Servidor
PORT=8000
NODE_ENV=development

# JWT para autenticación
JWT_SECRET=tu_clave_secreta_aqui_2024
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
```

### 2. **CREAR ARCHIVO .env EN FRONTEND**
Crear archivo: `frontend\.env`
```
VITE_API_URL=http://localhost:8000/api
VITE_APP_TITLE=StockIT - Sistema de Inventario
```

## 🔧 VALORES QUE CAMBIAR

### **DB_HOST**: Cambiar por el nombre de tu PC del trabajo
- Ejemplo: Si tu PC se llama "TRABAJO-PC", usar: `TRABAJO-PC\SQLEXPRESS`
- Para averiguar el nombre: abrir `cmd` y escribir `hostname`

### **DB_USER y DB_PASSWORD**: 
- Usar las credenciales de SQL Server de tu PC del trabajo
- O cambiar `DB_INTEGRATED=true` para usar autenticación de Windows

### **JWT_SECRET**: 
- Cambiar por cualquier texto largo y único
- Ejemplo: `StockIT_Trabajo_2024_ClaveSegura123`

## ⚡ COMANDOS PARA EJECUTAR

1. **En la carpeta backend**:
   ```
   npm install
   npm run dev
   ```

2. **En la carpeta frontend** (nueva terminal):
   ```
   npm install  
   npm run dev
   ```

## 📋 CHECKLIST DE MIGRACIÓN

- [ ] SQL Server instalado en PC del trabajo
- [ ] Base de datos StockIT restaurada
- [ ] Node.js instalado 
- [ ] Archivos .env creados con valores correctos
- [ ] npm install ejecutado en backend
- [ ] npm install ejecutado en frontend
- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3000
- [ ] Login funcionando

## 🆘 SI ALGO NO FUNCIONA

1. **Error de conexión DB**: Verificar DB_HOST y credenciales
2. **Error puerto ocupado**: Cambiar PORT en .env del backend
3. **Módulos no encontrados**: Ejecutar `npm install` de nuevo
4. **Login no funciona**: Verificar JWT_SECRET 