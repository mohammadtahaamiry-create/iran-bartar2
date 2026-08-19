import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'برای ادامه ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { firstName } = body as { firstName?: string };

    if (!firstName || !firstName.trim()) {
      return NextResponse.json(
        { error: 'نام خود را وارد کنید' },
        { status: 400 }
      );
    }

    const trimmed = firstName.trim();
    if (trimmed.length > 50) {
      return NextResponse.json(
        { error: 'نام نباید بیش از ۵۰ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        firstName: trimmed,
        name: trimmed,
        onboarded: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        name: true,
        role: true,
        onboarded: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('Onboarding error:', err);
    return NextResponse.json(
      { error: 'خطای سرور هنگام ذخیره نام' },
      { status: 500 }
    );
  }
}
