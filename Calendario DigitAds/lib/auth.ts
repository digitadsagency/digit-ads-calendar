import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { ClientUser } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

// Crear token JWT para usuario
export async function createUserToken(user: ClientUser): Promise<string> {
  const token = await new SignJWT({ 
    userId: user.id, 
    email: user.email,
    name: user.name,
    company: user.company,
    monthlyLimit: user.monthlyLimit
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Token válido por 30 días
    .sign(JWT_SECRET);

  return token;
}

// Verificar token JWT de usuario
export async function verifyUserToken(token: string): Promise<{ userId: string; email: string; name: string; company: string; monthlyLimit: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      company: payload.company as string,
      monthlyLimit: payload.monthlyLimit as number,
    };
  } catch (error) {
    console.error('Error verificando token de usuario:', error);
    return null;
  }
}

// Obtener usuario autenticado desde request
export async function getAuthenticatedUser(request: NextRequest): Promise<{ userId: string; email: string; name: string; company: string; monthlyLimit: number } | null> {
  try {
    const token = request.cookies.get('user-token')?.value;
    if (!token) {
      return null;
    }

    return await verifyUserToken(token);
  } catch (error) {
    console.error('Error obteniendo usuario autenticado:', error);
    return null;
  }
}

// Hash de contraseña simple (en producción usar bcrypt)
export function hashPassword(password: string): string {
  // Por ahora guardamos la contraseña tal cual para facilitar el testing
  // En producción deberías usar bcrypt
  return password;
}

// Verificar contraseña
export function verifyPassword(password: string, hashedPassword: string): boolean {
  // Como guardamos la contraseña tal cual, comparamos directamente
  return password === hashedPassword;
}
