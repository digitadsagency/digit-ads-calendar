const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function createFutureReservation() {
  try {
    console.log('🧪 Creando reserva futura para probar cancelación...');
    
    const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Crear una reserva para 3 días en el futuro (más de 24 horas)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3); // 3 días en el futuro
    const fecha = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const testReservation = [
      'DIG-FUTURE123', // id
      'USR-TEST123', // userId
      fecha, // fecha
      'Mañana', // bloque
      '10:00', // horario
      'Cliente Test Futuro', // cliente_nombre
      'Empresa Test Futuro', // empresa_marca
      'Dirección Test Futuro', // direccion_grabacion
      'test@example.com', // correo
      'Reserva futura para probar cancelación', // notas
      'confirmada', // estado
      'DIG-FUTURE123', // codigo_reserva
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

    console.log('✅ Reserva futura creada exitosamente');
    console.log(`🎯 ID de reserva: DIG-FUTURE123`);
    console.log(`👤 Usuario: USR-TEST123`);
    console.log(`📅 Fecha: ${fecha}`);
    console.log(`⏰ Diferencia en horas: ${((new Date(fecha + 'T00:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60)).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createFutureReservation();
}

module.exports = { createFutureReservation };
