const fetch = require('node-fetch');

async function testTimeSlotsDirect() {
  try {
    console.log('🧪 PROBANDO API DE TIME-SLOTS DIRECTAMENTE...\n');

    // Probar API de horarios específicos
    console.log('⏰ Probando horarios específicos para 2025-09-25 - Tarde...');
    const timeSlotsResponse = await fetch('http://localhost:3000/api/time-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ date: '2025-09-25', block: 'Tarde' })
    });

    if (!timeSlotsResponse.ok) {
      console.error('❌ Error obteniendo horarios:', await timeSlotsResponse.text());
      return;
    }

    const timeSlotsData = await timeSlotsResponse.json();
    console.log('✅ Horarios disponibles:');
    console.log(`  - ${timeSlotsData.availableTimeSlots.join(', ')}`);

    console.log('\n🎉 PRUEBA COMPLETADA');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testTimeSlotsDirect();
}

module.exports = { testTimeSlotsDirect };
