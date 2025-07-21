import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";

export const metadata: Metadata = {
  title: "Iterate",
  description: "Customer feedback platform for startups",
  icons: {
    icon: '/iter8_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
        {children}
        </AuthProvider>
      </body>
    </html>
  );
}
