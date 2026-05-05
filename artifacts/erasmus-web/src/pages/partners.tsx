import { useGetPartners } from "@workspace/api-client-react";
import type { Partner } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Globe, ExternalLink, Instagram, Twitter, Star, X, Building2, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import PublicHeader from "@/components/public-header";
import { DestinationMap } from "@/components/destination-map";

const COUNTRY_FLAGS: Record<string, string> = {
  España: "🇪🇸",
  Turquía: "🇹🇷",
  Letonia: "🇱🇻",
  Rumanía: "🇷🇴",
  Portugal: "🇵🇹",
  Macedonia: "🇲🇰",
};

const COUNTRY_PHOTOS: Record<string, string> = {
  España: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&auto=format&fit=crop",
  Turquía: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&auto=format&fit=crop",
  Letonia: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=600&auto=format&fit=crop",
  Rumanía: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop",
  Portugal: "https://images.unsplash.com/photo-1513735539099-cf2b703b351d?w=600&auto=format&fit=crop",
  Macedonia: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&auto=format&fit=crop",
};

const PARTNER_COLORS = [
  "#003399",
  "#2D5A27",
  "#1565C0",
  "#6A1B9A",
  "#E65100",
  "#00695C",
];

function getPartnerColor(index: number) {
  return PARTNER_COLORS[index % PARTNER_COLORS.length];
}

