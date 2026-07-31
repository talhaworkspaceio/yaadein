import "../globals.css";
import SmoothScroll from "./components/SmoothScroll";
import BackButton from "./components/BackButton";

export const metadata = {
  title: "Yaadein — Photo Frame Customizer",
  description: "Customize your perfect photo frame with real-time preview",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="vintage-sepia-tint" />
        <BackButton />
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
