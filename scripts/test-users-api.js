const fetch = require('node-fetch');

async function testUsersAPI() {
  try {
    console.log('🧪 PROBANDO API DE USUARIOS...\n');

    // Probar API de usuarios
    console.log('1. 📋 Obteniendo lista de usuarios...');
    const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      console.error('❌ Error obteniendo usuarios:', await usersResponse.text());
      return;
    }

    const usersData = await usersResponse.json();
    console.log('✅ Respuesta de la API:');
    console.log(`  - Success: ${usersData.success}`);
    console.log(`  - Total usuarios: ${usersData.users.length}`);
    
    if (usersData.users.length > 0) {
      console.log('\n👥 Usuarios encontrados:');
      usersData.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     - Email: ${user.email}`);
        console.log(`     - Nombre: ${user.name}`);
        console.log(`     - Empresa: ${user.company}`);
        console.log(`     - Límite mensual: ${user.monthlyLimit}`);
        console.log(`     - Activo: ${user.is_active}`);
        console.log('');
      });
    } else {
      console.log('✅ No hay usuarios (esto es correcto si no has creado ninguno)');
    }

    // Verificar si hay usuarios fantasma
    const ghostUsers = usersData.users.filter(user => 
      user.id === 'id' || 
      user.email === 'email' || 
      user.name === 'name' ||
      user.company === 'company'
    );

    if (ghostUsers.length > 0) {
      console.log('🚨 USUARIOS FANTASMA DETECTADOS:');
      ghostUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.name}`);
      });
    } else {
      console.log('✅ No se detectaron usuarios fantasma');
    }

    console.log('\n🎉 PRUEBA COMPLETADA');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testUsersAPI();
}

module.exports = { testUsersAPI };
