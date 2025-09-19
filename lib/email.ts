import nodemailer from 'nodemailer';

// Configuración del transporter de Gmail
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Tu email de Gmail
      pass: process.env.GMAIL_APP_PASSWORD, // Contraseña de aplicación de Gmail
    },
  });
}

// Interfaz para datos de reserva
interface ReservationEmailData {
  cliente_nombre: string;
  empresa_marca: string;
  fecha: string;
  bloque: string;
  horario: string;
  direccion_grabacion: string;
  codigo_reserva: string;
  correo: string;
  notas?: string;
}

// Función para formatear fecha en español
function formatDateForEmail(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Función para formatear bloque de tiempo
function formatBlockForEmail(block: string, horario: string): string {
  if (horario) {
    return horario;
  }
  return block === 'Mañana' ? '10:00 - 13:00' : '16:00 - 17:30';
}

// Función para generar el HTML del correo
function generateEmailHTML(data: ReservationEmailData): string {
  const formattedDate = formatDateForEmail(data.fecha);
  const formattedBlock = formatBlockForEmail(data.bloque, data.horario);
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Reserva - Digit Ads</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
        }
        .reservation-details {
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #4a5568;
        }
        .detail-value {
          color: #2d3748;
        }
        .code-highlight {
          background-color: #2563eb;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .contact-info {
          background-color: #e6f3ff;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning {
          background-color: #fef3cd;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 5px;
        }
        .warning-text {
          color: #78350f;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎬 Digit Ads</div>
          <div class="subtitle">Agenda de Grabación</div>
        </div>

        <h2 style="color: #2563eb; margin-bottom: 20px;">¡Reserva Confirmada!</h2>
        
        <p>Hola <strong>${data.cliente_nombre}</strong>,</p>
        
        <p>Tu reserva de grabación ha sido confirmada exitosamente. Aquí tienes todos los detalles:</p>

        <div class="reservation-details">
          <div class="detail-row">
            <span class="detail-label">📅 Fecha:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">⏰ Horario:</span>
            <span class="detail-value">${formattedBlock}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🏢 Empresa/Marca:</span>
            <span class="detail-value">${data.empresa_marca}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📍 Dirección de Grabación:</span>
            <span class="detail-value">${data.direccion_grabacion}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🔑 Código de Reserva:</span>
            <span class="detail-value"><span class="code-highlight">${data.codigo_reserva}</span></span>
          </div>
        </div>

        ${data.notas ? `
          <div class="contact-info">
            <strong>📝 Notas adicionales:</strong><br>
            ${data.notas}
          </div>
        ` : ''}

        <div class="warning">
          <div class="warning-title">⚠️ Información Importante:</div>
          <div class="warning-text">
            • Por favor llega 15 minutos antes de tu horario programado<br>
            • Si necesitas cancelar, puedes hacerlo hasta 24 horas antes<br>
            • Guarda este correo como comprobante de tu reserva<br>
            • Tu código de reserva es: <strong>${data.codigo_reserva}</strong>
          </div>
        </div>

        <div class="contact-info">
          <strong>📞 ¿Necesitas ayuda?</strong><br>
          Si tienes alguna pregunta o necesitas hacer cambios, no dudes en contactarnos.
        </div>

        <div class="footer">
          <p>Gracias por elegir <strong>Digit Ads</strong> para tu proyecto de grabación.</p>
          <p>¡Esperamos verte pronto!</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #999;">
            Este es un correo automático, por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Función para generar el texto plano del correo
function generateEmailText(data: ReservationEmailData): string {
  const formattedDate = formatDateForEmail(data.fecha);
  const formattedBlock = formatBlockForEmail(data.bloque, data.horario);
  
  return `
🎬 DIGIT ADS - AGENDA DE GRABACIÓN
=====================================

¡Reserva Confirmada!

Hola ${data.cliente_nombre},

Tu reserva de grabación ha sido confirmada exitosamente. Aquí tienes todos los detalles:

📅 FECHA: ${formattedDate}
⏰ HORARIO: ${formattedBlock}
🏢 EMPRESA/MARCA: ${data.empresa_marca}
📍 DIRECCIÓN DE GRABACIÓN: ${data.direccion_grabacion}
🔑 CÓDIGO DE RESERVA: ${data.codigo_reserva}

${data.notas ? `📝 NOTAS ADICIONALES: ${data.notas}\n` : ''}

⚠️ INFORMACIÓN IMPORTANTE:
• Por favor llega 15 minutos antes de tu horario programado
• Si necesitas cancelar, puedes hacerlo hasta 24 horas antes
• Guarda este correo como comprobante de tu reserva
• Tu código de reserva es: ${data.codigo_reserva}

📞 ¿NECESITAS AYUDA?
Si tienes alguna pregunta o necesitas hacer cambios, no dudes en contactarnos.

Gracias por elegir Digit Ads para tu proyecto de grabación.
¡Esperamos verte pronto!

---
Este es un correo automático, por favor no respondas a este mensaje.
  `.trim();
}

// Función principal para enviar correo de confirmación
export async function sendBookingConfirmation(data: ReservationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Variables de entorno de Gmail no configuradas');
      return { 
        success: false, 
        error: 'Configuración de correo no disponible' 
      };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Digit Ads - Agenda de Grabación',
        address: process.env.GMAIL_USER
      },
      to: data.correo,
      subject: `✅ Reserva Confirmada - ${data.codigo_reserva} | Digit Ads`,
      text: generateEmailText(data),
      html: generateEmailHTML(data),
    };

    console.log(`📧 Enviando correo de confirmación a: ${data.correo}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Correo enviado exitosamente:', result.messageId);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Función para verificar la configuración de correo
export async function testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
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