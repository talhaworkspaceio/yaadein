export const metadata = {
  title: "Yaadein — Photo Frame Customizer",
  description: "Customize your perfect photo frame with real-time preview",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0F0D0B" }}>
        {children}
      </body>
    </html>
  );
}
