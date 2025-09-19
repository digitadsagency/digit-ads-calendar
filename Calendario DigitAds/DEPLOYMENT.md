# 🚀 Guía de Despliegue - Digit Ads Calendar

## Despliegue Rápido en Vercel

### 1. Preparar el proyecto

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp env.example .env.local
# Editar .env.local con tus credenciales

# Configurar Google Sheets automáticamente
pnpm run setup-sheets

# Verificar que todo funciona
pnpm dev
```

### 2. Desplegar en Vercel

1. **Conectar repositorio**:
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub

2. **Configurar variables de entorno**:
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables de `env.example`

3. **Desplegar**:
   - Vercel detectará automáticamente que es un proyecto Next.js
   - Haz clic en "Deploy"

### 3. Variables de entorno requeridas

```env
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id

# Google Service Account
GOOGLE_CLIENT_EMAIL=service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Google Calendar
PHOTOGRAPHER1_CALENDAR_ID=fotografo1@ejemplo.com
PHOTOGRAPHER2_CALENDAR_ID=fotografo2@ejemplo.com

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...

# Admin
ADMIN_PASSWORD=tu_contraseña_segura
NEXTAUTH_SECRET=secreto_aleatorio_largo
```

### 4. Verificar el despliegue

1. **Probar la página principal**: Debe cargar sin errores
2. **Probar una reserva**: Crear una reserva de prueba
3. **Verificar admin**: Acceder a `/admin` con la contraseña
4. **Revisar Google Sheets**: Verificar que se creó la reserva
5. **Revisar Google Calendar**: Verificar que se crearon los eventos
6. **Revisar email**: Verificar que llegó el email de confirmación

### 5. Configuración de Google Cloud Platform

#### Service Account:
1. Crear Service Account en Google Cloud Console
2. Descargar archivo JSON de credenciales
3. Copiar `client_email` y `private_key` a las variables de entorno

#### Permisos:
1. **Google Sheets**: Compartir el spreadsheet con el `client_email`
2. **Google Calendar**: Compartir ambos calendarios con el `client_email`

#### APIs habilitadas:
- Google Sheets API
- Google Calendar API

### 6. Configuración de Email (Resend)

1. Crear cuenta en [resend.com](https://resend.com)
2. Verificar dominio (opcional, puedes usar el dominio de Resend)
3. Obtener API key
4. Configurar `RESEND_API_KEY` en Vercel

### 7. Solución de problemas comunes

#### Error 500 en reservas:
- Verificar permisos de Google Sheets
- Verificar que las APIs estén habilitadas
- Revisar logs en Vercel Functions

#### Error de calendario:
- Verificar que los calendarios estén compartidos
- Verificar IDs de calendario correctos
- Revisar permisos de Service Account

#### Error de email:
- Verificar API key de Resend
- Verificar configuración de dominio
- Revisar logs de email en Resend dashboard

#### Error de autenticación admin:
- Verificar `ADMIN_PASSWORD` configurado
- Verificar `NEXTAUTH_SECRET` configurado
- Limpiar cookies del navegador

### 8. Monitoreo

- **Vercel Analytics**: Habilitar para ver métricas de uso
- **Logs**: Revisar Function Logs en Vercel
- **Google Sheets**: Monitorear nuevas reservas
- **Resend**: Revisar estadísticas de emails

### 9. Backup y mantenimiento

- **Google Sheets**: Las reservas se guardan automáticamente
- **Google Calendar**: Los eventos se sincronizan automáticamente
- **Código**: Mantener respaldo en GitHub
- **Variables de entorno**: Documentar en lugar seguro

---

## ✅ Checklist de Despliegue

- [ ] Variables de entorno configuradas en Vercel
- [ ] Google Sheets configurado y accesible
- [ ] Google Calendar compartido con Service Account
- [ ] Resend configurado y funcionando
- [ ] Página principal carga correctamente
- [ ] Reserva de prueba funciona
- [ ] Panel de admin accesible
- [ ] Emails de confirmación llegan
- [ ] Eventos se crean en calendarios
- [ ] Datos se guardan en Google Sheets

¡Tu aplicación está lista para producción! 🎉
