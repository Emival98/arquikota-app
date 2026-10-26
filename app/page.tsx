import Dashboard from "@/components/dashboard";
import Hero from "@/components/hero";
import Methodology from "@/components/methodology";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { DEFAULT_PRESET_ID } from "@/lib/preset-options";
import { createDemoScan } from "@/lib/presets";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const initialReport = createDemoScan(DEFAULT_PRESET_ID, "weekly");

  return (
    <div id="top" className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <Dashboard initialReport={initialReport} initialPreset={DEFAULT_PRESET_ID} />
        <Methodology />
      </main>
      <SiteFooter />
    </div>
  );
}
