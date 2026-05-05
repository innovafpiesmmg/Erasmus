import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useGetMedia, useGetMobilities } from "@workspace/api-client-react";
import type { MobilityWithPartner, Media } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Camera, MapPin, Calendar, ChevronRight, ImageOff, Play, X, Globe2 } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PhotoLightbox from "@/components/photo-lightbox";

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

const ACADEMIC_YEARS = ["2025-2026", "2026-2027"] as const;
type AcademicYear = (typeof ACADEMIC_YEARS)[number];

function getAcademicYear(dateStr: string): AcademicYear {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 9 ? year : year - 1;
  const label = `${startYear}-${startYear + 1}`;
  return (ACADEMIC_YEARS.includes(label as AcademicYear) ? label : "2025-2026") as AcademicYear;
}

function mediaCountLabel(items: { mediaType?: string }[]) {
  const videos = items.filter((m) => m.mediaType === "video").length;
  const images = items.length - videos;
  if (videos === 0) return images === 1 ? "foto" : "fotos";
  if (images === 0) return videos === 1 ? "vídeo" : "vídeos";
  return "elementos";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function MobilityGallerySection({
  mobility,
  photos,
  index,
}: {
  mobility: MobilityWithPartner;
  photos: Media[];
  index: number;
}) {
  const color = WP_COLORS[mobility.workPackage] ?? "#003399";
  const flag = COUNTRY_FLAGS[mobility.partner?.country ?? ""] ?? "🌍";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: Math.min(index * 0.08, 0.4) }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      data-testid={`gallery-section-${mobility.id}`}
    >
      {/* Accent stripe */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />

      {/* Section header */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ background: color }}
            >
              {mobility.workPackage}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg leading-tight truncate">
                {mobility.partner?.name}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">
                {mobility.theme}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={11} />
                  {flag} {mobility.partner?.city}, {mobility.partner?.country}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(mobility.startDate)}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Camera size={11} />
                  {photos.length} {mediaCountLabel(photos)}
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/movilidades/${mobility.id}`}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-full transition-all hover:opacity-80"
            style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
            data-testid={`gallery-section-link-${mobility.id}`}
          >
            Ver movilidad <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* Photo grid */}
      <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {photos.map((m, i) => {
          const isVideo = m.mediaType === "video";
          return (
            <motion.button
              type="button"
              key={m.id}
              onClick={() => setLightboxIndex(i)}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 shadow-sm hover:shadow-md transition-all cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ ['--tw-ring-color' as string]: color }}
              aria-label={
                isVideo
                  ? m.caption ? `Reproducir vídeo: ${m.caption}` : "Reproducir vídeo"
                  : m.caption ? `Ampliar foto: ${m.caption}` : "Ampliar foto"
              }
              data-testid={`gallery-photo-${m.id}`}
            >
              {isVideo ? (
                <video
                  src={m.url}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={m.url}
                  alt={m.caption ?? "Erasmus+"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              {isVideo && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  data-testid={`gallery-photo-play-${m.id}`}
                >
                  <div className="w-12 h-12 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white shadow-lg group-hover:bg-black/70 transition-colors">
                    <Play size={20} className="translate-x-0.5" fill="currentColor" />
                  </div>
                </div>
              )}
              {m.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 pt-6">
                  <p className="text-white text-xs leading-snug line-clamp-2 drop-shadow">
                    {m.caption}
                  </p>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      {/* Mobile-only "Ver movilidad" link at the bottom */}
      <div className="px-5 pb-5 sm:hidden">
        <Link
          href={`/movilidades/${mobility.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80"
          style={{ background: `${color}12`, color, border: `1px solid ${color}30` }}
        >
          Ver movilidad <ChevronRight size={12} />
        </Link>
      </div>
    </motion.section>
  );
}

