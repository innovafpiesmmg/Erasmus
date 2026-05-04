import { useParams, Link } from "wouter";
import { useGetMobility, useGetMedia } from "@workspace/api-client-react";
import type { Activity, Partner } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Camera, Leaf, ArrowRight, Globe, ExternalLink, Instagram, Twitter, Star } from "lucide-react";
import PublicHeader from "@/components/public-header";

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
      <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-[#003399]/20 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
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

  const { data: mobility, isLoading } = useGetMobility(id);
  const { data: media = [] } = useGetMedia({ mobilityId: id });

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

  if (!mobility) {
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
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
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
          {mobility.activities.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Leaf size={20} className="text-[#2D5A27]" /> Actividades
              </h2>
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
            </motion.section>
          )}

          {/* Photo gallery */}
          {media.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Camera size={20} className="text-[#003399]" /> Galería
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {media.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <img
                        src={m.url}
                        alt={m.caption ?? "Erasmus+"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {m.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white text-xs">{m.caption}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {mobility.activities.length === 0 && media.length === 0 && (
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
