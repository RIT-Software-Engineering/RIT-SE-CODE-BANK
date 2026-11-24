/**
 * AppFooter
 * 
 * A reusable application footer that provides a consistent footer layout
 * and copyright text.
 * 
 * Supports optional child elements so individual applications can
 * include application-specific content without duplicating the footer.
 */
import type { ReactNode } from "react";

export type AppFooterProps = {
    copyrightText: string;
    children?: ReactNode;
};

export default function AppFooter({
    copyrightText,
    children,
}: AppFooterProps) {
    return (
        <footer className="mt-4 p-16 bg-black text-white text-center z-[1299]">
            <p>{copyrightText}</p>
            {children}
        </footer>
    );
}