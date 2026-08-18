'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  Plus,
  Search,
  FileText,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Tag,
  User as UserIcon,
  Loader2,
  BookOpen,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { CONTENT_ADMIN_EMAIL, isContentAdmin } from '@/lib/content-admin';

interface Content {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string | null;
  category: string;
  tags: string;
  status: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string | null;
    name: string | null;
    email: string;
  };
}

const CATEGORIES = [
  'عمومی',
  'تکنولوژی',
  'علمی',
  'آموزشی',
  'اقتصادی',
  'فرهنگی',
  'سلامت',
  'سایر',
];

export function CmsPanel() {
  const { user } = useAuthStore();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Content | null>(null);
  const [viewing, setViewing] = useState<Content | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // For CMS panel we want both published and the user's own content
      params.set('status', 'all');
      const res = await fetch(`/api/cms?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setContents(data.contents || []);
      }
    } catch {
      toast.error('خطا در دریافت محتوا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleSave = async (data: any) => {
    try {
      const isEdit = !!editing?.id;
      const res = await fetch(
        isEdit ? `/api/cms/${editing!.id}` : '/api/cms',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'خطا در ذخیره محتوا');
        return false;
      }
      toast.success(isEdit ? 'محتوا ویرایش شد' : 'محتوا ایجاد شد');
      await fetchContents();
      setShowEditor(false);
      setEditing(null);
      return true;
    } catch {
      toast.error('خطا در ارتباط با سرور');
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/cms/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'خطا در حذف محتوا');
        return;
      }
      toast.success('محتوا حذف شد');
      await fetchContents();
    } catch {
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = contents.filter((c) => {
    const matchSearch =
      !search ||
      c.title.includes(search) ||
      c.body.includes(search) ||
      (c.excerpt || '').includes(search);
    const matchCat = filterCategory === 'all' || c.category === filterCategory;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(d));
    } catch {
      return d;
    }
  };

  const canManageContent = isContentAdmin(user);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/30 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center glow-primary">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">مدیریت محتوا</h2>
            <p className="text-xs text-muted-foreground">
              {canManageContent
                ? 'ایجاد، ویرایش و انتشار مقالات و محتوا'
                : 'مشاهده مقالات و محتوای منتشرشده'}
            </p>
          </div>
        </div>
        {canManageContent && (
          <Button
            onClick={() => {
              setEditing(null);
              setShowEditor(true);
            }}
          >
            <Plus className="w-4 h-4 ml-1" />
            محتوای جدید
          </Button>
        )}
      </div>

      {!canManageContent && (
        <div className="p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <p>
              تنها مدیر سایت با ایمیل{' '}
              <code dir="ltr" className="px-1 py-0.5 rounded bg-muted-foreground/10">
                {CONTENT_ADMIN_EMAIL}
              </code>{' '}
              می‌تواند محتوای جدید ایجاد یا محتوای موجود را ویرایش و حذف کند. شما
              می‌توانید محتوای منتشرشده را مشاهده کنید.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b border-border/50 flex flex-wrap gap-3 items-center bg-card/20">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو در محتوا..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="دسته‌بندی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as any)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="published">منتشر شده</SelectItem>
            <SelectItem value="draft">پیش‌نویس</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="mr-2">
          {filtered.length} مورد
        </Badge>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-1">
                  {canManageContent
                    ? 'هنوز محتوایی ثبت نشده است'
                    : 'هنوز محتوای منتشرشده‌ای وجود ندارد'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {canManageContent
                    ? 'اولین مقاله یا محتوای خود را ایجاد کنید'
                    : 'بعداً دوباره بررسی کنید'}
                </p>
                {canManageContent && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setShowEditor(true);
                    }}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    ایجاد محتوا
                  </Button>
                )}
              </div>
            ) : (
              filtered.map((c, idx) => {
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                  >
                    <Card className="hover:border-primary/40 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge
                                variant={c.status === 'published' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {c.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {c.category}
                              </Badge>
                              {c.author?.firstName && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <UserIcon className="w-3 h-3" />
                                  {c.author.firstName}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(c.createdAt)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                              {c.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {c.excerpt || c.body.slice(0, 160)}
                            </p>
                            {c.tags && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Tag className="w-3 h-3" />
                                {c.tags}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setViewing(c)}
                              title="مشاهده"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canManageContent && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditing(c);
                                    setShowEditor(true);
                                  }}
                                  title="ویرایش"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:text-destructive"
                                  onClick={() => setDeletingId(c.id)}
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <ContentEditor
        key={editing?.id || 'new'}
        open={showEditor}
        content={editing}
        onClose={() => {
          setShowEditor(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      {/* Viewer */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant={viewing?.status === 'published' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {viewing?.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {viewing?.category}
              </Badge>
              {viewing?.createdAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(viewing.createdAt)}
                </span>
              )}
            </div>
            <DialogTitle className="text-2xl">{viewing?.title}</DialogTitle>
            {viewing?.excerpt && (
              <DialogDescription className="text-base">
                {viewing.excerpt}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="prose-persian text-sm md:text-base px-1">
              {viewing && <ReactMarkdown>{viewing.body}</ReactMarkdown>}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف محتوا</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این محتوا مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ContentEditor({
  open,
  content,
  onClose,
  onSave,
}: {
  open: boolean;
  content: Content | null;
  onClose: () => void;
  onSave: (data: any) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(content?.title || '');
  const [body, setBody] = useState(content?.body || '');
  const [excerpt, setExcerpt] = useState(content?.excerpt || '');
  const [category, setCategory] = useState(content?.category || 'عمومی');
  const [tags, setTags] = useState(content?.tags || '');
  const [status, setStatus] = useState<'draft' | 'published'>(
    (content?.status as 'draft' | 'published') || 'draft'
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    await onSave({
      title,
      body,
      excerpt,
      category,
      tags,
      status,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {content ? 'ویرایش محتوا' : 'ایجاد محتوای جدید'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="content-title">عنوان *</Label>
            <Input
              id="content-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان محتوا"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="content-category">دسته‌بندی</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="content-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-status">وضعیت</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as 'draft' | 'published')}
              >
                <SelectTrigger id="content-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">پیش‌نویس</SelectItem>
                  <SelectItem value="published">منتشر شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-tags">برچسب‌ها (با ویرگول جدا کنید)</Label>
            <Input
              id="content-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="هوش مصنوعی، فناوری، آموزش"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-excerpt">خلاصه (کوتاه)</Label>
            <Input
              id="content-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="خلاصه‌ای کوتاه از محتوا"
            />
          </div>
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label htmlFor="content-body">متن کامل (Markdown) *</Label>
            <Textarea
              id="content-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="متن کامل محتوا را با فرمت Markdown وارد کنید..."
              className="flex-1 min-h-[200px] resize-none font-mono text-sm"
              dir="rtl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={saving || !title.trim() || !body.trim()}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
              ) : null}
              {content ? 'ذخیره تغییرات' : 'ایجاد محتوا'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
