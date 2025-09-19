const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

// Configuración del transporter de Gmail
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// Función para verificar la configuración de correo
async function testEmailConfiguration() {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return { 
        success: false, 
        error: 'Variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD no configuradas' 
      };
    }

    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ Configuración de correo verificada correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error verificando configuración de correo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Función para enviar correo de prueba
async function sendTestEmail() {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Digit Ads - Agenda de Grabación',
        address: process.env.GMAIL_USER
      },
      to: process.env.GMAIL_USER,
      subject: '✅ Prueba de Configuración - Digit Ads',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">🎬 Digit Ads - Configuración Exitosa</h2>
          <p>¡Hola!</p>
          <p>Este es un correo de prueba para verificar que la configuración de Gmail está funcionando correctamente.</p>
          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>✅ Configuración Verificada:</h3>
            <ul>
              <li>Gmail configurado correctamente</li>
              <li>Envió de correos funcionando</li>
              <li>Sistema listo para enviar confirmaciones de reserva</li>
            </ul>
          </div>
          <p>Ahora los clientes recibirán automáticamente un correo de confirmación cuando hagan una reserva.</p>
          <p>¡Gracias por usar Digit Ads!</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

async function setupGmail() {
  console.log('📧 CONFIGURACIÓN DE GMAIL PARA DIGIT ADS');
  console.log('==========================================\n');

  // Verificar variables de entorno
  console.log('🔍 Verificando configuración...');
  
  if (!process.env.GMAIL_USER) {
    console.log('❌ GMAIL_USER no está configurado');
    console.log('   Agrega GMAIL_USER=tu-email@gmail.com a tu archivo .env.local');
    return;
  }

  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log('❌ GMAIL_APP_PASSWORD no está configurado');
    console.log('   Agrega GMAIL_APP_PASSWORD=tu-contraseña-de-aplicacion a tu archivo .env.local');
    return;
  }

  console.log('✅ Variables de entorno configuradas');
  console.log(`   Email: ${process.env.GMAIL_USER}`);
  console.log(`   Contraseña: ${'*'.repeat(process.env.GMAIL_APP_PASSWORD.length)}`);

  // Probar configuración
  console.log('\n🧪 Probando configuración de Gmail...');
  const configTest = await testEmailConfiguration();
  
  if (!configTest.success) {
    console.log('❌ Error en la configuración:', configTest.error);
    console.log('\n🔧 INSTRUCCIONES PARA CONFIGURAR GMAIL:');
    console.log('==========================================');
    console.log('');
    console.log('1️⃣ HABILITAR AUTENTICACIÓN DE 2 FACTORES:');
    console.log('   - Ve a https://myaccount.google.com/security');
    console.log('   - En "Iniciar sesión en Google", activa "Verificación en 2 pasos"');
    console.log('');
    console.log('2️⃣ GENERAR CONTRASEÑA DE APLICACIÓN:');
    console.log('   - Ve a https://myaccount.google.com/apppasswords');
    console.log('   - Selecciona "Correo" y "Otro (nombre personalizado)"');
    console.log('   - Escribe "Digit Ads Calendar" como nombre');
    console.log('   - Copia la contraseña de 16 caracteres generada');
    console.log('');
    console.log('3️⃣ CONFIGURAR VARIABLES DE ENTORNO:');
    console.log('   - Abre tu archivo .env.local');
    console.log('   - Agrega estas líneas:');
    console.log('     GMAIL_USER=tu-email@gmail.com');
    console.log('     GMAIL_APP_PASSWORD=la-contraseña-de-16-caracteres');
    console.log('');
    console.log('4️⃣ REINICIAR EL SERVIDOR:');
    console.log('   - Detén el servidor (Ctrl+C)');
    console.log('   - Ejecuta: pnpm dev');
    console.log('   - Ejecuta este script nuevamente: pnpm run setup-gmail');
    return;
  }

  console.log('✅ Configuración de Gmail verificada correctamente');

  // Probar envío de correo
  console.log('\n📧 Probando envío de correo de prueba...');
  
  const emailResult = await sendTestEmail();
  
  if (emailResult.success) {
    console.log('✅ Correo de prueba enviado exitosamente');
    console.log(`   Revisa tu bandeja de entrada: ${process.env.GMAIL_USER}`);
    console.log(`   ID del mensaje: ${emailResult.messageId}`);
  } else {
    console.log('❌ Error enviando correo de prueba:', emailResult.error);
  }

  console.log('\n🎯 CONFIGURACIÓN COMPLETADA');
  console.log('============================');
  console.log('✅ Gmail configurado correctamente');
  console.log('✅ El sistema enviará correos de confirmación automáticamente');
  console.log('✅ Los clientes recibirán un correo con todos los detalles de su reserva');
  console.log('');
  console.log('📋 PRÓXIMOS PASOS:');
  console.log('1. Crea una reserva de prueba desde el dashboard del cliente');
  console.log('2. Verifica que el correo llegue correctamente');
  console.log('3. El correo incluirá:');
  console.log('   - Fecha y horario de la reserva');
  console.log('   - Dirección de grabación');
  console.log('   - Código de reserva');
  console.log('   - Información de contacto');
  console.log('   - Instrucciones importantes');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupGmail();
}

module.exports = { setupGmail };
