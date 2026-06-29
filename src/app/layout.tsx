import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ModeToggle } from '@/components/ModeToggle';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'VOPayX | Global Payments Without Borders',
  description: 'Africa\'s next-generation payment infrastructure powering global commerce, remittance, business payments, and developer ecosystems.',
  keywords: 'fintech, payments, global transfers, multi-currency wallet, developer API, Africa payments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-bg-primary text-text-primary antialiased selection:bg-accent/30">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <ModeToggle />
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: '!bg-bg-card !text-text-primary !border !border-bg-border',
              style: {
                background: '#1A1A1A',
                color: '#fff',
                border: '1px solid #2A2A2A',
                borderRadius: '12px',
              },
            }} 
          />
                </AuthProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}
