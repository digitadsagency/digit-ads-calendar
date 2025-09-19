const fetch = require('node-fetch');

async function testBlockAvailability() {
  try {
    console.log('🧪 PROBANDO NUEVA LÓGICA DE DISPONIBILIDAD DE BLOQUES...\n');

    // Probar disponibilidad para 2025-09-25 (que tiene reservas)
    console.log('1. 📅 Probando disponibilidad para 2025-09-25 (con reservas)...');
    const availabilityResponse = await fetch('http://localhost:3000/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

    // Probar horarios específicos para mañana
    console.log('\n2. ⏰ Probando horarios específicos para 2025-09-25 - Mañana...');
    const morningTimeSlotsResponse = await fetch('http://localhost:3000/api/time-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: '2025-09-25', block: 'Mañana' })
    });

    if (!morningTimeSlotsResponse.ok) {
      console.error('❌ Error obteniendo horarios de mañana:', await morningTimeSlotsResponse.text());
      return;
    }

    const morningTimeSlotsData = await morningTimeSlotsResponse.json();
    console.log('✅ Horarios disponibles para Mañana:');
    console.log(`  - ${morningTimeSlotsData.availableTimeSlots.length > 0 ? morningTimeSlotsData.availableTimeSlots.join(', ') : 'Ninguno (bloque ocupado)'}`);

    // Probar horarios específicos para tarde
    console.log('\n3. ⏰ Probando horarios específicos para 2025-09-25 - Tarde...');
    const afternoonTimeSlotsResponse = await fetch('http://localhost:3000/api/time-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: '2025-09-25', block: 'Tarde' })
    });

    if (!afternoonTimeSlotsResponse.ok) {
      console.error('❌ Error obteniendo horarios de tarde:', await afternoonTimeSlotsResponse.text());
      return;
    }

    const afternoonTimeSlotsData = await afternoonTimeSlotsResponse.json();
    console.log('✅ Horarios disponibles para Tarde:');
    console.log(`  - ${afternoonTimeSlotsData.availableTimeSlots.length > 0 ? afternoonTimeSlotsData.availableTimeSlots.join(', ') : 'Ninguno (bloque ocupado)'}`);

    // Probar disponibilidad para una fecha sin reservas
    console.log('\n4. 📅 Probando disponibilidad para 2025-09-23 (sin reservas)...');
    const availabilityResponse2 = await fetch('http://localhost:3000/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: '2025-09-23' })
    });

    if (!availabilityResponse2.ok) {
      console.error('❌ Error verificando disponibilidad:', await availabilityResponse2.text());
      return;
    }

    const availabilityData2 = await availabilityResponse2.json();
    console.log('✅ Disponibilidad para 2025-09-23:');
    console.log(`  - Mañana: ${availabilityData2.morningAvailable ? 'Disponible' : 'Ocupado'}`);
    console.log(`  - Tarde: ${availabilityData2.afternoonAvailable ? 'Disponible' : 'Ocupado'}`);

    // Probar horarios específicos para fecha sin reservas
    console.log('\n5. ⏰ Probando horarios específicos para 2025-09-23 - Tarde...');
    const timeSlotsResponse2 = await fetch('http://localhost:3000/api/time-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: '2025-09-23', block: 'Tarde' })
    });

    if (!timeSlotsResponse2.ok) {
      console.error('❌ Error obteniendo horarios:', await timeSlotsResponse2.text());
      return;
    }

    const timeSlotsData2 = await timeSlotsResponse2.json();
    console.log('✅ Horarios disponibles para 2025-09-23 - Tarde:');
    console.log(`  - ${timeSlotsData2.availableTimeSlots.join(', ')}`);

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS');
    console.log('\n📋 RESUMEN:');
    console.log('  - 2025-09-25: Tiene reservas, ambos bloques deben estar ocupados');
    console.log('  - 2025-09-23: Sin reservas, ambos bloques deben estar disponibles');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testBlockAvailability();
}

module.exports = { testBlockAvailability };
