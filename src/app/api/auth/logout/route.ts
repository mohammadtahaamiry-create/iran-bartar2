import { NextResponse } from 'next/server';
import { SESSION_COOKIE, destroySession } from '@/lib/auth';

export async function POST() {
  try {
    destroySession(undefined);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
