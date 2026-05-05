import { useRef, useEffect } from "react";
import type { Partner } from "@workspace/api-client-react";

export function DestinationMap({ partner, color }: { partner: Partner; color: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!partner.lat || !partner.lng) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [partner.lat, partner.lng],
        zoom: 12,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const marker = L.circleMarker([partner.lat, partner.lng], {
        radius: 10,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:160px">
          <div style="font-weight:700;color:${color};font-size:14px;margin-bottom:2px">${partner.name}</div>
          <div style="color:#666;font-size:12px">${partner.city}, ${partner.country}</div>
          <a href="https://www.google.com/maps?q=${partner.lat},${partner.lng}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;color:${color};font-weight:600;text-decoration:none;">📍 Cómo llegar</a>
        </div>
      `);

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [partner, color]);

  if (!partner.lat || !partner.lng) return null;

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-2xl overflow-hidden border border-slate-100 shadow-sm isolate"
      data-testid="destination-map"
    />
  );
}
