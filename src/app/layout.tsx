import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "ایران برتر | دستیار هوشمند",
  description: "پلتفرم هوش مصنوعی ایران برتر با قابلیت تفکر عمیق، مدیریت محتوا و تجربه کاربری فارسی",
  keywords: ["ایران برتر", "هوش مصنوعی", "دستیار هوشمند", "تفکر عمیق", "مدیریت محتوا"],
  authors: [{ name: "ایران برتر" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className="dark">
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster />
        <SonnerToaster position="top-center" dir="rtl" />
      </body>
    </html>
  );
}