export default function Gallery() {
  const [activeYear, setActiveYear] = useState<AcademicYear>("2025-2026");
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const { data: media = [], isLoading: mediaLoading } = useGetMedia();
  const { data: mobilities = [], isLoading: mobLoading } = useGetMobilities();
  const isLoading = mediaLoading || mobLoading;

  const mobilitiesForYear = mobilities.filter(
    (m) => getAcademicYear(m.startDate) === activeYear,
  );

  const allSectionsForYear = mobilitiesForYear
    .map((mob) => ({
      mobility: mob,
      photos: media.filter(
        (ph) =>
          ph.mobilityId === mob.id &&
          (ph.mediaType === "image" || ph.mediaType === "video"),
      ),
    }))
    .filter(({ photos }) => photos.length > 0);

  const availableCountries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allSectionsForYear) {
      const country = s.mobility.partner?.country;
      if (!country) continue;
      counts.set(country, (counts.get(country) ?? 0) + s.photos.length);
    }
    return Array.from(counts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => a.country.localeCompare(b.country, "es"));
  }, [allSectionsForYear]);

  useEffect(() => {
    if (
      activeCountry !== null &&
      !availableCountries.some((c) => c.country === activeCountry)
    ) {
      setActiveCountry(null);
    }
  }, [activeCountry, availableCountries]);

  const effectiveCountry =
    activeCountry !== null &&
    availableCountries.some((c) => c.country === activeCountry)
      ? activeCountry
      : null;

  const sectionsWithPhotos = effectiveCountry
    ? allSectionsForYear.filter(
        (s) => s.mobility.partner?.country === effectiveCountry,
      )
    : allSectionsForYear;

  const allItems = sectionsWithPhotos.flatMap((s) => s.photos);
  const totalPhotos = sectionsWithPhotos.reduce(
    (acc, s) => acc + s.photos.length,
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader backTo="/" backLabel="Inicio" />

      <div className="pt-16">
        {/* ── Hero ── */}
        <div
          className="py-16 text-white relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #003399 0%, #001a6e 60%, #2D5A27 100%)",
          }}
        >
          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-white/70 uppercase">
                <Camera size={13} /> Momentos
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
                Galería del Proyecto
              </h1>
              <p className="text-white/75 max-w-xl mx-auto text-base sm:text-lg">
                Fotografías de cada movilidad organizadas por curso académico —
                instantáneas de aprendizaje, encuentro y construcción europea.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="bg-white border-b border-slate-100 sticky top-16 z-30 backdrop-blur-sm bg-white/95">
          <div className="max-w-5xl mx-auto px-6 py-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {ACADEMIC_YEARS.map((year) => {
                  const isActive = activeYear === year;
                  return (
                    <button
                      key={year}
                      onClick={() => setActiveYear(year)}
                      className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all border"
                      style={
                        isActive
                          ? {
                              background: "#003399",
                              color: "#fff",
                              borderColor: "#003399",
                            }
                          : {
                              background: "#fff",
                              color: "#475569",
                              borderColor: "#e2e8f0",
                            }
                      }
                      data-testid={`year-filter-${year}`}
                    >
                      Curso {year}
                    </button>
                  );
                })}
              </div>
              {!isLoading && sectionsWithPhotos.length > 0 && (
                <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <Camera size={12} className="text-[#003399]" />
                    <strong className="text-slate-700">{totalPhotos}</strong>{" "}
                    {mediaCountLabel(allItems)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    <strong className="text-slate-700">
                      {sectionsWithPhotos.length}
                    </strong>{" "}
                    {sectionsWithPhotos.length === 1
                      ? "movilidad"
                      : "movilidades"}
                  </span>
                </div>
              )}
            </div>

            {!isLoading && availableCountries.length > 0 && (
              <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 pt-2 flex-shrink-0">
                  <Globe2 size={11} /> País
                </span>
                <div
                  className="flex flex-wrap gap-1.5 pt-1.5 flex-1"
                  data-testid="country-filter-bar"
                >
                  <button
                    onClick={() => setActiveCountry(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border"
                    style={
                      effectiveCountry === null
                        ? {
                            background: "#003399",
                            color: "#fff",
                            borderColor: "#003399",
                          }
                        : {
                            background: "#fff",
                            color: "#475569",
                            borderColor: "#e2e8f0",
                          }
                    }
                    data-testid="country-filter-all"
                  >
                    Todos los países
                  </button>
                  {availableCountries.map(({ country, count }) => {
                    const isActive = effectiveCountry === country;
                    const flag = COUNTRY_FLAGS[country] ?? "🌍";
                    return (
                      <button
                        key={country}
                        onClick={() =>
                          setActiveCountry(isActive ? null : country)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border"
                        style={
                          isActive
                            ? {
                                background: "#003399",
                                color: "#fff",
                                borderColor: "#003399",
                              }
                            : {
                                background: "#fff",
                                color: "#475569",
                                borderColor: "#e2e8f0",
                              }
                        }
                        data-testid={`country-filter-${country}`}
                      >
                        <span aria-hidden>{flag}</span>
                        <span>{country}</span>
                        <span
                          className="text-[10px] font-medium"
                          style={{
                            color: isActive ? "#ffffffb3" : "#94a3b8",
                          }}
                        >
                          {count}
                        </span>
                        {isActive && (
                          <X
                            size={11}
                            className="ml-0.5 -mr-0.5"
                            aria-label={`Quitar filtro ${country}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-14 space-y-8">
          {isLoading ? (
            <div className="space-y-8">
              {[...Array(2)].map((_, s) => (
                <div
                  key={s}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="h-1 w-full bg-slate-200" />
                  <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-video bg-slate-200 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : sectionsWithPhotos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 px-6 text-center"
              data-testid="gallery-empty-state"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <ImageOff size={28} className="text-slate-300" />
              </div>
              {effectiveCountry ? (
                <>
                  <h3 className="text-base font-semibold text-slate-700 mb-1.5">
                    No hay fotografías de {effectiveCountry} en este curso
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Prueba con otro país o quita el filtro para ver todas las
                    fotografías del curso{" "}
                    <strong className="text-slate-700">{activeYear}</strong>.
                  </p>
                  <button
                    onClick={() => setActiveCountry(null)}
                    className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-[#003399] hover:underline"
                    data-testid="gallery-empty-clear-country"
                  >
                    <X size={14} /> Quitar filtro de país
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-slate-700 mb-1.5">
                    Aún no hay fotografías para este curso
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Las imágenes de las movilidades del curso{" "}
                    <strong className="text-slate-700">{activeYear}</strong> se
                    publicarán a medida que se realicen los viajes.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-[#003399] hover:underline"
                  >
                    Volver al inicio <ChevronRight size={14} />
                  </Link>
                </>
              )}
            </motion.div>
          ) : (
            sectionsWithPhotos.map(({ mobility, photos }, i) => (
              <MobilityGallerySection
                key={mobility.id}
                mobility={mobility}
                photos={photos}
                index={i}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
