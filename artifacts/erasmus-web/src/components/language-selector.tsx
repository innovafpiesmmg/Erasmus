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

/** Poll until the hidden GT combo is in the DOM (up to 10 s) */
function waitForGTCombo(timeoutMs = 10_000): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const immediate = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (immediate) { resolve(immediate); return; }

    const deadline = Date.now() + timeoutMs;
    const id = setInterval(() => {
      const sel = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (sel || Date.now() > deadline) {
        clearInterval(id);
        resolve(sel ?? null);
      }
    }, 200);
  });
}

function clearGTCookies() {
  const exp = new Date(0).toUTCString();
  const host = window.location.hostname;
  const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === "localhost";
  const domains = isIP ? [""] : ["", host, `.${host}`];
  for (const d of domains) {
    const dp = d ? `; domain=${d}` : "";
    document.cookie = `googtrans=; expires=${exp}; path=/${dp}`;
  }
}

async function applyTranslation(code: string) {
  if (code === "es") {
    localStorage.removeItem(STORAGE_KEY);

    const select = await waitForGTCombo();
    if (select) {
      // Setting to "" triggers GT's built-in "restore original" path
      select.value = "";
      select.dispatchEvent(new Event("change"));
      // Also wipe the cookie so a future reload starts clean
      clearGTCookies();
    } else {
      // Widget never loaded — clear cookies and hard reload
      clearGTCookies();
      window.location.reload();
    }
    return;
  }

  localStorage.setItem(STORAGE_KEY, code);

  const select = await waitForGTCombo();
  if (select) {
    select.value = code;
    select.dispatchEvent(new Event("change"));
  } else {
    // Fallback: set cookie + reload (autoDisplay:false won't fire, but at least
    // state is persisted for the next full page load if the user refreshes)
    const host = window.location.hostname;
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host === "localhost";
    document.cookie = `googtrans=/es/${code}; path=/`;
    if (!isIP) {
      document.cookie = `googtrans=/es/${code}; path=/; domain=.${host}`;
    }
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
    setCurrent(cookieLang ?? stored ?? "es");
  }, []);

  // Re-apply translation after SPA navigation (React re-renders new DOM nodes)
  useEffect(() => {
    if (current === "es") return;
    waitForGTCombo().then((select) => {
      if (!select || select.value === current) return;
      select.value = current;
      select.dispatchEvent(new Event("change"));
    });
  }, [current]);

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
