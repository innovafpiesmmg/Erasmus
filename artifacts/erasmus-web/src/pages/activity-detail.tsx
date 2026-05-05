import { useParams, Link } from "wouter";
import { useGetActivity, useGetMobility, getGetMobilityQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Leaf, ArrowRight, ImageOff, Share2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import PublicHeader from "@/components/public-header";
import { SocialShareIcons } from "@/components/social-share-icons";

const WP_COLORS: Record<string, string> = {
  WP2: "#003399",
  WP3: "#2D5A27",
  WP4: "#1565C0",
  WP5: "#6A1B9A",
  WP6: "#E65100",
  WP7: "#00695C",
};

const COUNTRY_FLAGS: Record<string, string> = {
  España: "🇪🇸",
  Turquía: "🇹🇷",
  Letonia: "🇱🇻",
  Rumanía: "🇷🇴",
  Portugal: "🇵🇹",
  Macedonia: "🇲🇰",
};

function useActivityMeta(activity: { title: string; description?: string | null; imageUrl?: string | null } | undefined) {
  useEffect(() => {
    if (!activity) return;

    const title = `${activity.title} — Erasmus+ Platform`;
    const description = activity.description
      ? activity.description.slice(0, 160)
      : "Actividad Erasmus+";
    const image = activity.imageUrl ?? null;

    document.title = title;

    function setMeta(property: string, content: string, attr: "property" | "name" = "property") {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    function removeMeta(property: string, attr: "property" | "name" = "property") {
      const el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${property}"]`);
      el?.remove();
    }

    setMeta("og:type", "website");
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:url", window.location.href);
    if (image) {
      setMeta("og:image", image);
    } else {
      removeMeta("og:image");
    }

    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");
    if (image) {
      setMeta("twitter:image", image, "name");
    } else {
      removeMeta("twitter:image", "name");
    }

    return () => {
      document.title = "Erasmus+ Platform";
    };
  }, [activity]);
}

function ShareButton({ color }: { color: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {
        // user cancelled or share not available — fall through to clipboard
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard access denied — silently ignore
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleShare}
        data-testid="share-button"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border"
        style={{
          background: `${color}12`,
          color,
          borderColor: `${color}30`,
        }}
      >
        {copied ? <Check size={15} /> : <Share2 size={15} />}
        {copied ? "¡Enlace copiado!" : "Compartir"}
      </button>
      <SocialShareIcons />
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ActivityDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: activity, isLoading, isError } = useGetActivity(id);
  const mobilityId = activity?.mobilityId ?? 0;
  const { data: mobility } = useGetMobility(mobilityId, {
    query: {
      enabled: !!activity?.mobilityId,
      queryKey: getGetMobilityQueryKey(mobilityId),
    },
  });

  useActivityMeta(activity);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader backTo="/" backLabel="Actividades" />
        <div className="pt-16 max-w-3xl mx-auto px-6 py-16 space-y-4">
          <div className="h-8 w-32 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-6 bg-slate-200 rounded-xl animate-pulse w-3/4" />
          <div className="h-6 bg-slate-200 rounded-xl animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (isError || !activity) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <PublicHeader />
        <p className="text-slate-500">Actividad no encontrada.</p>
        <Link href="/" className="text-sm text-[#003399] hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const color = mobility ? (WP_COLORS[mobility.workPackage] ?? "#003399") : "#003399";

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader backTo="/" backLabel="Actividades" />

      <div className="pt-16">
        {/* ── Header with accent stripe ── */}
        <div className="bg-white border-b border-slate-100">
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
          />
          <div className="max-w-3xl mx-auto px-6 py-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Label */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18` }}
                >
                  <Leaf size={16} style={{ color }} />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color }}
                >
                  Actividad
                </span>
                {mobility && (
                  <span
                    className="ml-1 text-xs font-bold text-white px-2.5 py-0.5 rounded-full"
                    style={{ background: color }}
                  >
                    {mobility.workPackage}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
                {activity.title}
              </h1>

              {/* Meta */}
              {mobility && (
                <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500 mb-5">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    {COUNTRY_FLAGS[mobility.partner?.country ?? ""] ?? "🌍"}{" "}
                    {mobility.partner?.city}, {mobility.partner?.country}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDate(mobility.startDate)}
                  </span>
                </div>
              )}

              <ShareButton color={color} />
            </motion.div>
          </div>
        </div>

        {/* ── Cover image — full width, right below header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-slate-100"
          style={{ maxHeight: 480 }}
        >
          {activity.imageUrl ? (
            <img
              src={activity.imageUrl}
              alt={activity.title}
              className="w-full object-cover"
              style={{ maxHeight: 480, minHeight: 220 }}
            />
          ) : (
            <div
              className="w-full flex flex-col items-center justify-center py-20 gap-3"
              style={{
                background: `linear-gradient(135deg, ${color}10 0%, ${color}06 100%)`,
                borderBottom: `1px solid ${color}18`,
              }}
            >
              <ImageOff size={36} style={{ color: `${color}60` }} />
              <span className="text-sm text-slate-400">Sin imagen de portada</span>
            </div>
          )}
        </motion.div>

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
          {activity.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Descripción</h2>
              <p className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap">
                {activity.description}
              </p>
            </motion.div>
          )}

          {mobility && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Movilidad asociada</h2>
              <Link href={`/movilidades/${mobility.id}`}>
                <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-[#003399]/20 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: color }}
                    >
                      {mobility.workPackage}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900">{mobility.partner?.name}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{mobility.theme}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {formatDate(mobility.startDate)} — {formatDate(mobility.endDate)}
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
