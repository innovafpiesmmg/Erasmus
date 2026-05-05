import { useState, useEffect, useRef, useMemo } from "react";
import { Globe } from "lucide-react";
import { useGetPartners } from "@workspace/api-client-react";

const STORAGE_KEY = "sea_lang";

/** Language metadata for every language we know how to map a country to. */
const LANG_META: Record<string, { label: string; flag: string }> = {
  es: { label: "Español",     flag: "🇪🇸" },
  tr: { label: "Türkçe",      flag: "🇹🇷" },
  lv: { label: "Latviešu",    flag: "🇱🇻" },
  ro: { label: "Română",      flag: "🇷🇴" },
  pt: { label: "Português",   flag: "🇵🇹" },
  mk: { label: "Македонски",  flag: "🇲🇰" },
  fr: { label: "Français",    flag: "🇫🇷" },
  it: { label: "Italiano",    flag: "🇮🇹" },
  de: { label: "Deutsch",     flag: "🇩🇪" },
  pl: { label: "Polski",      flag: "🇵🇱" },
  el: { label: "Ελληνικά",    flag: "🇬🇷" },
  nl: { label: "Nederlands",  flag: "🇳🇱" },
  hr: { label: "Hrvatski",    flag: "🇭🇷" },
  bg: { label: "Български",   flag: "🇧🇬" },
  hu: { label: "Magyar",      flag: "🇭🇺" },
  cs: { label: "Čeština",     flag: "🇨🇿" },
  sk: { label: "Slovenčina",  flag: "🇸🇰" },
  sl: { label: "Slovenščina", flag: "🇸🇮" },
  et: { label: "Eesti",       flag: "🇪🇪" },
  lt: { label: "Lietuvių",    flag: "🇱🇹" },
  fi: { label: "Suomi",       flag: "🇫🇮" },
  sv: { label: "Svenska",     flag: "🇸🇪" },
  da: { label: "Dansk",       flag: "🇩🇰" },
  no: { label: "Norsk",       flag: "🇳🇴" },
  en: { label: "English",     flag: "🇬🇧" },
  ga: { label: "Gaeilge",     flag: "🇮🇪" },
  sq: { label: "Shqip",       flag: "🇦🇱" },
  sr: { label: "Српски",      flag: "🇷🇸" },
  uk: { label: "Українська",  flag: "🇺🇦" },
};

/** Map partner country names (lowercased, accent-stripped) to ISO language code. */
const COUNTRY_TO_LANG: Record<string, string> = {
  espana: "es", spain: "es",
  turquia: "tr", turkey: "tr", turkiye: "tr",
  letonia: "lv", latvia: "lv",
  rumania: "ro", romania: "ro",
  portugal: "pt",
  macedonia: "mk", "macedonia del norte": "mk", "north macedonia": "mk",
  francia: "fr", france: "fr",
  italia: "it", italy: "it",
  alemania: "de", germany: "de", deutschland: "de",
  polonia: "pl", poland: "pl",
  grecia: "el", greece: "el",
  "paises bajos": "nl", holanda: "nl", netherlands: "nl", holland: "nl",
  belgica: "nl", belgium: "nl",
  croacia: "hr", croatia: "hr",
  bulgaria: "bg",
  hungria: "hu", hungary: "hu",
  chequia: "cs", "republica checa": "cs", "czech republic": "cs", czechia: "cs",
  eslovaquia: "sk", slovakia: "sk",
  eslovenia: "sl", slovenia: "sl",
  estonia: "et",
  lituania: "lt", lithuania: "lt",
  finlandia: "fi", finland: "fi",
  suecia: "sv", sweden: "sv",
  dinamarca: "da", denmark: "da",
  noruega: "no", norway: "no",
  irlanda: "ga", ireland: "ga",
  austria: "de", osterreich: "de",
  chipre: "el", cyprus: "el",
  reinounido: "en", "reino unido": "en", "united kingdom": "en", uk: "en", inglaterra: "en",
  albania: "sq",
  serbia: "sr",
  ucrania: "uk", ukraine: "uk",
};

function normCountry(c: string): string {
  return c
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function countryToLang(country: string | null | undefined): string | null {
  if (!country) return null;
  return COUNTRY_TO_LANG[normCountry(country)] ?? null;
}

/** Wait for the GT combo element to appear and be populated. */
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

    const ticker = setInterval(() => {
      const el = check();
      if (el) { observer.disconnect(); clearInterval(ticker); resolve(el); }
      else if (Date.now() > deadline) { observer.disconnect(); clearInterval(ticker); resolve(null); }
    }, 250);
  });
}

/** Apply a non-Spanish language via the GT combo. Returns success. */
async function applyLanguage(code: string): Promise<boolean> {
  const combo = await waitForCombo();
  if (!combo) return false;
  combo.value = code;
  combo.dispatchEvent(new Event("change"));
  return true;
}

export default function LanguageSelector({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  // Always start as Spanish — the indicator only shows a non-Spanish language
  // AFTER GT has actually applied the translation, so it never lies.
  const [current, setCurrent] = useState<string>("es");
  const [applying, setApplying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: partners = [] } = useGetPartners();

  // Languages = Spanish (always) + one per partner country we know
  const languages = useMemo(() => {
    const codes = new Set<string>(["es"]);
    for (const p of partners) {
      const code = countryToLang(p.country);
      if (code && LANG_META[code]) codes.add(code);
    }
    return Array.from(codes).map((c) => ({ code: c, ...LANG_META[c] }));
  }, [partners]);

  // Restore saved language on mount, but only update the indicator AFTER
  // GT actually applied the translation. If apply fails, clear the stale
  // localStorage so the next refresh starts cleanly in Spanish.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved || saved === "es") return;

    setApplying(true);
    applyLanguage(saved).then((ok) => {
      if (ok) {
        setCurrent(saved);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setApplying(false);
    });
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

    if (code === "es") {
      // Spanish = original. The cleanest way to restore is a reload with
      // localStorage cleared. Because autoDisplay:false, GT won't translate
      // on the fresh load → page stays in Spanish guaranteed.
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
      return;
    }

    setApplying(true);
    const ok = await applyLanguage(code);
    if (ok) {
      setCurrent(code);
      localStorage.setItem(STORAGE_KEY, code);
    }
    setApplying(false);
  }

  const currentLang =
    languages.find((l) => l.code === current) ??
    { code: "es", ...LANG_META.es };

  const base = dark
    ? "text-white/80 hover:text-white hover:bg-white/10"
    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100";

  return (
    <div ref={ref} className="relative notranslate" translate="no">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={applying}
        title="Traducir página"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors notranslate ${base} ${applying ? "opacity-60 cursor-wait" : ""}`}
        translate="no"
      >
        <Globe size={15} className={applying ? "animate-spin" : ""} />
        <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
        <span className="sm:hidden">{currentLang.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 overflow-hidden max-h-80 overflow-y-auto notranslate" translate="no">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left notranslate ${
                current === lang.code
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              translate="no"
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === "es" && (
                <span className="ml-auto text-xs text-slate-400">original</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
