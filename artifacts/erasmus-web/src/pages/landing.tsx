import { useGetPartners, useGetMobilities, useGetSettings, useGetActivities, useGetMedia } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Globe, ChevronDown, ArrowRight, Users, Leaf, Camera } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";

const COUNTRY_FLAGS: Record<string, string> = {
  España: "🇪🇸",
  Turquía: "🇹🇷",
  Letonia: "🇱🇻",
  Rumanía: "🇷🇴",
  Portugal: "🇵🇹",
  Macedonia: "🇲🇰",
};

const WP_COLORS: Record<string, string> = {
  WP2: "#003399",
  WP3: "#2D5A27",
  WP4: "#1565C0",
  WP5: "#6A1B9A",
  WP6: "#E65100",
  WP7: "#00695C",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function HeroSection({ settings }: { settings: any }) {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #003399 0%, #001a6e 60%, #2D5A27 100%)" }}
    >
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1600&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,51,153,0.92) 0%, rgba(0,26,110,0.85) 60%, rgba(45,90,39,0.88) 100%)" }} />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center justify-center gap-6 mb-8"
        >
          <img src="/logo-ies-nobg.png" alt="IES Manuel Martín González" className="h-16 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          <div className="w-px h-12 bg-white/30" />
          <img src="/logo-erasmus.png" alt="Erasmus+" className="h-12 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Proyecto Erasmus+ SEA · 2025–2027
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6"
        >
          {settings?.heroTitle || "Pequeños cambios, grandes transformaciones"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-lg md:text-xl text-white/75 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          {settings?.heroSubtitle || "Proyecto Erasmus+ SEA · IES Manuel Martín González · Guía de Isora, Tenerife"}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="#socios"
            className="inline-flex items-center gap-2 bg-white text-[#003399] font-semibold px-8 py-3.5 rounded-full hover:bg-white/90 transition-all shadow-lg"
            data-testid="hero-btn-socios"
          >
            <Globe size={18} /> Ver socios
          </a>
          <a
            href="#movilidades"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/20 transition-all"
            data-testid="hero-btn-movilidades"
          >
            <Calendar size={18} /> Movilidades
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce"
      >
        <ChevronDown size={28} />
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
    </section>
  );
}

