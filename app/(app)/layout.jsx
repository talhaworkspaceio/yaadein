import "../globals.css";
import SmoothScroll from "./components/SmoothScroll";
import BackButton from "./components/BackButton";
import { getInitialCmsData } from "@/lib/cmsServer";
import { CmsProvider } from "@/lib/CmsProvider";

export const metadata = {
  title: "Yaadein — Photo Frame Customizer",
  description: "Customize your perfect photo frame with real-time preview",
};

export default async function RootLayout({ children }) {
  // Read the CMS on the server so the HTML ships with the real content already
  // in place, instead of the hardcoded defaults swapping out after hydration.
  const initialCms = await getInitialCmsData();

  return (
    <html lang="en">
      <body>
        <div className="vintage-sepia-tint" />
        <BackButton />
        <CmsProvider initial={initialCms}>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </CmsProvider>
      </body>
    </html>
  );
}
