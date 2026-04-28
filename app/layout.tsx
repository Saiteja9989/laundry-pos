import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "CleanPOS — AI Laundry Management",
  description: "Smart AI-powered laundry POS system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
        <Toaster position="top-right" toastOptions={{ style: { borderRadius: "10px", background: "#111", color: "#fff", fontSize: "13px" }, success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } } }} />
      </body>
    </html>
  );
}
