import type { Metadata } from "next";
import { Oswald, Inter, Akshar } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const akshar = Akshar({
  variable: "--font-akshar",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://designik.agency"),
  title: "Designik — Creative Agency",
  description:
    "Designik drives brand engagement with innovative digital solutions. We drive your brand to new heights.",
  openGraph: {
    title: "Designik — Creative Agency",
    description:
      "Designik drives brand engagement with innovative digital solutions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${inter.variable} ${akshar.variable}`}
    >
      <body className="bg-white text-ink font-sans">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
