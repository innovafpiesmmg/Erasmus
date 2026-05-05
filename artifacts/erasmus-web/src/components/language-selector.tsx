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

/**
 * Wait for the Google Translate combo element to appear in the DOM and be
 * populated with options. GT creates it asynchronously after the script loads.
 */
function waitForCombo(timeoutMs = 10000): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const check = () => {
      const el = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      return el && el.options.length > 1 ? el : null;
    };

    const found = check();
    if (found) { resolve(found); return; }

    const deadline = Date.now() + timeoutMs;

    const observer = new MutationObserver(() => {
      const el = check();
      if (el) { observer.disconnect(); clearInterval(ticker); resolve(el); }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Fallback polling in case MutationObserver misses it
    const ticker = setInterval(() => {
      const el = check();
      if (el) {
        observer.disconnect();
        clearInterval(ticker);
        resolve(el);
      } else if (Date.now() > deadline) {
        observer.disconnect();
        clearInterval(ticker);
        resolve(null);
      }
    }, 250);
  });
}

/**
 * Apply a language via the GT combo element.
 * code="es" → restores the original Spanish content.
 * Any other code → translates to that language.
 * No cookies, no page reload — GT translates the live DOM.
 */
async function applyLanguage(code: string): Promise<boolean> {
  const combo = await waitForCombo();
  if (!combo) return false;

  if (code === "es") {
    // "Show original" — select the first option (source language) or empty value
    combo.value = combo.options[0]?.value ?? "";
  } else {
    combo.value = code;
  }

  // Dispatch change so GT picks up the new value
  combo.dispatchEvent(new Event("change"));
  return true;
}

export default function LanguageSelector({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "es");
  const [applying, setApplying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Restore saved language on every mount (handles page refresh)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? "es";
    if (saved !== "es") {
      applyLanguage(saved);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function selectLanguage(code: string) {
    setOpen(false);
    if (code === current) return;

    setApplying(true);
    const ok = await applyLanguage(code);

    if (ok) {
      setCurrent(code);
      if (code === "es") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, code);
      }
    }
    setApplying(false);
  }

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  const base = dark
    ? "text-white/80 hover:text-white hover:bg-white/10"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={applying}
        title="Traducir página"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${base} ${applying ? "opacity-60 cursor-wait" : ""}`}
      >
        <Globe size={15} className={applying ? "animate-spin" : ""} />
        <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
        <span className="sm:hidden">{currentLang.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
                current === lang.code
                  ? "bg-blue-50 text-blue-700 font-medium"
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
