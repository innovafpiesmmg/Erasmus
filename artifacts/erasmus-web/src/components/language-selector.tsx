import { useState, useEffect, useRef } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "es", label: "Español",    flag: "🇪🇸", original: true },
  { code: "tr", label: "Türkçe",     flag: "🇹🇷" },
  { code: "lv", label: "Latviešu",   flag: "🇱🇻" },
  { code: "ro", label: "Română",     flag: "🇷🇴" },
  { code: "pt", label: "Português",  flag: "🇵🇹" },
  { code: "mk", label: "Македонски", flag: "🇲🇰" },
];

const STORAGE_KEY = "sea_lang";

function getCookieLang(): string | null {
  const m = document.cookie.match(/googtrans=\/es\/([a-z]+)/);
  return m ? m[1] : null;
}

function applyTranslation(code: string) {
  if (code === "es") {
    // Reset: delete googtrans cookies and reload
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
    return;
  }
  // Set via the hidden Google Translate combo box
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (select) {
    select.value = code;
    select.dispatchEvent(new Event("change"));
    localStorage.setItem(STORAGE_KEY, code);
  } else {
    // Widget not ready yet — set cookie manually and reload
    document.cookie = `/es/${code}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/es/${code}; path=/`;
    localStorage.setItem(STORAGE_KEY, code);
    window.location.reload();
  }
}

export default function LanguageSelector({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("es");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cookieLang = getCookieLang();
    const stored = localStorage.getItem(STORAGE_KEY);
    const active = cookieLang ?? stored ?? "es";
    setCurrent(active);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  const base = dark
    ? "text-white/80 hover:text-white hover:bg-white/10"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  const dropdownBase = "absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 overflow-hidden";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Traducir página"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${base}`}
      >
        <Globe size={15} />
        <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
        <span className="sm:hidden">{currentLang.flag}</span>
      </button>

      {open && (
        <div className={dropdownBase}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setOpen(false);
                setCurrent(lang.code);
                applyTranslation(lang.code);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                current === lang.code
                  ? "bg-[#003399]/8 text-[#003399] font-medium"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.original && (
                <span className="ml-auto text-xs text-slate-400">original</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
