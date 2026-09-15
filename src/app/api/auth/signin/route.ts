import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  createSessionToken,
  saveSession,
  SESSION_COOKIE,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور نادرست است' },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    await saveSession(user.id, token);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        name: user.name,
        role: user.role,
        onboarded: user.onboarded,
      },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      // secure: true,  // enable when behind HTTPS reverse proxy in production
    });
    return response;
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json(
      { error: 'خطای سرور هنگام ورود' },
      { status: 500 }
    );
  }
}
