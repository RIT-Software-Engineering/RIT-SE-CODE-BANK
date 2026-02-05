// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import Header from "../layouts/Header";
import Footer from "../layouts/Footer";
import "@/styles/globals.css";
import AuthProvider from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ThemeRegistry from "@/styles/ThemeRegistry";

/**
 * Configure custom fonts to be used across the app.
 * The variables are CSS custom properties that Tailwind and custom CSS can consume.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Metadata for the application.
 * These values are used by Next.js for SEO and accessibility.
 */
export const metadata = {
  title: "TA Portal",
  description: "Teaching Assistant Portal for RIT",
};

/**
 * RootLayout component
 * ---------------------
 * Defines the global structure of the application.
 *
 * Responsibilities:
 * - Sets up the global HTML and body tags for all pages.
 * - Applies font variables, accessibility features, and Tailwind layout classes.
 * - Provides context wrappers for theme management, authentication, and notifications.
 * - Renders global layout elements (Header → Main Content → Footer).
 *
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - The page content that will be injected into the layout
 * @returns {JSX.Element} The global layout structure wrapping all pages
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        // Apply global font variables, enable antialiasing for smoother text,
        // and set up a flex layout with full-height screen
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen overflow-x-hidden`}
      >
        {/* Global theme registry for MUI / styled components */}
        <ThemeRegistry>
          {/* Authentication provider (manages user login state globally) */}
          <AuthProvider>
            {/* Notification provider (manages in-app alerts and toasts) */}
            <NotificationProvider>
              {/* Global header (persistent across pages) */}
              <Header />

              {/* Main content area (grows to fill available space) */}
              <main className="flex-grow relative">{children}</main>

              {/* Global footer (persistent across pages) */}
              <Footer />
            </NotificationProvider>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}