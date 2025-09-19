import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      
      if (payload.role !== 'admin') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      return NextResponse.json({ success: true, role: payload.role });
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
