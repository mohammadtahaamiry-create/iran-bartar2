'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, BookOpen, TrendingUp, Zap, Shield } from 'lucide-react';

interface Props {
  onNavigate: (tab: 'chat' | 'cms') => void;
}

export function OverviewPanel({ onNavigate }: Props) {
  const { user } = useAuthStore();
  const name = user?.firstName || user?.name || 'کاربر گرامی';

  const formatDate = () => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date());
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 md:p-8 space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-sm text-muted-foreground mb-1">{formatDate()}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            سلام {name}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            به پلتفرم هوش مصنوعی ایران برتر خوش آمدید. امروز چه کاری می‌توانم
            برای شما انجام دهم؟
          </p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Brain className="w-5 h-5" />}
            label="گفت‌وگوهای هوش مصنوعی"
            value="نامحدود"
            color="from-primary to-primary/60"
          />
          <StatCard
            icon={<Sparkles className="w-5 h-5" />}
            label="تفکر عمیق"
            value="فعال"
            color="from-amber-500 to-orange-500"
          />
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            label="حساب کاربری"
            value={user?.role === 'admin' ? 'مدیر' : 'فعال'}
            color="from-emerald-500 to-teal-500"
          />
        </div>

        {/* Main action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionCard
            title="دستیار هوشمند"
            description="با هوش مصنوعی ایران برتر گفت‌وگو کنید. می‌توانید حالت «تفکر عمیق» را برای تحلیل دقیق‌تر فعال کنید."
            icon={<Brain className="w-8 h-8" />}
            cta="شروع گفت‌وگو"
            onClick={() => onNavigate('chat')}
            gradient="from-primary/20 to-primary/5"
          />
          <ActionCard
            title="مدیریت محتوا"
            description="مقالات و محتوای خود را ایجاد، ویرایش یا منتشر کنید. سامانه کامل مدیریت محتوای فارسی."
            icon={<BookOpen className="w-8 h-8" />}
            cta="ورود به مدیریت محتوا"
            onClick={() => onNavigate('cms')}
            gradient="from-emerald-500/20 to-emerald-500/5"
          />
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                امکانات پلتفرم
              </CardTitle>
              <CardDescription>
                ویژگی‌های حرفه‌ای ایران برتر برای تجربه‌ای بی‌نقص
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Feature
                  title="هوش مصنوعی پیشرفته"
                  desc="مدل‌های زبانی قدرتمند با پشتیبانی کامل از زبان فارسی و درک عمیق مطالب."
                  icon={<Brain className="w-5 h-5" />}
                />
                <Feature
                  title="تفکر عمیق (Deep Thinking)"
                  desc="تحلیل مرحله‌به‌مرحله مسائل پیچیده با نمایش زنجیره تفکر برای شفافیت کامل."
                  icon={<Sparkles className="w-5 h-5" />}
                />
                <Feature
                  title="مدیریت محتوای حرفه‌ای"
                  desc="ایجاد، ویرایش و انتشار محتوا با پشتیبانی از Markdown، دسته‌بندی و برچسب‌گذاری."
                  icon={<BookOpen className="w-5 h-5" />}
                />
                <Feature
                  title="امنیت و حریم خصوصی"
                  desc="احراز هویت چندلایه با رمزنگاری salted hash و جلسات امن."
                  icon={<Shield className="w-5 h-5" />}
                />
                <Feature
                  title="شخصی‌سازی هوشمند"
                  desc="سیستم شما را با نام می‌شناسد و تجربه‌ای کاملاً شخصی ارائه می‌دهد."
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <Feature
                  title="رابط فارسی راست‌چین"
                  desc="طراحی کاملاً فارسی و راست‌چین با فونت Vazirmatn و تجربه کاربری بومی."
                  icon={<Sparkles className="w-5 h-5" />}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}
          >
            {icon}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  icon,
  cta,
  onClick,
  gradient,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  cta: string;
  onClick: () => void;
  gradient: string;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-all overflow-hidden"
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-bl ${gradient} pointer-events-none`} />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground glow-primary">
            {icon}
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>
        <Badge variant="secondary" className="cursor-pointer">
          {cta} ←
        </Badge>
      </CardContent>
    </Card>
  );
}

function Feature({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <div className="font-medium text-sm mb-1">{title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
