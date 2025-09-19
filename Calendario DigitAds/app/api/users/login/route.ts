import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/users';
import { verifyPassword, createUserToken } from '@/lib/auth';
import { UserLoginRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: UserLoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('Usuario no encontrado:', email);
      return NextResponse.json(
        { error: 'Usuario no encontrado. Verifica tu email.' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      console.log('Usuario inactivo:', email);
      return NextResponse.json(
        { error: 'Tu cuenta está desactivada. Contacta al administrador.' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    console.log('Verificando contraseña para:', email);
    console.log('Contraseña ingresada:', password);
    console.log('Contraseña guardada:', user.password);
    
    if (!verifyPassword(password, user.password)) {
      console.log('Contraseña incorrecta para:', email);
      return NextResponse.json(
        { error: 'Contraseña incorrecta. Verifica tu contraseña.' },
        { status: 401 }
      );
    }

    // Crear token
    const token = await createUserToken(user);

    // Crear respuesta con cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        monthlyLimit: user.monthlyLimit,
      },
    });

    // Establecer cookie
    response.cookies.set('user-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 días
    });

    return response;
  } catch (error) {
    console.error('Error en login de usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
