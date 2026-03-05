import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Speed Bug-Fix Arena",
    description: "The ultimate competition for React & Next.js developers",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen bg-slate-950 text-slate-50">
                    {children}
                </div>
            </body>
        </html>
    );
}
