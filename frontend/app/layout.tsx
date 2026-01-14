import type { Metadata } from "next";
import ThemeRegistry from '../components/ThemeRegistry/ThemeRegistry';
import ChatWidget from '../components/chat/ChatWidget';

export const metadata: Metadata = {
  title: "Livestock Monitor",
  description: "A system for monitoring livestock",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
          <ChatWidget />
        </ThemeRegistry>
      </body>
    </html>
  );
}
