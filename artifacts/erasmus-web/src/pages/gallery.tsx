import { useState } from "react";
import { Link } from "wouter";
import { useGetMedia, useGetMobilities } from "@workspace/api-client-react";
import type { MobilityWithPartner, Media } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import PublicHeader from "@/components/public-header";

const WP_COLORS: Record<string, string> = {
  WP2: "#003399",
  WP3: "#2D5A27",
  WP4: "#1565C0",
  WP5: "#6A1B9A",
  WP6: "#E65100",
  WP7: "#00695C",
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
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold text-white px-3 py-1 rounded-full flex-shrink-0"
            style={{ background: color }}
          >
            {mobility.workPackage}
          </span>
          <div>
            <div className="font-semibold text-slate-900 text-sm leading-tight">
              {mobility.partner?.name}
            </div>
            <div className="text-xs text-slate-500">{mobility.theme}</div>
          </div>
        </div>
        <Link
          href={`/movilidades/${mobility.id}`}
          className="text-xs text-[#003399] hover:underline whitespace-nowrap"
        >
          Ver movilidad →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + i * 0.04 }}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <img
                src={m.url}
                alt={m.caption ?? "Erasmus+"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {m.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{m.caption}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export default function Gallery() {
  const [activeYear, setActiveYear] = useState<AcademicYear>("2025-2026");
  const { data: media = [], isLoading: mediaLoading } = useGetMedia();
  const { data: mobilities = [], isLoading: mobLoading } = useGetMobilities();
  const isLoading = mediaLoading || mobLoading;

  const mobilitiesForYear = mobilities.filter(
    (m) => getAcademicYear(m.startDate) === activeYear,
  );

  const sectionsWithPhotos = mobilitiesForYear
    .map((mob) => ({
      mobility: mob,
      photos: media.filter((ph) => ph.mobilityId === mob.id),
    }))
    .filter(({ photos }) => photos.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader backTo="/" backLabel="Inicio" />

      <div className="pt-16">
        <div className="bg-white border-b border-slate-100 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="text-xs font-semibold tracking-widest text-[#003399] uppercase">
                Momentos
              </span>
              <h1 className="text-4xl font-bold text-slate-900 mt-2 mb-2">
                Galería del Proyecto
              </h1>
              <p className="text-slate-500 text-sm">
                Fotografías organizadas por curso académico y movilidad
              </p>
            </motion.div>

            <div className="flex gap-2 mt-8">
              {ACADEMIC_YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className="px-5 py-2 rounded-full text-sm font-medium transition-all"
                  style={
                    activeYear === year
                      ? { background: "#003399", color: "#fff" }
                      : { background: "#f1f5f9", color: "#475569" }
                  }
                >
                  Curso {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-video bg-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sectionsWithPhotos.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Camera size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                Las fotografías de este curso se publicarán próximamente.
              </p>
            </div>
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
