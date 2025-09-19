const fetch = require('node-fetch');

async function testDeleteUserAPI() {
  try {
    console.log('🧪 PROBANDO API DE ELIMINACIÓN DE USUARIOS...\n');

    // Primero, obtener la lista de usuarios
    console.log('1. 📋 Obteniendo lista de usuarios...');
    const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'admin-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc0FkbWluIjp0cnVlLCJpYXQiOjE3MzU4MjM3MzB9.example' // Token de ejemplo
      }
    });

    if (!usersResponse.ok) {
      console.error('❌ Error obteniendo usuarios:', await usersResponse.text());
      return;
    }

    const usersData = await usersResponse.json();
    console.log('✅ Usuarios obtenidos:');
    console.log(`  - Total: ${usersData.users.length}`);
    
    if (usersData.users.length === 0) {
      console.log('❌ No hay usuarios para eliminar');
      return;
    }

    // Mostrar usuarios disponibles
    usersData.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    // Seleccionar el primer usuario para eliminar
    const userToDelete = usersData.users[0];
    console.log(`\n2. 🗑️ Eliminando usuario: ${userToDelete.name} (ID: ${userToDelete.id})`);

    // Eliminar el usuario
    const deleteResponse = await fetch(`http://localhost:3000/api/admin/users/${userToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'admin-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc0FkbWluIjp0cnVlLCJpYXQiOjE3MzU4MjM3MzB9.example' // Token de ejemplo
      }
    });

    if (!deleteResponse.ok) {
      console.error('❌ Error eliminando usuario:', await deleteResponse.text());
      return;
    }

    const deleteData = await deleteResponse.json();
    console.log('✅ Respuesta de eliminación:', deleteData);

    // Verificar que se eliminó
    console.log('\n3. 🔍 Verificando eliminación...');
    const usersResponseAfter = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'admin-session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc0FkbWluIjp0cnVlLCJpYXQiOjE3MzU4MjM3MzB9.example' // Token de ejemplo
      }
    });

    if (!usersResponseAfter.ok) {
      console.error('❌ Error obteniendo usuarios después:', await usersResponseAfter.text());
      return;
    }

    const usersDataAfter = await usersResponseAfter.json();
    console.log('✅ Usuarios después de eliminación:');
    console.log(`  - Total: ${usersDataAfter.users.length}`);

    const userStillExists = usersDataAfter.users.some(user => user.id === userToDelete.id);
    
    if (userStillExists) {
      console.log(`❌ El usuario ${userToDelete.id} aún existe después de la eliminación`);
    } else {
      console.log(`✅ El usuario ${userToDelete.id} fue eliminado correctamente`);
    }

    console.log('\n🎉 PRUEBA COMPLETADA');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testDeleteUserAPI();
}

module.exports = { testDeleteUserAPI };
