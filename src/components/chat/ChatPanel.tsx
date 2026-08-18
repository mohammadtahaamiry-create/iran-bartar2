'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Brain,
  Sparkles,
  Loader2,
  Trash2,
  ChevronDown,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string | null;
  showThinking?: boolean;
}

export function ChatPanel() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [deepThinking, setDeepThinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          deepThinking,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'خطا در ارسال پیام');
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: `متأسفم، خطایی رخ داد: ${data.error || 'نامشخص'}`,
          },
        ]);
        return;
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        thinking: data.thinking || null,
        showThinking: false,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.sessionId) setSessionId(data.sessionId);
    } catch (err: any) {
      toast.error(`خطا: ${err?.message || 'نامشخص'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  const toggleThinking = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, showThinking: !m.showThinking } : m))
    );
  };

  const greeting = user?.firstName || user?.name || 'کاربر گرامی';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">دستیار هوشمند ایران برتر</h2>
            <p className="text-xs text-muted-foreground">
              سلام {greeting}! چطور می‌توانم کمکتان کنم؟
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <Trash2 className="w-4 h-4 ml-1" />
            پاک کردن گفت‌وگو
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef as any}>
          <div className="p-4 space-y-4 min-h-full">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center mb-4 glow-primary">
                  <Brain className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  سلام {greeting}! 👋
                </h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  من دستیار هوشمند ایران برتر هستم. هر سؤالی دارید بپرسید؛ اگر
                  حالت «تفکر عمیق» را فعال کنید، مسئله را مرحله‌به‌مرحله تحلیل
                  می‌کنم و به نتیجه دقیق‌تری می‌رسم.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  <SuggestionCard
                    title="تحلیل یک مسئله پیچیده"
                    desc="با تفکر عمیق، گزینه‌ها را بسنج"
                    onClick={() => {
                      setDeepThinking(true);
                      setInput('یک مسئله علمی یا پیچیده را تحلیل کن');
                    }}
                  />
                  <SuggestionCard
                    title="نوشتن یک متن حرفه‌ای"
                    desc="مقاله، ایمیل یا گزارش کاری"
                    onClick={() => {
                      setInput('یک ایمیل رسمی برای درخواست جلسه بنویس');
                    }}
                  />
                  <SuggestionCard
                    title="یادگیری یک مفهوم"
                    desc="با مثال و توضیح ساده"
                    onClick={() => {
                      setInput('مفهوم هوش مصنوعی را با مثال ساده توضیح بده');
                    }}
                  />
                  <SuggestionCard
                    title="برنامه‌ریزی و مشاوره"
                    desc="برای کار، یادگیری یا زندگی"
                    onClick={() => {
                      setInput('یک برنامه مطالعه هفتگی برای من طراحی کن');
                    }}
                  />
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      m.role === 'user'
                        ? 'bg-secondary'
                        : 'bg-gradient-to-br from-primary to-primary/60 glow-primary'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Brain className="w-5 h-5 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={`flex-1 min-w-0 max-w-[85%] ${
                      m.role === 'user' ? 'items-end' : 'items-start'
                    } flex flex-col gap-1`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        m.role === 'user'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-card border border-border/50'
                      }`}
                    >
                      {m.role === 'assistant' ? (
                        <div className="prose-persian text-sm md:text-base">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                          {m.content}
                        </p>
                      )}
                    </div>

                    {/* Thinking toggle */}
                    {m.thinking && (
                      <div className="w-full">
                        <button
                          onClick={() => toggleThinking(m.id)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {m.showThinking ? 'بستن فرآیند تفکر' : 'نمایش فرآیند تفکر'}
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              m.showThinking ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {m.showThinking && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 rounded-lg bg-muted/50 border border-border/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                <div className="flex items-center gap-1 mb-2 text-primary font-medium">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  زنجیره تفکر (Chain of Thought)
                                </div>
                                {m.thinking}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 flex-row"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-card border border-border/50">
                  {deepThinking ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>در حال تفکر عمیق...</span>
                      <div className="flex gap-1 mr-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال تولید پاسخ...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4 bg-card/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Switch
              id="deep-thinking"
              checked={deepThinking}
              onCheckedChange={setDeepThinking}
            />
            <Label htmlFor="deep-thinking" className="text-sm cursor-pointer flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              تفکر عمیق
            </Label>
          </div>
          {deepThinking && (
            <Badge variant="secondary" className="text-xs">
              تحلیل مرحله‌به‌مرحله فعال
            </Badge>
          )}
        </div>
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`پیام خود را بنویسید، ${greeting}...`}
            className="resize-none min-h-[52px] max-h-[200px] flex-1"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-[52px] w-[52px] shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-right p-3 rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-primary/50 transition-all text-right"
    >
      <div className="font-medium text-sm mb-1">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}
