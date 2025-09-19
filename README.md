# Digit Ads - Agenda de Grabación

Sistema de reservas para sesiones de grabación de Digit Ads. Permite a los clientes reservar horarios de grabación y a los administradores gestionar las reservas.

## 🚀 Características

- **Reservas en línea**: Los clientes pueden reservar horarios de grabación fácilmente
- **Sistema de usuarios cliente**: Control de acceso y límites por cliente (1-3 reservas/mes)
- **Base de datos en Google Sheets**: Almacena todas las reservas y usuarios de forma organizada
- **Panel de administración**: Gestiona reservas, usuarios y ve estadísticas
- **Autenticación segura**: Sistema de login para admin y clientes
- **Diseño responsive**: Funciona perfectamente en móviles y escritorio

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes
- **Base de datos**: Google Sheets API
- **Autenticación**: JWT con cookies seguras
- **Email**: Resend (recomendado) o SMTP

## 📋 Requisitos Previos

1. **Cuenta de Google Cloud Platform** con APIs habilitadas:
   - Google Sheets API

2. **Cuenta de Resend** (recomendado) o servidor SMTP para emails

3. **Node.js 18+** y **pnpm** instalados

## ⚙️ Configuración

### 1. Clonar y instalar dependencias

```bash
git clone <tu-repositorio>
cd calendario-digitads
pnpm install
```

### 2. Configurar Google Cloud Platform

#### Crear un proyecto y habilitar APIs:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs:
   - Google Sheets API
   - Google Calendar API

#### Crear Service Account:

1. Ve a "IAM & Admin" > "Service Accounts"
2. Crea una nueva Service Account
3. Descarga el archivo JSON de credenciales
4. Copia el `client_email` y `private_key` del archivo JSON

#### Configurar permisos:

1. **Google Sheets**: Crea un nuevo spreadsheet y compártelo con el `client_email` de la Service Account
2. **Google Calendar**: Comparte los calendarios de ambos fotógrafos con el `client_email`

### 3. Configurar variables de entorno

Copia el archivo `env.example` a `.env.local` y completa las variables:

```bash
cp env.example .env.local
```

```env
# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id_aqui

# Google Service Account
GOOGLE_CLIENT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu clave privada aquí\n-----END PRIVATE KEY-----"

# Google Calendar IDs
PHOTOGRAPHER1_CALENDAR_ID=fotografo1@ejemplo.com
PHOTOGRAPHER2_CALENDAR_ID=fotografo2@ejemplo.com

# Email Configuration (Resend - Recomendado)
EMAIL_PROVIDER=resend
RESEND_API_KEY=tu_resend_api_key_aqui

# Email Configuration (SMTP - Alternativa)
# EMAIL_PROVIDER=smtp
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu_email@gmail.com
# SMTP_PASS=tu_app_password
# EMAIL_FROM=tu_email@gmail.com

# Admin Authentication
ADMIN_PASSWORD=tu_contraseña_segura_aqui

# Next.js
NEXTAUTH_SECRET=tu_secreto_aleatorio_aqui
```

### 4. Configurar Google Sheets

El sistema creará automáticamente las pestañas necesarias en tu spreadsheet:

#### Pestaña "reservas":
- `id`: ID único de la reserva
- `fecha`: Fecha en formato YYYY-MM-DD
- `bloque`: "Mañana" o "Tarde"
- `cliente_nombre`: Nombre del cliente
- `empresa_marca`: Empresa o marca
- `direccion_grabacion`: Dirección donde se realizará la grabación
- `whatsapp`: Número de WhatsApp
- `notas`: Notas adicionales
- `estado`: "confirmada" o "cancelada"
- `codigo_reserva`: Código único (ej: DIG-ABC123)
- `gcal_event_id_ph1`: ID del evento en calendario fotógrafo 1
- `gcal_event_id_ph2`: ID del evento en calendario fotógrafo 2
- `creado_en`: Timestamp de creación
- `actualizado_en`: Timestamp de última actualización

