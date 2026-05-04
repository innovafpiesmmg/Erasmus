import { useParams, Link } from "wouter";
import { useGetMobility, useGetMedia } from "@workspace/api-client-react";
import type { Activity, Media, Partner } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Camera, Leaf, ArrowRight, Globe, ExternalLink, Instagram, Twitter, Star, Share2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import PublicHeader from "@/components/public-header";

function useMobilityMeta(mobility: { theme: string; description?: string | null; headerImageUrl?: string | null; partner?: { name?: string } | null } | undefined) {
  useEffect(() => {
    if (!mobility) return;

    const title = `${mobility.theme} — Erasmus+ Platform`;
    const description = mobility.description
      ? mobility.description.slice(0, 160)
      : `Movilidad Erasmus+ en ${mobility.partner?.name ?? "destino internacional"}`;
    const image = mobility.headerImageUrl ?? null;

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
  }, [mobility]);
}

function ShareButton() {
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
    <button
      onClick={handleShare}
      data-testid="share-button"
      className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold transition-all"
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
      {copied ? "¡Enlace copiado!" : "Compartir"}
    </button>
  );
}

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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LightboxModal({ images, initialIndex, onClose }: { images: Media[]; initialIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="lightbox-overlay"
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none"
        onClick={onClose}
        data-testid="lightbox-close"
      >
        ×
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 rounded-full w-10 h-10 flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            data-testid="lightbox-prev"
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 rounded-full w-10 h-10 flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); next(); }}
            data-testid="lightbox-next"
          >
            ›
          </button>
        </>
      )}

      <div className="max-w-4xl max-h-[80vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[current].url}
          alt={images[current].caption || "Erasmus+"}
          className="max-h-[70vh] max-w-full object-contain rounded-xl"
          data-testid="lightbox-image"
        />
        {images[current].caption && (
          <p className="text-white/70 text-sm mt-3 text-center">{images[current].caption}</p>
        )}
        {images.length > 1 && (
          <div className="text-white/40 text-xs mt-2">{current + 1} / {images.length}</div>
        )}
      </div>
    </div>
  );
}

function PhotoGallery({ images }: { images: Media[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images.length) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm" data-testid="no-gallery">
        <Camera size={32} className="mx-auto mb-2 opacity-30" />
        No hay fotos disponibles aún
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="photo-gallery">
        {images.map((img, i) => (
          <motion.button
            key={img.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            onClick={() => setLightboxIndex(i)}
            data-testid={`gallery-image-${img.id}`}
          >
            <img src={img.url} alt={img.caption ?? "Erasmus+"} className="w-full h-full object-cover" loading="lazy" />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-xs line-clamp-1">{img.caption}</p>
              </div>
            )}
          </motion.button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <LightboxModal images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  );
}

function PartnerCard({ partner, color }: { partner: Partner; color: string }) {
  const flag = COUNTRY_FLAGS[partner.country] ?? "🌍";
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1.5" style={{ background: color }} />
      <div className="p-6">
        <div className="flex items-start gap-5">
          {partner.logoUrl ? (
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="w-20 h-20 rounded-xl object-contain border border-slate-100 bg-white flex-shrink-0 p-1"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ background: `${color}18`, color }}
            >
              {partner.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {partner.isCoordinator && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Star size={9} fill="currentColor" /> Coordinador
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{partner.name}</h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin size={13} />
              {flag} {partner.city}, {partner.country}
            </p>
            {partner.oid && (
              <p className="text-xs text-slate-400 mt-1 font-mono">OID: {partner.oid}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {partner.webUrl && (
            <a
              href={partner.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
              style={{ background: color }}
            >
              <Globe size={14} />
              Visitar web del centro
              <ExternalLink size={12} />
            </a>
          )}
          {partner.socialInstagram && (
            <a
              href={`https://instagram.com/${partner.socialInstagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Instagram size={14} />
              {partner.socialInstagram}
            </a>
          )}
          {partner.socialTwitter && (
            <a
              href={`https://x.com/${partner.socialTwitter.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Twitter size={14} />
              {partner.socialTwitter}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Link href={`/actividades/${activity.id}`}>
      <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-[#003399]/20 hover:shadow-md transition-all cursor-pointer h-full flex flex-col" data-testid={`activity-card-${activity.id}`}>
        {activity.imageUrl && (
          <img
            src={activity.imageUrl}
            alt={activity.title}
            className="w-full h-36 object-cover rounded-lg mb-4 flex-shrink-0"
          />
        )}
        <h3 className="font-semibold text-slate-900 leading-snug mb-2">{activity.title}</h3>
        {activity.description && (
          <p className="text-sm text-slate-500 line-clamp-3 flex-1">{activity.description}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-[#003399] font-medium mt-3">
          Ver actividad <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}

export default function MobilityDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: mobility, isLoading, isError } = useGetMobility(id);
  const { data: media = [] } = useGetMedia({ mobilityId: id });

  useMobilityMeta(mobility);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader backTo="/" backLabel="Movilidades" />
        <div className="pt-14 max-w-4xl mx-auto px-6 py-16 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !mobility) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <PublicHeader />
        <p className="text-slate-500">Movilidad no encontrada.</p>
        <Link href="/" className="text-sm text-[#003399] hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const color = WP_COLORS[mobility.workPackage] ?? "#003399";
  const flag = COUNTRY_FLAGS[mobility.partner?.country ?? ""] ?? "🌍";

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader backTo="/" backLabel="Movilidades" />

      <div className="pt-14">
        {/* Hero banner */}
        <div
          className="text-white py-16"
          style={{ background: `linear-gradient(135deg, ${color} 0%, #001a6e 100%)` }}
        >
          <div className="max-w-4xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold mb-6">
                {mobility.workPackage} · {flag} {mobility.partner?.country}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4" data-testid="mobility-title">
                {mobility.theme}
              </h1>
              <div className="flex flex-wrap gap-5 text-white/75 text-sm mt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {mobility.partner?.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formatDate(mobility.startDate)} — {formatDate(mobility.endDate)}
                </span>
              </div>
              <div className="mt-6">
                <ShareButton />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12 space-y-14">
          {/* Description */}
          {mobility.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              data-testid="mobility-description"
            >
              <p className="text-slate-600 leading-relaxed text-lg">{mobility.description}</p>
            </motion.div>
          )}

          {/* Host center / partner card */}
          {mobility.partner && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Globe size={20} style={{ color }} /> Centro de acogida
              </h2>
              <PartnerCard partner={mobility.partner as Partner} color={color} />
            </motion.section>
          )}

          {/* Activities */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            data-testid="activities-section"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Leaf size={20} className="text-[#2D5A27]" /> Actividades
              <span className="text-base font-normal text-slate-400 ml-1">({mobility.activities?.length ?? 0})</span>
            </h2>
            {!mobility.activities?.length ? (
              <div className="text-center py-10 text-slate-400 text-sm" data-testid="no-activities">
                <Leaf size={32} className="mx-auto mb-2 opacity-30" />
                No hay actividades registradas aún
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mobility.activities.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                  >
                    <ActivityCard activity={a} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Photo gallery with lightbox */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            data-testid="gallery-section"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Camera size={20} className="text-[#003399]" /> Galería de fotos
              <span className="text-base font-normal text-slate-400 ml-1">({media.length})</span>
            </h2>
            <PhotoGallery images={media} />
          </motion.section>

          {mobility.activities?.length === 0 && media.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">
                El contenido de esta movilidad se actualizará próximamente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
