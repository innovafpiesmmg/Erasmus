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

/** Read the active language from the googtrans cookie GT sets/reads. */
function getActiveLang(): string {
  const m = document.cookie.match(/googtrans=\/es\/([a-z]+)/);
  if (m && m[1] && m[1] !== "es") return m[1];
  return localStorage.getItem(STORAGE_KEY) ?? "es";
}

/**
 * Write the googtrans cookie for all domain variants so GT picks it up.
 * GT reads this cookie on page load and auto-translates when autoDisplay
 * is not set to false.
 */
function setGoogTrans(value: string) {
  const host = window.location.hostname;
  const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === "localhost";
  // Bare cookie (always works, including IP addresses)
  document.cookie = `googtrans=${value}; path=/`;
  if (!isIP) {
    document.cookie = `googtrans=${value}; path=/; domain=${host}`;
    document.cookie = `googtrans=${value}; path=/; domain=.${host}`;
  }
}

function clearGoogTrans() {
  const exp = new Date(0).toUTCString();
  const host = window.location.hostname;
  const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === "localhost";
  document.cookie = `googtrans=; expires=${exp}; path=/`;
  if (!isIP) {
    document.cookie = `googtrans=; expires=${exp}; path=/; domain=${host}`;
    document.cookie = `googtrans=; expires=${exp}; path=/; domain=.${host}`;
  }
}

function switchLanguage(code: string) {
  if (code === "es") {
    clearGoogTrans();
    localStorage.removeItem(STORAGE_KEY);
  } else {
    setGoogTrans(`/es/${code}`);
    localStorage.setItem(STORAGE_KEY, code);
  }
  // Reload so GT reads the cookie on a clean page load and auto-translates.
  // This works because autoDisplay is no longer set to false in index.html.
  window.location.reload();
}

export default function LanguageSelector({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("es");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getActiveLang());
  }, []);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  const base = dark
    ? "text-white/80 hover:text-white hover:bg-white/10"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

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
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setOpen(false);
                switchLanguage(lang.code);
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
