const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function createTestReservation() {
  try {
    console.log('🧪 Creando reserva de prueba...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Crear una reserva de prueba para mañana (más de 24 horas en el futuro)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // 2 días en el futuro para asegurar que se puede cancelar
    const fecha = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    const testReservation = [
      'DIG-TEST123', // id
      'USR-TEST123', // userId
      fecha, // fecha
      'Mañana', // bloque
      '10:00', // horario
      'Cliente Test', // cliente_nombre
      'Empresa Test', // empresa_marca
      'Dirección Test', // direccion_grabacion
      'test@example.com', // correo
      'Reserva de prueba', // notas
      'confirmada', // estado
      'DIG-TEST123', // codigo_reserva
      new Date().toISOString(), // creado_en
      new Date().toISOString() // actualizado_en
    ];

    console.log(`📅 Creando reserva para: ${fecha}`);
    console.log(`📋 Datos de la reserva:`, testReservation);

    // Agregar la reserva a Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'reservas_usuarios!A:N',
      valueInputOption: 'RAW',
      requestBody: {
        values: [testReservation],
      },
    });

    console.log('✅ Reserva de prueba creada exitosamente');
    console.log(`🎯 ID de reserva: DIG-TEST123`);
    console.log(`👤 Usuario: USR-TEST123`);
    console.log(`📅 Fecha: ${fecha}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestReservation();
}

module.exports = { createTestReservation };
