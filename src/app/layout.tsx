import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/shell/StoreProvider";

export const metadata: Metadata = {
  title: { default: "Ironwood Command Center", template: "%s · Ironwood Command Center" },
  description: "Know what matters. Know what applies. Know what to do next.",
  applicationName: "Ironwood Command Center",
};

export const viewport: Viewport = {
  themeColor: "#0b1526",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
