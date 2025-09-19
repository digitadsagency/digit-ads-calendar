const fetch = require('node-fetch');

async function testApiReservations() {
  try {
    console.log('🧪 PROBANDO API DE RESERVAS...\n');

    // Simular login de usuario
    console.log('1. 🔐 Simulando login...');
    const loginResponse = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alvatotov@gmail.com',
        password: 'contra123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Error en login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:', loginData.user.name);

    // Obtener cookies para las siguientes requests
    const cookies = loginResponse.headers.get('set-cookie');
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': cookies
    };

    // Probar API de reservas
    console.log('\n2. 📋 Obteniendo reservas del usuario...');
    const reservationsResponse = await fetch('http://localhost:3000/api/users/reservations', {
      method: 'GET',
      headers: headers
    });

    if (!reservationsResponse.ok) {
      console.error('❌ Error obteniendo reservas:', await reservationsResponse.text());
      return;
    }

    const reservationsData = await reservationsResponse.json();
    console.log('✅ Reservas obtenidas:');
    console.log(`  - Total: ${reservationsData.reservations.length}`);
    console.log(`  - Confirmadas: ${reservationsData.reservations.filter(r => r.estado === 'confirmada').length}`);
    console.log(`  - Canceladas: ${reservationsData.reservations.filter(r => r.estado === 'cancelada').length}`);
    
    if (reservationsData.reservations.length > 0) {
      console.log('\n📋 Detalles de reservas:');
      reservationsData.reservations.forEach((reservation, index) => {
        console.log(`  ${index + 1}. ${reservation.fecha} - ${reservation.bloque}${reservation.horario ? ` (${reservation.horario})` : ''} - ${reservation.estado}`);
      });
    }

    // Probar API de disponibilidad
    console.log('\n3. 📅 Probando disponibilidad para 2025-09-25...');
    const availabilityResponse = await fetch('http://localhost:3000/api/availability', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ date: '2025-09-25' })
    });

    if (!availabilityResponse.ok) {
      console.error('❌ Error verificando disponibilidad:', await availabilityResponse.text());
      return;
    }

    const availabilityData = await availabilityResponse.json();
    console.log('✅ Disponibilidad:');
    console.log(`  - Mañana: ${availabilityData.morningAvailable ? 'Disponible' : 'Ocupado'}`);
    console.log(`  - Tarde: ${availabilityData.afternoonAvailable ? 'Disponible' : 'Ocupado'}`);

    // Probar API de horarios específicos
    console.log('\n4. ⏰ Probando horarios específicos para 2025-09-25 - Tarde...');
    const timeSlotsResponse = await fetch('http://localhost:3000/api/time-slots', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ date: '2025-09-25', block: 'Tarde' })
    });

    if (!timeSlotsResponse.ok) {
      console.error('❌ Error obteniendo horarios:', await timeSlotsResponse.text());
      return;
    }

    const timeSlotsData = await timeSlotsResponse.json();
    console.log('✅ Horarios disponibles:');
    console.log(`  - ${timeSlotsData.availableTimeSlots.join(', ')}`);

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testApiReservations();
}

module.exports = { testApiReservations };
