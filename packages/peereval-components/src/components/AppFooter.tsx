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