'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Key,
  Cpu,
  ToggleLeft,
  Info,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  TestTube2,
  Shield,
  Database,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { isContentAdmin } from '@/lib/content-admin';

interface SettingItem {
  key: string;
  label: string;
  description: string;
  category: string;
  isSecret: boolean;
  type: string;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  value: string;
  isConfigured: boolean;
  updatedAt?: string;
}

interface Category {
  label: string;
  items: SettingItem[];
}

interface CategoriesData {
  categories: Record<string, Category>;
  admin: { id: string; firstName: string | null; role: string };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  api_keys: <Key className="w-5 h-5" />,
  models: <Cpu className="w-5 h-5" />,
  features: <ToggleLeft className="w-5 h-5" />,
  general: <Info className="w-5 h-5" />,
  appearance: <SettingsIcon className="w-5 h-5" />,
};

const CATEGORY_ORDER = ['api_keys', 'models', 'features', 'general', 'appearance'];

export function SettingsPanel() {
  const { user } = useAuthStore();
  const [data, setData] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('api_keys');
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || 'خطا در دریافت تنظیمات';
        setError(msg);
        toast.error(msg);
        return;
      }
      setData(json);
      setDraftValues({});
    } catch (err) {
      const msg = 'خطا در ارتباط با سرور';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  };

  const getCurrentValue = (item: SettingItem): string => {
    if (item.key in draftValues) return draftValues[item.key];
    return item.value || '';
  };

  const hasChanges = Object.keys(draftValues).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: draftValues }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'خطا در ذخیره');
        return;
      }
      toast.success('تنظیمات با موفقیت ذخیره شد');
      setDraftValues({});
      await fetchSettings();
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/test', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setTestResult({
          ok: true,
          message: `اتصال موفق بود. پاسخ سرور: "${json.reply}" — زمان: ${json.elapsedMs}ms`,
        });
        toast.success('کلید API معتبر است');
      } else {
        setTestResult({
          ok: false,
          message: json.error || json.message || 'کلید نامعتبر است',
        });
        toast.error('کلید API کار نمی‌کند');
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message || 'خطای شبکه' });
    } finally {
      setTesting(false);
    }
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Quick-save a single model setting immediately
  const [quickSaving, setQuickSaving] = useState<string | null>(null);
  const handleQuickModelSave = async (key: string, value: string) => {
    setQuickSaving(key);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: { [key]: value } }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'خطا در ذخیره مدل');
        return;
      }
      toast.success('مدل ذخیره شد');
      // Remove from draft if it was there, and refresh data
      setDraftValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await fetchSettings();
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setQuickSaving(null);
    }
  };

  // Model items from the models category
  const modelItems = data?.categories?.['models']?.items || [];

  // ---- Render guards ----
  if (!isContentAdmin(user)) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-8">
        <Shield className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">دسترسی محدود</h2>
        <p className="text-muted-foreground max-w-md">
          این بخش فقط برای مدیر سایت قابل مشاهده است. اگر مدیر هستید، با حساب
          مدیر وارد شوید.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">در حال بارگذاری تنظیمات...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400/60 mb-3" />
        <h2 className="text-lg font-semibold mb-2">خطا در بارگذاری تنظیمات</h2>
        <p className="text-muted-foreground mb-4">{error || 'داده‌ای دریافت نشد'}</p>
        <Button variant="outline" onClick={fetchSettings}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const categories = data.categories;

  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
      {/* Sidebar - categories */}
      <aside className="lg:w-64 shrink-0 border-l border-border/50 bg-card/30 overflow-y-auto">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
              <SettingsIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">تنظیمات</h2>
              <p className="text-xs text-muted-foreground">پیکربندی اپلیکیشن</p>
            </div>
          </div>
        </div>
        <nav className="p-2 flex lg:flex-col gap-1 overflow-x-auto">
          {CATEGORY_ORDER.map((catKey) => {
            const cat = categories[catKey];
            if (!cat) return null;
            return (
              <button
                key={catKey}
                onClick={() => setActiveCategory(catKey)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-right whitespace-nowrap ${
                  activeCategory === catKey
                    ? 'bg-primary text-primary-foreground glow-primary'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <span className={activeCategory === catKey ? 'text-primary-foreground' : 'text-muted-foreground'}>
                  {CATEGORY_ICONS[catKey]}
                </span>
                <span className="flex-1">{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/50 bg-card/30 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {CATEGORY_ICONS[activeCategory]}
              {categories[activeCategory]?.label}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {categories[activeCategory]?.items.length || 0} مورد پیکربندی
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {activeCategory === 'api_keys' && modelItems.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Cpu className="w-4 h-4" />
                    انتخاب مدل
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="end">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">مدل‌های هوش مصنوعی</p>
                    {modelItems.map((item) => {
                      const currentValue = item.value || item.defaultValue || '';
                      return (
                        <div key={item.key} className="space-y-1">
                          <Label className="text-xs font-medium">{item.label}</Label>
                          <div className="relative">
                            <Select
                              value={currentValue}
                              onValueChange={(v) => handleQuickModelSave(item.key, v)}
                              disabled={quickSaving === item.key}
                            >
                              <SelectTrigger className="w-full text-xs h-8">
                                {quickSaving === item.key ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : null}
                                <SelectValue placeholder="انتخاب..." />
                              </SelectTrigger>
                              <SelectContent>
                                {item.options?.map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    <code dir="ltr" className="text-xs">{opt}</code>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {activeCategory === 'api_keys' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <TestTube2 className="w-4 h-4 ml-1" />
                )}
                تست اتصال
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 ml-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-1" />
              )}
              ذخیره تغییرات
            </Button>
          </div>
        </div>

        {/* Test result banner */}
        <AnimatePresence>
          {testResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className={`m-4 mb-0 p-3 rounded-xl border flex items-start gap-3 ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {testResult.ok ? 'اتصال موفق' : 'اتصال ناموفق'}
                  </p>
                  <p className="text-xs mt-0.5 opacity-90 break-words">{testResult.message}</p>
                </div>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unsaved changes indicator */}
        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="m-4 mb-0 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{Object.keys(draftValues).length} تغییر ذخیره‌نشده — برای اعمال، «ذخیره تغییرات» را بزنید</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings list */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <ScrollArea className="absolute inset-0">
            <div className="p-4 space-y-3">
              {categories[activeCategory]?.items.map((item) => (
                <SettingRow
                  key={item.key}
                  item={item}
                  value={getCurrentValue(item)}
                  showSecret={!!showSecrets[item.key]}
                  onToggleSecret={() => toggleSecretVisibility(item.key)}
                  onChange={(v) => handleChange(item.key, v)}
                />
              ))}
              {categories[activeCategory]?.items.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>هیچ تنظیمی در این بخش وجود ندارد</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  item,
  value,
  showSecret,
  onToggleSecret,
  onChange,
}: {
  item: SettingItem;
  value: string;
  showSecret: boolean;
  onToggleSecret: () => void;
  onChange: (v: string) => void;
}) {
  const isDirty = value !== item.value;
  const isToggle = item.type === 'toggle';
  const isSelect = item.type === 'select';
  const isPassword = item.type === 'password';
  const isNumber = item.type === 'number';

  // For toggles we use a switch instead of input
  const toggleValue = value === '' ? item.defaultValue === 'true' : value === 'true';

  return (
    <Card className={`transition-colors ${isDirty ? 'border-primary/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {/* Label and description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="font-medium text-sm">{item.label}</Label>
              {item.isSecret && (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  محرمانه
                </Badge>
              )}
              {item.isConfigured ? (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  تنظیم شده
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  پیش‌فرض
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            {item.updatedAt && (
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                آخرین به‌روزرسانی: {new Date(item.updatedAt).toLocaleString('fa-IR')}
              </p>
            )}
          </div>

          {/* Input */}
          <div className="md:w-[300px] shrink-0">
            {isToggle ? (
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">
                  {toggleValue ? 'فعال' : 'غیرفعال'}
                </span>
                <Switch
                  checked={toggleValue}
                  onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
                />
              </div>
            ) : isSelect ? (
              <Select value={value || item.defaultValue || ''} onValueChange={onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  {item.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      <code dir="ltr" className="text-xs">{opt}</code>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="relative">
                <Input
                  type={isPassword ? (showSecret ? 'text' : 'password') : isNumber ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={item.placeholder || item.defaultValue}
                  className={isPassword ? 'pl-9' : ''}
                  dir={isPassword || item.key.includes('url') ? 'ltr' : 'rtl'}
                />
                {isPassword && (
                  <button
                    type="button"
                    onClick={onToggleSecret}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showSecret ? 'پنهان کردن' : 'نمایش'}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
