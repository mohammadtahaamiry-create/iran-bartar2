'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Brain,
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  LogOut,
  Menu,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { OverviewPanel } from '@/components/OverviewPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CmsPanel } from '@/components/cms/CmsPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { OnboardingModal } from '@/components/auth/OnboardingModal';
import { isContentAdmin } from '@/lib/content-admin';

type Tab = 'overview' | 'chat' | 'cms' | 'settings';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; desc: string; adminOnly?: boolean }[] = [
  {
    id: 'overview',
    label: 'داشبورد',
    icon: <LayoutDashboard className="w-5 h-5" />,
    desc: 'نمای کلی',
  },
  {
    id: 'chat',
    label: 'دستیار هوشمند',
    icon: <MessageSquare className="w-5 h-5" />,
    desc: 'گفت‌وگو با هوش مصنوعی',
  },
  {
    id: 'cms',
    label: 'مدیریت محتوا',
    icon: <BookOpen className="w-5 h-5" />,
    desc: 'سامانه محتوا',
  },
  {
    id: 'settings',
    label: 'تنظیمات',
    icon: <Settings className="w-5 h-5" />,
    desc: 'پیکربندی اپلیکیشن',
    adminOnly: true,
  },
];

export function AppShell() {
  const { user, logout, fetchUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  // Derive onboarding visibility from the user state directly (no effect needed)
  const showOnboarding = !!user && !user.onboarded && !user.firstName;

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await logout();
    toast.success('از حساب کاربری خارج شدید');
  };

  const handleNavigate = (newTab: Tab) => {
    setTab(newTab);
    setMobileOpen(false);
  };

  if (!user) return null;

  const userInitial = (user.firstName || user.name || user.email || 'U')
    .charAt(0)
    .toUpperCase();

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">ایران برتر</h1>
            <p className="text-xs text-muted-foreground">دستیار هوشمند</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) => !item.adminOnly || isContentAdmin(user)).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right group ${
              tab === item.id
                ? 'bg-primary text-primary-foreground glow-primary'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <span
              className={`shrink-0 ${
                tab === item.id ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
              }`}
            >
              {item.icon}
            </span>
            <div className="flex-1 min-w-0 text-right">
              <div className="font-medium text-sm">{item.label}</div>
              <div
                className={`text-xs ${
                  tab === item.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {item.desc}
              </div>
            </div>
          </button>
        ))}
      </nav>

      {/* User box */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-2">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {user.firstName || user.name || 'کاربر'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user.role === 'admin' ? 'مدیر سایت' : 'کاربر'}
            </div>
          </div>
          {user.role === 'admin' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              مدیر
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 ml-2" />
          خروج از حساب
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-3 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-72">
              {SidebarContent}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">ایران برتر</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-72 shrink-0 border-l border-border/50 bg-card/30 flex-col">
          {SidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              {tab === 'overview' && <OverviewPanel onNavigate={handleNavigate} />}
              {tab === 'chat' && <ChatPanel />}
              {tab === 'cms' && <CmsPanel />}
              {tab === 'settings' && <SettingsPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <OnboardingModal open={showOnboarding} />
    </div>
  );
}
