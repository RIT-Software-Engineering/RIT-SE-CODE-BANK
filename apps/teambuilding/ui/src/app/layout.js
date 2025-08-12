import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
import "../../styles/styles.css";
import ThemeRegistry from "../../styles/ThemeRegistry";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});



export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
            >
               
                    <ThemeRegistry>
                        <main className="grow">{children}</main>
                       
                    </ThemeRegistry>
               
            </body>
        </html>
    );
}