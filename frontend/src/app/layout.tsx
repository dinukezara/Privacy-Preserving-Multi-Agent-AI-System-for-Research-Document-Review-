import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScholarLens — AI-Powered Research Paper Review",
  description:
    "ScholarLens is a privacy-preserving, fully offline multi-agent AI system for academic document review. Get instant peer-review quality feedback on research papers, theses, and presentations.",
  keywords: ["academic review", "AI paper review", "research", "peer review", "ScholarLens"],
  icons: {
    icon: "/scholarlens-logo.png",
    shortcut: "/scholarlens-logo.png",
    apple: "/scholarlens-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-initializer"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: "!(function(){try{var t=localStorage.getItem('scholarlens-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );

}
