# 🚀 Guía de Despliegue en Coolify v4

## Archivos Creados

- `Dockerfile` - Construcción multi-stage para producción
- `src/server/production.ts` - Servidor de producción que sirve API + frontend
- `.dockerignore` - Excluye archivos innecesarios del build

## Pasos para Desplegar en Coolify v4

### 1. Subir código a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/team-attendance.git
git push -u origin main
```

### 2. Crear proyecto en Coolify

1. Ve a tu panel de Coolify
2. Click en **"+ Create New Resource"**
3. Selecciona **"Application"**
4. Elige **"GitHub"** y conecta tu repositorio

### 3. Configurar el Build

En la sección de configuración del proyecto:

| Configuración | Valor |
|---------------|-------|
| **Build Pack** | Dockerfile |
| **Dockerfile Location** | `Dockerfile` |
| **Port** | `3000` |

### 4. Variables de Entorno

En la sección **"Environment Variables"**, añade:

```
NODE_ENV=production
PORT=3000
DATA_PATH=/app/data
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura-cambiala
```

> ⚠️ **IMPORTANTE**: Cambia `JWT_SECRET` por una clave segura y única.

### 5. Configurar Persistencia (Volumen)

Esta es la parte más importante para que los datos no se pierdan:

1. Ve a la pestaña **"Storages"** o **"Volumes"**
2. Click en **"+ Add"**
3. Configura así:

| Campo | Valor |
|-------|-------|
| **Source Path** | `/data/team-attendance` (en el host) |
| **Destination Path** | `/app/data` (en el container) |

Esto crea un volumen persistente donde se guarda la base de datos SQLite.

### 6. Configurar Dominio (Opcional)

1. Ve a la pestaña **"Domains"**
2. Añade tu dominio, ej: `attendance.tudominio.com`
3. Activa **"Generate SSL"** para HTTPS

### 7. Desplegar

1. Click en **"Deploy"**
2. Espera a que el build termine (puede tardar 2-3 min la primera vez)
3. Verifica el estado en **"Deployments"**

## Verificar Despliegue

Una vez desplegado, verifica:

```bash
# Health check
curl https://tu-dominio.com/api/health

# Debería responder:
# {"status":"ok","timestamp":"2024-01-01T12:00:00.000Z"}
```

## Credenciales por Defecto

| Usuario | Email | Contraseña |
|---------|-------|------------|
| Admin | admin@team.com | admin123 |

> ⚠️ **Cambia la contraseña del admin después del primer login!**

## Solución de Problemas

### La base de datos se borra al redesplegar
- Verifica que el volumen esté correctamente configurado en `/app/data`
- El Source Path debe existir en el servidor host

### Error de permisos SQLite
```bash
# En el servidor, dar permisos:
chmod 755 /data/team-attendance
```

### Ver logs en Coolify
- Ve a la pestaña **"Logs"** del proyecto
- Busca errores de conexión o build

## Backup de Datos

Para hacer backup de la base de datos:

```bash
# En tu servidor con Coolify
cp /data/team-attendance/attendance.db /backup/attendance-$(date +%Y%m%d).db
```