function PartnerDetailModal({ partner, color, onClose }: { partner: Partner; color: string; onClose: () => void }) {
  const flag = COUNTRY_FLAGS[partner.country] ?? "🌍";
  const countryPhoto = partner.photoUrl ?? COUNTRY_PHOTOS[partner.country];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        data-testid="partner-modal-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          data-testid="partner-modal"
        >
          <div
            className="relative h-40 flex items-end"
            style={countryPhoto ? { backgroundImage: `url(${countryPhoto})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: color }}
          >
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${color}ee 0%, ${color}55 60%, transparent 100%)` }} />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              data-testid="partner-modal-close"
            >
              <X size={16} />
            </button>
            <div className="relative z-10 p-5 w-full flex items-end gap-4">
              {partner.logoUrl ? (
                <img
                  src={partner.logoUrl}
                  alt={partner.name}
                  className="w-16 h-16 rounded-xl object-contain bg-white border-2 border-white/30 shadow-lg p-1 flex-shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-2 border-white/30 shadow-lg"
                  style={{ background: `${color}cc` }}
                >
                  {partner.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                {partner.isCoordinator && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full mb-1">
                    <Star size={9} fill="currentColor" /> Coordinador
                  </span>
                )}
                <h2 className="text-white font-bold text-lg leading-snug drop-shadow" data-testid="partner-modal-name">
                  {partner.name}
                </h2>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin size={12} /> {flag} {partner.city}, {partner.country}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {partner.oid && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                <Building2 size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">Identificador OID</p>
                  <p className="text-sm font-mono text-slate-700" data-testid="partner-modal-oid">{partner.oid}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {partner.webUrl && (
                <a
                  href={partner.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
                  data-testid="partner-modal-web"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                    <Globe size={16} style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">Sitio web</p>
                    <p className="text-sm text-slate-700 truncate">{partner.webUrl}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
                </a>
              )}

              {partner.socialInstagram && (
                <a
                  href={`https://instagram.com/${partner.socialInstagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-pink-100 hover:bg-pink-50 transition-all group"
                  data-testid="partner-modal-instagram"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Instagram size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">Instagram</p>
                    <p className="text-sm text-slate-700">{partner.socialInstagram}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-pink-400 flex-shrink-0 transition-colors" />
                </a>
              )}

              {partner.socialTwitter && (
                <a
                  href={`https://x.com/${partner.socialTwitter.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-sky-100 hover:bg-sky-50 transition-all group"
                  data-testid="partner-modal-twitter"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <Twitter size={16} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">X / Twitter</p>
                    <p className="text-sm text-slate-700">{partner.socialTwitter}</p>
                  </div>
                  <ExternalLink size={14} className="text-slate-300 group-hover:text-sky-400 flex-shrink-0 transition-colors" />
                </a>
              )}

              {!partner.webUrl && !partner.socialInstagram && !partner.socialTwitter && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <LinkIcon size={16} className="text-slate-300" />
                  <p className="text-sm text-slate-400">No hay enlaces disponibles aún</p>
                </div>
              )}
            </div>

            {partner.lat && partner.lng && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <MapPin size={12} /> Ubicación
                </p>
                <DestinationMap partner={partner} color={color} />
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function PartnerCard({
  partner,
  color,
  index,
  onClick,
}: {
  partner: Partner;
  color: string;
  index: number;
  onClick: () => void;
}) {
  const flag = COUNTRY_FLAGS[partner.country] ?? "🌍";
  const countryPhoto = partner.photoUrl ?? COUNTRY_PHOTOS[partner.country];
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
      data-testid={`partner-card-${partner.id}`}
    >
      <div
        className="relative h-32 overflow-hidden"
        style={countryPhoto && !photoFailed
          ? { backgroundImage: `url(${countryPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }
          : { background: color }
        }
      >
        {countryPhoto && !photoFailed && (
          <img
            src={countryPhoto}
            alt=""
            className="hidden"
            onError={() => setPhotoFailed(true)}
          />
        )}
        <div
          className="absolute inset-0 transition-opacity group-hover:opacity-80"
          style={{ background: `linear-gradient(to bottom, ${color}44 0%, ${color}cc 100%)` }}
        />
        <div className="absolute top-3 right-3">
          <span className="text-2xl drop-shadow">{flag}</span>
        </div>
        {partner.isCoordinator && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
              <Star size={8} fill="currentColor" /> CO
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {partner.logoUrl ? (
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="w-12 h-12 rounded-lg object-contain border border-slate-100 bg-white p-0.5 shadow-sm flex-shrink-0 -mt-7 relative z-10 ring-2 ring-white"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0 -mt-7 relative z-10 ring-2 ring-white shadow-sm"
              style={{ background: color }}
            >
              {partner.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2" data-testid={`partner-name-${partner.id}`}>
              {partner.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> {partner.city}, {partner.country}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {partner.webUrl && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              <Globe size={10} /> Web
            </span>
          )}
          {partner.socialInstagram && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              <Instagram size={10} /> Instagram
            </span>
          )}
          {partner.socialTwitter && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              <Twitter size={10} /> Twitter
            </span>
          )}
        </div>

        <p className="text-xs font-medium mt-3 flex items-center gap-1" style={{ color }}>
          Ver perfil completo <ExternalLink size={10} />
        </p>
      </div>
    </motion.div>
  );
}

export default function PartnersPage() {
  const { data: partners = [], isLoading } = useGetPartners();
  const search = useSearch();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const params = new URLSearchParams(search);
    const id = params.get("partner");
    return id ? Number(id) : null;
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const id = params.get("partner");
    if (id) setSelectedId(Number(id));
  }, [search]);

  const selectedPartner = partners.find((p) => p.id === selectedId);
  const selectedIndex = partners.findIndex((p) => p.id === selectedId);

  const coordinator = partners.find((p) => p.isCoordinator);
  const others = partners.filter((p) => !p.isCoordinator);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader backTo="/" backLabel="Inicio" />

      <div className="pt-16">
        <div
          className="py-16 text-white"
          style={{ background: "linear-gradient(135deg, #003399 0%, #001a6e 60%, #2D5A27 100%)" }}
        >
          <div className="max-w-6xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">Red Europea</span>
              <h1 className="text-5xl font-bold mt-2 mb-4">Nuestros Socios</h1>
              <p className="text-white/70 max-w-xl mx-auto text-lg">
                {partners.length || 6} centros educativos de {partners.length || 6} países europeos unidos por un objetivo común: construir un futuro más sostenible.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-14">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {coordinator && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-10"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold tracking-widest text-[#003399] uppercase">Centro coordinador</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="max-w-sm mx-auto">
                    <PartnerCard
                      partner={coordinator}
                      color={getPartnerColor(0)}
                      index={0}
                      onClick={() => setSelectedId(coordinator.id)}
                    />
                  </div>
                </motion.div>
              )}

              {others.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Centros socios</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {others.map((partner, i) => (
                      <PartnerCard
                        key={partner.id}
                        partner={partner}
                        color={getPartnerColor(i + 1)}
                        index={i}
                        onClick={() => setSelectedId(partner.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {partners.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <Building2 size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No hay socios registrados aún.</p>
                  <Link href="/" className="text-sm text-[#003399] hover:underline mt-2 block">
                    Volver al inicio
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedPartner && (
        <PartnerDetailModal
          partner={selectedPartner}
          color={getPartnerColor(selectedIndex)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
