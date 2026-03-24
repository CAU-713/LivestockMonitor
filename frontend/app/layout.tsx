import type { Metadata } from 'next';
import ThemeRegistry from '../components/ThemeRegistry/ThemeRegistry';
import ChatWidget from '../components/chat/ChatWidget';
import './globals.css';

export const metadata: Metadata = {
  title: 'Livestock Monitor',
  description: 'A system for monitoring livestock',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh-CN'>
      <body>
        <ThemeRegistry>
          {children}
          <ChatWidget />
        </ThemeRegistry>
      </body>
    </html>
  );
}
