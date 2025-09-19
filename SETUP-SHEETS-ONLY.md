# 🚀 Configuración Solo Google Sheets (Sin Calendar)

## Paso a Paso Simplificado

### 1. **Google Cloud Platform**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto: `digit-ads-calendar`
3. Habilita **solo** la **Google Sheets API**:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Sheets API"
   - Haz clic en "Enable"

### 2. **Crear Service Account**

1. Ve a "IAM & Admin" > "Service Accounts"
2. Clic en "Create Service Account"
3. **Name**: `digit-ads-sheets`
4. **Description**: `Service account for Digit Ads calendar`
5. Clic en "Create and Continue"
6. Clic en "Done"

### 3. **Descargar Credenciales**

1. En la lista de Service Accounts, clic en el que creaste
2. Ve a la pestaña "Keys"
3. Clic en "Add Key" > "Create new key"
4. Selecciona "JSON" y clic en "Create"
5. **Guarda el archivo JSON** - contiene tus credenciales

### 4. **Crear Google Sheets**

1. Ve a [Google Sheets](https://sheets.google.com/)
2. Crea un nuevo spreadsheet
3. Nómbralo: `Digit Ads - Reservas`
4. **Copia el ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_AQUI/edit
   ```

### 5. **Compartir el Spreadsheet**

1. En tu Google Sheets, clic en "Share" (Compartir)
2. Agrega el email del Service Account (del archivo JSON, campo `client_email`)
3. Dale permisos de **"Editor"**
4. Clic en "Send"

### 6. **Configurar Variables de Entorno**

Edita tu archivo `.env.local` con estos datos:

```env
# Google Sheets (REQUERIDO)
GOOGLE_SHEETS_SPREADSHEET_ID=tu_spreadsheet_id_aqui
GOOGLE_CLIENT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTu clave privada del JSON\n-----END PRIVATE KEY-----"

# Google Calendar (OPCIONAL - puedes dejar los valores demo)
PHOTOGRAPHER1_CALENDAR_ID=demo1@example.com
PHOTOGRAPHER2_CALENDAR_ID=demo2@example.com

# Email (OPCIONAL - puedes dejar demo por ahora)
EMAIL_PROVIDER=resend
RESEND_API_KEY=demo_key

# Admin (REQUERIDO)
ADMIN_PASSWORD=tu_contraseña_segura
NEXTAUTH_SECRET=un_string_aleatorio_muy_largo

# Next.js
NODE_ENV=development
```

### 7. **Configurar Google Sheets Automáticamente**

```bash
pnpm run setup-sheets
```

Este comando creará automáticamente:
- Pestaña "reservas" con todos los headers
- Pestaña "config" con configuración por defecto

### 8. **Probar la Aplicación**

```bash
pnpm dev
```

Ve a `http://localhost:3001` y:
1. Selecciona una fecha
2. Elige un bloque
3. Completa el formulario
4. Confirma la reserva
5. **Verifica en Google Sheets** que se guardó la reserva

## ✅ ¿Qué Funciona?

- ✅ **Reservas**: Se guardan en Google Sheets
- ✅ **Disponibilidad**: Se verifica desde Google Sheets
- ✅ **Panel Admin**: Ve todas las reservas
- ✅ **Códigos únicos**: Se generan correctamente
- ✅ **Validaciones**: Fechas, bloques, formularios

## ❌ ¿Qué NO Funciona (Sin Calendar)?

- ❌ **Eventos automáticos**: No se crean en calendarios
- ❌ **Sincronización**: Los fotógrafos deben revisar Sheets manualmente
- ❌ **Recordatorios**: No hay notificaciones automáticas

## 🔄 ¿Agregar Calendar Después?

Si después quieres agregar Google Calendar:

1. Habilita la **Google Calendar API**
2. Crea calendarios para los fotógrafos
3. Compártelos con el Service Account
4. Actualiza las variables de entorno
5. La aplicación automáticamente empezará a crear eventos

## 🆘 Solución de Problemas

### Error: "No se puede acceder al spreadsheet"
- Verifica que compartiste el spreadsheet con el `client_email`
- Verifica que el `GOOGLE_SHEETS_SPREADSHEET_ID` es correcto

### Error: "Invalid credentials"
- Verifica que el `GOOGLE_PRIVATE_KEY` esté correctamente formateado
- Asegúrate de que el `GOOGLE_CLIENT_EMAIL` sea correcto

### Error: "API not enabled"
- Verifica que habilitaste la Google Sheets API
- Espera unos minutos para que se propague

---

**¡Con solo Google Sheets tienes una aplicación completamente funcional!** 🎉
