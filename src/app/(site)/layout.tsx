import "@/styles/site.css";
import { Reveal } from "@/components/site/Reveal";
import { SiteFooter } from "@/components/site/SiteFooter";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Reveal />
      {children}
      <SiteFooter />
    </>
  );
}
