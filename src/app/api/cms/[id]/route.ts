import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - fetch a single content by id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await db.content.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, name: true, email: true },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: 'محتوا یافت نشد' }, { status: 404 });
    }

    const user = await getCurrentUser();
    if (
      content.status !== 'published' &&
      content.authorId !== user?.id &&
      user?.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error('CMS get error:', err);
    return NextResponse.json({ error: 'خطا در دریافت محتوا' }, { status: 500 });
  }
}

// PUT - update content
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'برای ویرایش محتوا ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    const existing = await db.content.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'محتوا یافت نشد' }, { status: 404 });
    }
    if (existing.authorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'شما مجاز به ویرایش این محتوا نیستید' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, body: contentBody, excerpt, category, tags, status } = body as {
      title?: string;
      body?: string;
      excerpt?: string;
      category?: string;
      tags?: string;
      status?: string;
    };

    const finalStatus =
      status === 'published'
        ? 'published'
        : status === 'draft'
        ? 'draft'
        : existing.status;

    const updated = await db.content.update({
      where: { id },
      data: {
        title: title?.trim() || existing.title,
        body: contentBody ?? existing.body,
        excerpt: excerpt?.trim() || existing.excerpt,
        category: category?.trim() || existing.category,
        tags: tags?.trim() ?? existing.tags,
        status: finalStatus,
      },
      include: {
        author: {
          select: { id: true, firstName: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ content: updated });
  } catch (err) {
    console.error('CMS update error:', err);
    return NextResponse.json({ error: 'خطا در ویرایش محتوا' }, { status: 500 });
  }
}

// DELETE - remove content
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'برای حذف محتوا ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    const existing = await db.content.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'محتوا یافت نشد' }, { status: 404 });
    }
    if (existing.authorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'شما مجاز به حذف این محتوا نیستید' },
        { status: 403 }
      );
    }

    await db.content.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('CMS delete error:', err);
    return NextResponse.json({ error: 'خطا در حذف محتوا' }, { status: 500 });
  }
}