function StatsBar({ partners, mobilities }: { partners: any[]; mobilities: any[] | undefined }) {
  const stats = [
    { label: "Países participantes", value: partners.length || 6, icon: Globe },
    { label: "Movilidades planificadas", value: mobilities?.length ?? 6, icon: Calendar },
    { label: "Años de proyecto", value: "2024–2027", icon: Leaf },
    { label: "Programa", value: "Erasmus+ SEA", icon: Users },
  ];

  return (
    <section className="bg-white border-b border-slate-100 py-6">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
            data-testid={`stat-${i}`}
          >
            <s.icon size={20} className="mx-auto mb-1 text-[#003399]" />
            <div className="text-2xl font-bold text-[#003399]">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PartnersMap({ partners, mobilities }: { partners: any[]; mobilities: any[] | undefined }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !partners.length || mobilities === undefined) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [50, 15],
        zoom: 4,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      partners.forEach((p) => {
        const partnerMobilities = mobilities.filter((m: any) => m.partnerId === p.id);
        const mobilityRows = partnerMobilities.length
          ? partnerMobilities.map((m: any) => {
              const wpColor = WP_COLORS[m.workPackage] || "#003399";
              return `<div style="display:flex;align-items:center;gap:6px;margin-top:4px">
                <span style="background:${wpColor};color:#fff;font-size:9px;padding:1px 6px;border-radius:8px;white-space:nowrap">${m.workPackage}</span>
                <span style="color:#444;font-size:11px">${m.theme}</span>
              </div>
              <div style="color:#888;font-size:10px;margin-left:2px">${formatDate(m.startDate)} – ${formatDate(m.endDate)}</div>`;
            }).join("")
          : "";

        const marker = L.circleMarker([p.lat, p.lng], {
          radius: p.isCoordinator ? 12 : 9,
          fillColor: p.isCoordinator ? "#003399" : "#2D5A27",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:200px;font-family:system-ui;max-width:240px">
            <div style="font-weight:700;color:#003399;font-size:14px;margin-bottom:2px">${p.name}</div>
            <div style="color:#666;font-size:12px;margin-bottom:6px">${p.city}, ${p.country} ${COUNTRY_FLAGS[p.country] || ""}</div>
            ${p.isCoordinator ? '<div style="margin-bottom:6px"><span style="background:#003399;color:#fff;font-size:10px;padding:2px 8px;border-radius:12px">Coordinador</span></div>' : ""}
            ${mobilityRows ? `<div style="border-top:1px solid #eee;padding-top:6px;margin-top:2px">${mobilityRows}</div>` : ""}
          </div>
        `);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [partners, mobilities]);

  return (
    <section id="socios" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold tracking-widest text-[#003399] uppercase">Red Europea</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-3">Nuestros Socios</h2>
          <p className="text-slate-500 max-w-xl mx-auto">6 centros educativos de 6 países europeos unidos por un objetivo común: construir un futuro más sostenible.</p>
        </motion.div>

        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 mb-10" style={{ height: 420 }}>
          <div ref={mapRef} style={{ height: "100%", width: "100%" }} data-testid="partners-map" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl border border-slate-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`partner-card-${p.id}`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: p.isCoordinator ? "#003399" : "#f1f5f9" }}>
                {p.isCoordinator ? <span className="text-white text-xs font-bold">CO</span> : <span>{COUNTRY_FLAGS[p.country] || "🌍"}</span>}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 text-sm leading-tight">{p.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{p.city}, {p.country}</div>
                {p.isCoordinator && (
                  <span className="mt-1.5 inline-block text-xs bg-[#003399]/10 text-[#003399] px-2 py-0.5 rounded-full">Coordinador</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobilitiesTimeline({ mobilities }: { mobilities: any[] | undefined }) {
  return (
    <section id="movilidades" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-widest text-[#2D5A27] uppercase">Calendario</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-3">Movilidades</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Cada movilidad es una oportunidad de aprender, crecer y conectar con Europa.</p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />

          {(mobilities ?? []).map((m, i) => {
            const isPast = new Date(m.startDate) < new Date();
            const color = WP_COLORS[m.workPackage] || "#003399";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex gap-8 pb-10 last:pb-0"
                data-testid={`mobility-item-${m.id}`}
              >
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-full border-4 border-white shadow-md flex items-center justify-center z-10"
                  style={{ background: color }}
                >
                  <span className="text-white text-xs font-bold text-center leading-tight">{m.workPackage}</span>
                </div>

                <div className={`flex-1 bg-white rounded-xl border ${isPast ? "border-slate-100" : "border-[#003399]/20"} p-5 shadow-sm`}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-slate-900">{m.partner?.name}</div>
                      <div className="text-xs text-slate-500">{m.partner?.city}, {m.partner?.country} {COUNTRY_FLAGS[m.partner?.country] || ""}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isPast ? "bg-slate-100 text-slate-500" : "bg-[#003399]/10 text-[#003399]"}`}>
                      {isPast ? "Completada" : "Próxima"}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 mb-1">{m.theme}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatDate(m.startDate)} — {formatDate(m.endDate)}
                  </div>
                  {m.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{m.description}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ media }: { media: any[] }) {
  const images = media.filter((m) => m.mediaType === "image").slice(0, 6);
  if (!images.length) return null;

  return (
    <section id="galeria" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <span className="text-xs font-semibold tracking-widest text-[#003399] uppercase">Momentos</span>
            <h2 className="text-4xl font-bold text-slate-900 mt-1">Galería</h2>
          </div>
          <Camera size={32} className="text-slate-300" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`media-item-${m.id}`}
            >
              <img src={m.url} alt={m.caption || "Erasmus+"} className="w-full h-full object-cover" loading="lazy" />
              {m.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-xs">{m.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActivitiesSection({ activities }: { activities: any[] }) {
  if (!activities.length) return null;

  return (
    <section id="actividades" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold tracking-widest text-[#2D5A27] uppercase">Aprendizaje</span>
          <h2 className="text-4xl font-bold text-slate-900 mt-2 mb-3">Actividades</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Cada movilidad genera aprendizajes concretos que se comparten con toda la comunidad educativa.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.slice(0, 6).map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-[#003399]/20 hover:shadow-md transition-all"
              data-testid={`activity-card-${a.id}`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#003399]/10 flex items-center justify-center mb-4">
                <Leaf size={16} className="text-[#003399]" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 leading-tight">{a.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{a.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ settings }: { settings: any }) {
  return (
    <footer style={{ background: "#001a6e" }} className="py-12 text-white/80">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div>
            <div className="font-bold text-white text-lg mb-1">{settings?.siteTitle || "IES Manuel Martín González"}</div>
            <div className="text-sm text-white/60">{settings?.projectName || "The small big changes"} · Erasmus+ SEA</div>
            {settings?.address && <div className="text-xs text-white/50 mt-2">{settings.address}</div>}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {settings?.email && <a href={`mailto:${settings.email}`} className="text-white/70 hover:text-white transition-colors">{settings.email}</a>}
            {settings?.phone && <span className="text-white/60">{settings.phone}</span>}
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-white/40">
          <span>© 2025–2027 IES Manuel Martín González · Proyecto financiado por la Unión Europea</span>
          <Link href="/admin/login" className="hover:text-white/70 transition-colors">Acceso administración</Link>
        </div>
      </div>
    </footer>
  );
}

function Navbar({ settings }: { settings: any }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={scrolled ? "/logo-ies.jpg" : "/logo-ies-nobg.png"}
            alt="IES Manuel Martín González"
            className="h-9 w-auto object-contain"
            style={scrolled ? {} : { filter: "brightness(0) invert(1)" }}
          />
          <div className={`font-bold text-sm leading-tight hidden sm:block ${scrolled ? "text-[#003399]" : "text-white"}`}>
            {settings?.siteTitle || "IES Manuel Martín González"}
          </div>
        </div>
        <div className="flex items-center gap-6">
          {[
            { href: "#socios", label: "Socios" },
            { href: "#movilidades", label: "Movilidades" },
            { href: "#galeria", label: "Galería" },
            { href: "#actividades", label: "Actividades" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hidden md:block ${scrolled ? "text-slate-600 hover:text-[#003399]" : "text-white/80 hover:text-white"}`}
            >
              {item.label}
            </a>
          ))}
          <img
            src="/logo-erasmus.png"
            alt="Erasmus+"
            className="h-8 w-auto object-contain hidden md:block"
            style={scrolled ? {} : { filter: "brightness(0) invert(1)" }}
          />
        </div>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  const { data: partners = [] } = useGetPartners();
  const { data: mobilities } = useGetMobilities();
  const { data: settings } = useGetSettings();
  const { data: activities = [] } = useGetActivities();
  const { data: media = [] } = useGetMedia();

  return (
    <div className="min-h-screen">
      <Navbar settings={settings} />
      <HeroSection settings={settings} />
      <StatsBar partners={partners} mobilities={mobilities} />
      <PartnersMap partners={partners} mobilities={mobilities} />
      <MobilitiesTimeline mobilities={mobilities} />
      <GallerySection media={media} />
      <ActivitiesSection activities={activities} />
      <Footer settings={settings} />
    </div>
  );
}
