import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isContentAdmin } from '@/lib/auth';

function slugify(text: string): string {
  return (
    text
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
      .toLowerCase()
      .slice(0, 80) +
    '-' +
    Date.now().toString(36)
  );
}

// GET - list published content (public) or all content (for author)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    const user = await getCurrentUser();

    const where: any = {};
    if (status === 'published') {
      where.status = 'published';
    } else if (status === 'mine' && user) {
      where.authorId = user.id;
    } else if (status === 'all' && isContentAdmin(user)) {
      // Only the content admin sees drafts and all content
      // no filter
    } else {
      where.status = 'published';
    }
    if (category && category !== 'all') {
      where.category = category;
    }

    const contents = await db.content.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: {
          select: { id: true, firstName: true, name: true },
        },
      },
    });

    return NextResponse.json({ contents });
  } catch (err) {
    console.error('CMS list error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت محتوا' },
      { status: 500 }
    );
  }
}

// POST - create content (content admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'برای ایجاد محتوا ابتدا وارد شوید' },
        { status: 401 }
      );
    }
    if (!isContentAdmin(user)) {
      return NextResponse.json(
        {
          error: 'افزودن محتوا فقط برای مدیر سایت مجاز است',
        },
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

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'عنوان محتوا الزامی است' },
        { status: 400 }
      );
    }
    if (!contentBody || !contentBody.trim()) {
      return NextResponse.json(
        { error: 'متن محتوا الزامی است' },
        { status: 400 }
      );
    }

    const finalStatus =
      status === 'published' ? 'published' : 'draft';

    const content = await db.content.create({
      data: {
        slug: slugify(title),
        title: title.trim(),
        body: contentBody,
        excerpt: excerpt?.trim() || contentBody.slice(0, 180),
        category: category?.trim() || 'عمومی',
        tags: tags?.trim() || '',
        status: finalStatus,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, firstName: true, name: true },
        },
      },
    });

    return NextResponse.json({ content });
  } catch (err) {
    console.error('CMS create error:', err);
    return NextResponse.json(
      { error: 'خطا در ایجاد محتوا' },
      { status: 500 }
    );
  }
}
