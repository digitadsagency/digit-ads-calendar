# 🚀 Despliegue en Vercel - Digit Ads Calendar

## 📋 Pasos para Desplegar

### 1. Preparar el Proyecto
- ✅ El proyecto está listo para desplegar
- ✅ `next.config.js` configurado correctamente
- ✅ `vercel.json` configurado con timeout de 30s para APIs
- ✅ `.gitignore` configurado para proteger archivos sensibles

### 2. Subir a GitHub (Recomendado)

#### Opción A: Crear repositorio nuevo
```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit - Digit Ads Calendar"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/digit-ads-calendar.git
git push -u origin main
```

#### Opción B: Si ya tienes un repositorio
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### 3. Desplegar en Vercel

#### Opción A: Desde GitHub (Recomendado)
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New Project"
4. Selecciona tu repositorio `digit-ads-calendar`
5. Vercel detectará automáticamente que es un proyecto Next.js
6. Haz clic en "Deploy"

#### Opción B: Desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# En la carpeta del proyecto
vercel

# Seguir las instrucciones
```

### 4. Configurar Variables de Entorno

En el dashboard de Vercel:
1. Ve a tu proyecto
2. Settings → Environment Variables
3. Agregar las siguientes variables:

#### Variables Requeridas:
```
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id
GOOGLE_CLIENT_EMAIL=tu_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_private_key_aqui\n-----END PRIVATE KEY-----"
ADMIN_PASSWORD=tu_contraseña_admin_segura
```

#### Variables de Email (Gmail):
```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
EMAIL_FROM=tu_email@gmail.com
```

### 5. Verificar Despliegue

1. **URL de producción**: `https://tu-proyecto.vercel.app`
2. **Panel de admin**: `https://tu-proyecto.vercel.app/admin`
3. **Login de clientes**: `https://tu-proyecto.vercel.app/client/login`

### 6. Configuración Adicional

#### Dominio Personalizado (Opcional)
1. En Vercel Dashboard → Settings → Domains
2. Agregar tu dominio personalizado
3. Configurar DNS según las instrucciones

#### Monitoreo
- Vercel Analytics (gratis)
- Logs en tiempo real en el dashboard

## 🔧 Solución de Problemas

### Error de Build
- Verificar que todas las variables de entorno estén configuradas
- Revisar logs en Vercel Dashboard

### Error de Google Sheets
- Verificar que el Service Account tenga permisos
- Confirmar que el Spreadsheet ID sea correcto

### Error de Email
- Verificar configuración SMTP
- Confirmar App Password de Gmail

## 📞 Soporte

Si tienes problemas:
1. Revisar logs en Vercel Dashboard
2. Verificar variables de entorno
3. Probar localmente con `pnpm dev`

## 🎉 ¡Listo!

Una vez desplegado, tu aplicación estará disponible 24/7 con:
- ✅ SSL automático
- ✅ CDN global
- ✅ Escalado automático
- ✅ Deployments automáticos desde GitHub
