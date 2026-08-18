'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { Brain, Shield, Sparkles, BookOpen, Loader2 } from 'lucide-react';

export function AuthScreen() {
  const { setUser, fetchUser } = useAuthStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'خطا در ورود');
        return;
      }
      setUser(data.user);
      toast.success('خوش آمدید!');
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          firstName: signupName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'خطا در ثبت‌نام');
        return;
      }
      await fetchUser();
      toast.success('حساب کاربری شما ایجاد شد');
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center"
      >
        <div className="hidden lg:flex flex-col gap-6 p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ایران برتر</h1>
              <p className="text-sm text-muted-foreground">دستیار هوشمند فارسی</p>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold leading-tight"
          >
            هوش مصنوعی پیشرفته
            <br />
            <span className="text-primary">برای ایرانِ برتر</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg leading-relaxed"
          >
            پلتفرم حرفه‌ای هوش مصنوعی با قابلیت تفکر عمیق، مدیریت محتوای پیشرفته
            و تجربه‌ای کاملاً فارسی و راست‌چین.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 gap-3"
          >
            <FeatureItem
              icon={<Sparkles className="w-5 h-5 text-primary" />}
              title="تفکر عمیق"
              desc="تحلیل مرحله‌به‌مرحله و پاسخ‌های ساختاریافته"
            />
            <FeatureItem
              icon={<Shield className="w-5 h-5 text-primary" />}
              title="امنیت حرفه‌ای"
              desc="احراز هویت چندلایه و رمزنگاری شده"
            />
            <FeatureItem
              icon={<BookOpen className="w-5 h-5 text-primary" />}
              title="مدیریت محتوا"
              desc="سامانه کامل مدیریت محتوای فارسی"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50 backdrop-blur-sm bg-card/80">
            <CardHeader className="text-center">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
                  <Brain className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">ایران برتر</CardTitle>
              <CardDescription>ورود یا ساخت حساب کاربری</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as 'signin' | 'signup')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">ورود</TabsTrigger>
                  <TabsTrigger value="signup">ثبت‌نام</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">ایمیل</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        dir="ltr"
                        placeholder="you@example.com"
                        value={signinEmail}
                        onChange={(e) => setSigninEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">رمز عبور</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        dir="ltr"
                        placeholder="••••••••"
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : null}
                      ورود به ایران برتر
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">نام (دلخواه)</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="نام خود را وارد کنید"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">ایمیل</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        dir="ltr"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">رمز عبور</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        dir="ltr"
                        placeholder="حداقل ۶ کاراکتر"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : null}
                      ساخت حساب کاربری
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-muted-foreground text-center mt-6">
                با ورود یا ثبت‌نام، شما قوانین ایران برتر را می‌پذیرید.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