#### Pestaña "usuarios":
- `id`: ID único del usuario
- `email`: Email del usuario (usado para login)
- `password`: Contraseña hasheada
- `name`: Nombre del usuario
- `company`: Empresa del usuario
- `monthlyLimit`: Límite de reservas por mes (1-3)
- `whatsapp`: Número de WhatsApp
- `created_at`: Fecha de creación
- `last_login`: Último acceso
- `is_active`: Estado del usuario (activo/inactivo)

#### Pestaña "reservas_usuarios":
- `id`: ID único de la reserva
- `userId`: ID del usuario que hizo la reserva
- `fecha`: Fecha de la reserva (YYYY-MM-DD)
- `bloque`: Horario (Mañana/Tarde)
- `cliente_nombre`: Nombre del cliente
- `empresa_marca`: Empresa o marca
- `direccion_grabacion`: Dirección donde se realizará la grabación
- `whatsapp`: Número de WhatsApp
- `notas`: Notas adicionales
- `estado`: Estado de la reserva (confirmada/cancelada)
- `codigo_reserva`: Código único de la reserva
- `creado_en`: Fecha de creación
- `actualizado_en`: Fecha de última actualización

#### Pestaña "config" (opcional):
- `morning_start`: Hora de inicio mañana (ej: "10:00")
- `morning_end`: Hora de fin mañana (ej: "13:00")
- `afternoon_start`: Hora de inicio tarde (ej: "16:00")
- `afternoon_end`: Hora de fin tarde (ej: "19:00")
- `enabled_weekdays`: Días habilitados (ej: "1,2,3,4,5")

### 5. Configurar Email

#### Opción A: Resend (Recomendado)

