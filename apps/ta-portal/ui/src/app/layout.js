// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import "@/styles/globals.css";
import AuthProvider from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ThemeRegistry from "@/styles/ThemeRegistry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TA Portal",
  description: "Teaching Assistant Portal for RIT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ThemeRegistry>
          <AuthProvider>
            <NotificationProvider>
              <Header />
              <main className="flex-grow relative">{children}</main>
              <Footer />
            </NotificationProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}