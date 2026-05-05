import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function PublicHeader({
  backTo = "/",
  backLabel = "Inicio",
}: {
  backTo?: string;
  backLabel?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-white border-b border-slate-100 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={backTo}
          className="flex items-center gap-1.5 text-slate-600 hover:text-[#003399] transition-colors text-sm font-medium"
        >
          <ArrowLeft size={15} />
          {backLabel}
        </Link>
        <div className="flex items-center gap-3">
          <img src="/logo-ies.png" alt="IES MMG" className="h-9 w-auto object-contain" />
          <div className="w-px h-6 bg-slate-200" />
          <img src="/logo-erasmus.png" alt="Erasmus+" className="h-16 w-auto object-contain" />
        </div>
      </div>
    </nav>
  );
}
