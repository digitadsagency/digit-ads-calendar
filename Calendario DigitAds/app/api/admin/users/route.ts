import { NextRequest, NextResponse } from 'next/server';
import { createUser, getAllUsers } from '@/lib/users';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const users = await getAllUsers();
    
    // No devolver las contraseñas
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      monthlyLimit: user.monthlyLimit,
      whatsapp: user.whatsapp,
      created_at: user.created_at,
      last_login: user.last_login,
      is_active: user.is_active,
    }));

    return NextResponse.json({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company, monthlyLimit, whatsapp } = body;

    // Validaciones
    if (!email || !password || !name || !company) {
      return NextResponse.json(
        { error: 'Email, contraseña, nombre y empresa son requeridos' },
        { status: 400 }
      );
    }

    if (monthlyLimit && (monthlyLimit < 1 || monthlyLimit > 10)) {
      return NextResponse.json(
        { error: 'El límite mensual debe estar entre 1 y 10' },
        { status: 400 }
      );
    }

    // Crear usuario
    const user = await createUser({
      email,
      password: hashPassword(password),
      name,
      company,
      monthlyLimit: monthlyLimit || 1,
      whatsapp: whatsapp || '',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        monthlyLimit: user.monthlyLimit,
        whatsapp: user.whatsapp,
        created_at: user.created_at,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
