import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Повертаємо назву 'proxy', яку чітко очікує Next.js
export function proxy(request: NextRequest) {
  const token = request.cookies.get('jwt_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = pathname.startsWith('/booking') || pathname.startsWith('/profile');

  // 1. Якщо шлях захищений, а токена немає — кидаємо на авторизацію
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth', request.url);
    
    // Запам'ятовуємо сторінку, на яку користувач хотів потрапити
    loginUrl.searchParams.set('callbackUrl', pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  // 2. Якщо авторизований користувач намагається зайти на сторінку входу
  if (pathname === '/auth' && token) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

// Конфігурація маршрутів
export const config = {
  matcher: ['/booking/:path*', '/profile/:path*', '/auth'],
};