import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 120;

interface ChatRequestBody {
  message: string;
  sessionId?: string;
  deepThinking?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'برای استفاده از دستیار هوشمند ابتدا وارد شوید' },
        { status: 401 }
      );
    }

    const body = (await req.json()) as ChatRequestBody;
    const { message, sessionId, deepThinking } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'پیام خالی است' },
        { status: 400 }
      );
    }

    // Get or create a session
    let session;
    if (sessionId) {
      session = await db.chatSession.findFirst({
        where: { id: sessionId, userId: user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }
    if (!session) {
      session = await db.chatSession.create({
        data: {
          userId: user.id,
          title: message.slice(0, 60),
        },
        include: { messages: true },
      });
    }

    // Save the user message
    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message.trim(),
      },
    });

    // Build history for the AI (last 10 messages)
    const recentMessages = session.messages.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const userDisplayName = user.firstName || user.name || 'کاربر گرامی';

    const systemPrompt = `تو دستیار هوش مصنوعی «ایران برتر» هستی؛ یک پلتفرم حرفه‌ای فارسی‌زبان.

ویژگی‌ها و قوانین تو:
۱) همیشه به فارسی روان و محترمانه پاسخ بده.
۲) نام کاربر «${userDisplayName}» است؛ در پاسخ‌ها حداقل یک‌بار به صورت طبیعی او را با نام صدا بزن.
۳) اگر کاربر درخواست «تفکر عمیق» کرد، ابتدا مسئله را مرحله‌به‌مرحله تحلیل کن، فرضیات را بررسی کن، گزینه‌ها را بسنج و در پایان به یک جمع‌بندی دقیق برس.
۴) برای مسائل علمی، فنی یا پیچیده، پاسخ ساختاریافته با عنوان‌بندی و بولت ارائه کن.
۵) اگر اطلاعات کافی نداری، صادقانه اعتراف کن و راهکار پیشنهاد بده.
۶) در پاسخ از فرمت Markdown استفاده کن تا خوانایی بالا باشد.
۷) در صورت مناسب بودن، مثال‌های عملی و کاربردی ارائه بده.

محتوای گفت‌وگوی فعلی:
- کاربر: ${userDisplayName}
- وضعیت تفکر عمیق: ${deepThinking ? 'فعال' : 'غیرفعال'}`;

    const zai = await ZAI.create();

    const aiMessages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...recentMessages,
      { role: 'user' as const, content: message.trim() },
    ];

    let thinkingContent = '';

    // Deep thinking: produce a separate chain-of-thought analysis first
    if (deepThinking) {
      const thinkingSystem = `تو یک موتور تحلیل و تفکر عمیق هستی. کاربر با نام «${userDisplayName}» این پرسش را مطرح کرده است:

"""
${message.trim()}
"""

وظیفه تو:
۱) مسئله را به بخش‌های کوچک‌تر تجزیه کن.
۲) فرضیات و مفاهیم کلیدی را فهرست کن.
۳) گزینه‌ها و رویکردهای ممکن را بسنج.
۳) مخاطرات و نکات ظریف را بررسی کن.
۴) در پایان جمع‌بندی کوتاهی از نتیجه تحلیل ارائه بده.

خروجی را به صورت متن ساده فارسی و بدون Markdown بنویس. این یک تحلیل داخلی است و کاربر آن را به‌عنوان «زنجیره تفکر» می‌بیند.`;

      try {
        const thinkingCompletion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: thinkingSystem },
            { role: 'user', content: 'تحلیل عمیق خود را شروع کن.' },
          ],
          thinking: { type: 'enabled' },
          temperature: 0.3,
          max_tokens: 2048,
        });
        thinkingContent =
          thinkingCompletion.choices?.[0]?.message?.content || '';
        // Strip markdown headings if any
        thinkingContent = thinkingContent.replace(/^#+\s+/gm, '');
      } catch (err) {
        console.error('Thinking step error:', err);
      }
    }

    const completion = await zai.chat.completions.create({
      messages: aiMessages,
      thinking: { type: deepThinking ? 'enabled' : 'disabled' },
      temperature: deepThinking ? 0.3 : 0.7,
      max_tokens: deepThinking ? 4096 : 2048,
    });

    const replyContent =
      completion.choices?.[0]?.message?.content || 'متأسفم، پاسخی دریافت نشد.';

    // Save assistant reply
    const savedAssistant = await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: replyContent,
        thinking: deepThinking && thinkingContent ? thinkingContent : null,
      },
    });

    return NextResponse.json({
      reply: replyContent,
      thinking: deepThinking && thinkingContent ? thinkingContent : null,
      sessionId: session.id,
      messageId: savedAssistant.id,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    const msg = err?.message || 'خطای ناشناخته';
    return NextResponse.json(
      { error: `خطا در پردازش گفت‌وگو: ${msg}` },
      { status: 500 }
    );
  }
}
