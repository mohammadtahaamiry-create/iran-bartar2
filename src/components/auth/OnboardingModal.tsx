'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export function OnboardingModal({ open }: { open: boolean }) {
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('لطفاً نام خود را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'خطا در ذخیره نام');
        return;
      }
      setUser(data.user);
      toast.success(`خوش آمدید، ${data.user.firstName}!`);
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="border-border/50 shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
                    <Brain className="w-9 h-9 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl">به ایران برتر خوش آمدید</CardTitle>
                <CardDescription className="text-base">
                  برای تجربه‌ای شخصی‌سازی‌شده، نام خود را وارد کنید تا در ادامه شما را با نام صدا بزنیم.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-name">نام شما</Label>
                    <Input
                      id="onboarding-name"
                      autoFocus
                      type="text"
                      placeholder="مثلاً: علی، مریم، محمد..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      این نام فقط برای شخصی‌سازی گفت‌وگوها استفاده می‌شود و در پاسخ‌های دستیار هوشمند ظاهر خواهد شد.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : null}
                    شروع گفت‌وگو
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
