import type { Metadata } from "next";
import ThemeRegistry from '../components/ThemeRegistry/ThemeRegistry';
import ChatWidget from '../components/chat/ChatWidget';
import { AuthProvider } from '../contexts/AuthContext';

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
          <AuthProvider>
            {children}
            <ChatWidget />
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
