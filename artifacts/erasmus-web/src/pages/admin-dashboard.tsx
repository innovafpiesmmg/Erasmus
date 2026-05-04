import { useGetDashboardSummary, useGetUpcomingMobilities } from "@workspace/api-client-react";
import { Users, Calendar, BookOpen, Image, TrendingUp, Clock, type LucideIcon } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const COUNTRY_FLAGS: Record<string, string> = {
  España: "🇪🇸", Turquía: "🇹🇷", Letonia: "🇱🇻",
  Rumanía: "🇷🇴", Portugal: "🇵🇹", Macedonia: "🇲🇰",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: upcoming = [], isLoading: upcomingLoading } = useGetUpcomingMobilities();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen del proyecto Erasmus+ SEA</p>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Socios" value={summary?.totalPartners ?? 0} color="#003399" />
          <StatCard icon={Calendar} label="Movilidades" value={summary?.totalMobilities ?? 0} color="#2D5A27" />
          <StatCard icon={BookOpen} label="Actividades" value={summary?.totalActivities ?? 0} color="#1565C0" />
          <StatCard icon={Image} label="Archivos media" value={summary?.totalMedia ?? 0} color="#6A1B9A" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#003399]" />
            <h2 className="font-semibold text-slate-900 text-sm">Próximas movilidades</h2>
            {summary && (
              <span className="ml-auto text-xs bg-[#003399]/10 text-[#003399] px-2 py-0.5 rounded-full">
                {summary.upcomingCount} pendientes
              </span>
            )}
          </div>

          {upcomingLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No hay movilidades próximas</div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50" data-testid={`upcoming-${m.id}`}>
                  <div className="flex-shrink-0 text-lg">{COUNTRY_FLAGS[m.partner?.country] || "🌍"}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{m.partner?.name}</div>
                    <div className="text-xs text-slate-500">{m.theme} · {formatDate(m.startDate)}</div>
                  </div>
                  <span className="flex-shrink-0 text-xs bg-[#003399]/10 text-[#003399] px-2 py-0.5 rounded-full font-medium">{m.workPackage}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#2D5A27]" />
            <h2 className="font-semibold text-slate-900 text-sm">Estado del proyecto</h2>
          </div>
          {summary && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Movilidades completadas</span>
                  <span className="font-semibold">{summary.pastCount} / {summary.totalMobilities}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${summary.totalMobilities > 0 ? (summary.pastCount / summary.totalMobilities) * 100 : 0}%`, background: "#2D5A27" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#003399]">{summary.pastCount}</div>
                  <div className="text-xs text-slate-500">Completadas</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#2D5A27]">{summary.upcomingCount}</div>
                  <div className="text-xs text-slate-500">Pendientes</div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Proyecto en desarrollo 2024–2027. Cada movilidad representa una oportunidad de aprendizaje y colaboración internacional.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
