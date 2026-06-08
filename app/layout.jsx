import "./globals.css";
import SmoothScroll from "./components/SmoothScroll";

export const metadata = {
  title: "Yaadein — Photo Frame Customizer",
  description: "Customize your perfect photo frame with real-time preview",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="vintage-sepia-tint" />
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
