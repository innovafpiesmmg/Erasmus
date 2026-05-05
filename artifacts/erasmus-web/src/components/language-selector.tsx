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
  if (!m || m[1] === "es") return null;
  return m[1];
}

/** Always queries fresh — never caches a stale reference after GT re-renders */
function getGTCombo(): HTMLSelectElement | null {
  return document.querySelector<HTMLSelectElement>(".goog-te-combo");
}

/** Fire a change event the same way GT's own internal code does */
function fireGTChange(select: HTMLSelectElement) {
  const evt = document.createEvent("HTMLEvents");
  evt.initEvent("change", true, true); // bubbles=true, cancelable=true
  select.dispatchEvent(evt);
}

/** Poll until .goog-te-combo appears in the DOM (up to timeoutMs) */
function waitForGTCombo(timeoutMs = 10_000): Promise<boolean> {
  return new Promise((resolve) => {
    if (getGTCombo()) { resolve(true); return; }
    const deadline = Date.now() + timeoutMs;
    const id = setInterval(() => {
      if (getGTCombo() || Date.now() > deadline) {
        clearInterval(id);
        resolve(!!getGTCombo());
      }
    }, 200);
  });
}

function clearGTCookies() {
  const exp = new Date(0).toUTCString();
  const host = window.location.hostname;
  const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === "localhost";
  for (const d of isIP ? [""] : ["", host, `.${host}`]) {
    const dp = d ? `; domain=${d}` : "";
    document.cookie = `googtrans=; expires=${exp}; path=/${dp}`;
  }
}

async function applyTranslation(code: string, attempt = 0) {
  const targetValue = code === "es" ? "" : code; // "" = "Select Language" (GT restore)

  if (code === "es") {
    clearGTCookies();
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, code);
  }

  const ready = await waitForGTCombo(10_000);
  if (!ready) {
    // Widget never loaded — reload page as last resort
    window.location.reload();
    return;
  }

  const select = getGTCombo();
  if (!select) {
    // Combo disappeared between check and use — retry up to 3 times
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 300));
      return applyTranslation(code, attempt + 1);
    }
    return;
  }

  select.value = targetValue;
  fireGTChange(select);
}

export default function LanguageSelector({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("es");
  const ref = useRef<HTMLDivElement>(null);

  // Read active language once on mount
  useEffect(() => {
    const cookieLang = getCookieLang();
    const stored = localStorage.getItem(STORAGE_KEY);
    setCurrent(cookieLang ?? stored ?? "es");
  }, []);

  // Close dropdown on outside click
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
                setCurrent(lang.code);
                void applyTranslation(lang.code);
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
