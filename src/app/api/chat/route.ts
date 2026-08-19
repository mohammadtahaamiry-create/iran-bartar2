import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import ZAI, { type VisionMessage, type VisionMultimodalContentItem } from 'z-ai-web-dev-sdk';

export const maxDuration = 120;

interface ChatRequestBody {
  message: string;
  sessionId?: string;
  deepThinking?: boolean;
  image?: string | null; // base64 data URL
}

function buildVisionUserMessage(
  text: string,
  imageBase64?: string | null
): VisionMessage {
  if (!imageBase64) {
    return { role: 'user', content: text };
  }
  const contentItems: VisionMultimodalContentItem[] = [
    { type: 'text', text },
    { type: 'image_url', image_url: { url: imageBase64 } },
  ];
  return { role: 'user', content: contentItems };
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
    const { message, sessionId, deepThinking, image } = body;

    if ((!message || !message.trim()) && !image) {
      return NextResponse.json(
        { error: 'پیام یا تصویر الزامی است' },
        { status: 400 }
      );
    }

    const messageText = message?.trim() || 'تحلیل این تصویر';

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
          title: messageText.slice(0, 60),
        },
        include: { messages: true },
      });
    }

    // Save the user message (text only, no image blob in DB)
    await db.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: messageText,
      },
    });

    // Build history for the AI (last 10 messages, text only)
    const recentMessages = session.messages.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const userDisplayName = user.firstName || user.name || 'کاربر گرامی';
    const hasImage = !!image;

    const systemPrompt = `تو دستیار هوش مصنوعی «ایران برتر» هستی؛ یک پلتفرم حرفه‌ای فارسی‌زبان.

ویژگی‌ها و قوانین تو:
۱) همیشه به فارسی روان و محترمانه پاسخ بده.
۲) نام کاربر «${userDisplayName}» است؛ در پاسخ‌ها حداقل یک‌بار به صورت طبیعی او را با نام صدا بزن.
۳) اگر کاربر درخواست «تفکر عمیق» کرد، ابتدا مسئله را مرحله‌به‌مرحله تحلیل کن، فرضیات را بررسی کن، گزینه‌ها را بسنج و در پایان به یک جمع‌بندی دقیق برس.
۴) برای مسائل علمی، فنی یا پیچیده، پاسخ ساختاریافته با عنوان‌بندی و بولت ارائه کن.
۵) اگر اطلاعات کافی نداری، صادقانه اعتراف کن و راهکار پیشنهاد بده.
۶) در پاسخ از فرمت Markdown استفاده کن تا خوانایی بالا باشد.
۷) در صورت مناسب بودن، مثال‌های عملی و کاربردی ارائه بده.
${hasImage ? '۸) کاربر یک تصویر ارسال کرده است. آن را با دقت تحلیل کن و توضیحات دقیقی ارائه بده.' : ''}

محتوای گفت‌وگوی فعلی:
- کاربر: ${userDisplayName}
- وضعیت تفکر عمیق: ${deepThinking ? 'فعال' : 'غیرفعال'}`;

    const zai = await ZAI.create();

    // When there is an image, we must use createVision
    if (hasImage) {
      // Build vision messages
      const visionMessages: VisionMessage[] = [
        { role: 'assistant', content: systemPrompt },
        ...recentMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        buildVisionUserMessage(messageText, image),
      ];

      let thinkingContent = '';

      // Deep thinking with image
      if (deepThinking) {
        const thinkingSystem = `تو یک موتور تحلیل و تفکر عمیق هستی. کاربر با نام «${userDisplayName}» این پرسش را مطرح کرده است (شامل یک تصویر):

"""
${messageText}
"""

تصویر ضمیمه شده است. آن را تحلیل کن.

وظیفه تو:
۱) مسئله را به بخش‌های کوچک‌تر تجزیه کن.
۲) فرضیات و مفاهیم کلیدی را فهرست کن.
۳) گزینه‌ها و رویکردهای ممکن را بسنج.
۴) مخاطرات و نکات ظریف را بررسی کن.
۵) در پایان جمع‌بندی کوتاهی از نتیجه تحلیل ارائه بده.

خروجی را به صورت متن ساده فارسی و بدون Markdown بنویس.`;

        try {
          const thinkingVisionMessages: VisionMessage[] = [
            { role: 'assistant', content: thinkingSystem },
            buildVisionUserMessage('تحلیل عمیق خود را شروع کن.', image),
          ];
          const thinkingCompletion = await zai.chat.completions.createVision({
            model: 'glm-4v-flash',
            messages: thinkingVisionMessages,
            thinking: { type: 'enabled' },
          });
          thinkingContent =
            thinkingCompletion.choices?.[0]?.message?.content || '';
          thinkingContent = thinkingContent.replace(/^#+\s+/gm, '');
        } catch (err) {
          console.error('Vision thinking step error:', err);
        }
      }

      const completion = await zai.chat.completions.createVision({
        model: 'glm-4v-flash',
        messages: visionMessages,
        thinking: { type: deepThinking ? 'enabled' : 'disabled' },
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
    }

    // Text-only path (original logic)
    const aiMessages = [
      { role: 'assistant' as const, content: systemPrompt },
      ...recentMessages,
      { role: 'user' as const, content: messageText },
    ];

    let thinkingContent = '';

    // Deep thinking: produce a separate chain-of-thought analysis first
    if (deepThinking) {
      const thinkingSystem = `تو یک موتور تحلیل و تفکر عمیق هستی. کاربر با نام «${userDisplayName}» این پرسش را مطرح کرده است:

"""
${messageText}
"""

وظیفه تو:
۱) مسئله را به بخش‌های کوچک‌تر تجزیه کن.
۲) فرضیات و مفاهیم کلیدی را فهرست کن.
۳) گزینه‌ها و رویکردهای ممکن را بسنج.
۴) مخاطرات و نکات ظریف را بررسی کن.
۵) در پایان جمع‌بندی کوتاهی از نتیجه تحلیل ارائه بده.

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