1. Crea una cuenta en [Resend](https://resend.com/)
2. Verifica tu dominio
3. Obtén tu API key
4. Configura `EMAIL_PROVIDER=resend` y `RESEND_API_KEY`

#### Opción B: SMTP

1. Configura un servidor SMTP (Gmail, SendGrid, etc.)
2. Configura `EMAIL_PROVIDER=smtp` y las variables SMTP correspondientes

### 6. Ejecutar la aplicación

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build
pnpm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Uso

### Para Clientes

1. Visita la página principal
2. Selecciona una fecha (solo lunes a viernes)
3. Elige un horario disponible (Mañana o Tarde)
4. Completa tus datos
5. Confirma la reserva
6. Recibe un email de confirmación con tu código

### Para Administradores

1. Ve a `/admin/login`
2. Ingresa la contraseña de administrador
3. Gestiona reservas, cancela citas y ve estadísticas

## 👥 Gestión de Usuarios

### Crear Usuarios de Ejemplo

Para crear 5 usuarios de ejemplo con diferentes límites mensuales:

```bash
pnpm run create-users
```

Esto creará:
- **2 usuarios con límite de 3 reservas/mes**: María González (Empresa ABC) y Carlos Rodríguez (Marca XYZ)
- **3 usuarios con límite de 1 reserva/mes**: Ana Martínez (Startup Tech), Luis Hernández (Negocio Local) y Sofia López (Corporativo Global)

**Credenciales de ejemplo:**
- `cliente1@empresa.com` / `cliente123` (3 reservas/mes)
- `cliente2@marca.com` / `cliente456` (3 reservas/mes)
- `cliente3@startup.com` / `cliente789` (1 reserva/mes)
- `cliente4@negocio.com` / `cliente012` (1 reserva/mes)
- `cliente5@corporativo.com` / `cliente345` (1 reserva/mes)

### Crear Usuarios Manualmente

1. Ve al panel de administración (`/admin`)
2. Usa la sección "Gestión de Usuarios"
3. Completa el formulario con los datos del cliente
4. Asigna el límite mensual (1-3 reservas)
5. Comparte las credenciales con el cliente

### Acceso de Clientes

Los clientes pueden acceder a su panel en `/client` usando sus credenciales. Desde ahí pueden:
- Ver su límite mensual de reservas
- Hacer nuevas reservas (respetando el límite)
- Ver su historial de reservas
- Cerrar sesión

## 🚀 Despliegue en Vercel

### 1. Preparar el proyecto

```bash
# Asegúrate de que el build funcione
pnpm build
```

### 2. Desplegar en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Despliega

### 3. Variables de entorno en Vercel

Asegúrate de configurar todas las variables de entorno en el dashboard de Vercel:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `PHOTOGRAPHER1_CALENDAR_ID`
- `PHOTOGRAPHER2_CALENDAR_ID`
- `EMAIL_PROVIDER`
- `RESEND_API_KEY` (si usas Resend)
- `ADMIN_PASSWORD`
- `NEXTAUTH_SECRET`

## 🔧 Personalización

### Cambiar horarios

Puedes modificar los horarios editando la pestaña "config" en Google Sheets o cambiando los valores por defecto en `lib/config.ts`.

### Cambiar días disponibles

Modifica `enabledWeekdays` en `lib/config.ts` o en la pestaña "config" de Google Sheets.

### Personalizar emails

Edita las plantillas en `lib/email.ts` para personalizar los emails de confirmación.

## 🐛 Solución de Problemas

### Error de permisos de Google Sheets

- Asegúrate de que el `client_email` de la Service Account tenga acceso al spreadsheet
- Verifica que las APIs estén habilitadas en Google Cloud Console

### Error de permisos de Google Calendar

- Comparte los calendarios de los fotógrafos con el `client_email`
- Verifica que los IDs de calendario sean correctos

### Error de email

- Verifica las credenciales de Resend o SMTP
- Revisa que el dominio esté verificado (para Resend)

### Error de autenticación de admin

- Verifica que `ADMIN_PASSWORD` esté configurado
- Asegúrate de que `NEXTAUTH_SECRET` sea una cadena aleatoria segura

## 📧 Configuración de Correo Electrónico

### Configuración con Gmail (Recomendado)

El sistema está configurado para usar Gmail como proveedor de correo. Sigue estos pasos:

#### 1. Habilitar Autenticación de 2 Factores
1. Ve a [Google Account Security](https://myaccount.google.com/security)
2. En "Iniciar sesión en Google", activa "Verificación en 2 pasos"

#### 2. Generar Contraseña de Aplicación
1. Ve a [App Passwords](https://myaccount.google.com/apppasswords)
2. Selecciona "Correo" y "Otro (nombre personalizado)"
3. Escribe "Digit Ads Calendar" como nombre
4. Copia la contraseña de 16 caracteres generada

#### 3. Configurar Variables de Entorno
Agrega estas líneas a tu archivo `.env.local`:

```bash
# Configuración de Gmail
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=la-contraseña-de-16-caracteres
```

#### 4. Probar la Configuración
```bash
pnpm run setup-gmail
```

Este script:
- ✅ Verifica que las variables estén configuradas
- ✅ Prueba la conexión con Gmail
- ✅ Envía un correo de prueba
- ✅ Confirma que todo funciona correctamente

### Características del Sistema de Correo

- **Envío automático**: Los clientes reciben un correo de confirmación al hacer una reserva
- **Diseño profesional**: Correo HTML con diseño responsive y branding de Digit Ads
- **Información completa**: Incluye fecha, horario, dirección, código de reserva y notas
- **Instrucciones importantes**: Información sobre cancelaciones y políticas
- **Fallback seguro**: Si el correo falla, la reserva se crea igual (no se pierde)

## 📞 Soporte

Si tienes problemas con la configuración o el funcionamiento de la aplicación, revisa:

1. Los logs de la consola del navegador
2. Los logs del servidor (terminal donde ejecutas `pnpm dev`)
3. Las variables de entorno están correctamente configuradas
4. Los permisos de Google Cloud Platform

## 📄 Licencia

Este proyecto es privado y está destinado exclusivamente para Digit Ads.

---

**Desarrollado para Digit Ads** 🎬
