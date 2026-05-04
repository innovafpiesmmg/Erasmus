import {
  useGetMobilities, useCreateMobility, useUpdateMobility, useDeleteMobility,
  useGetPartners, getGetMobilitiesQueryKey,
} from "@workspace/api-client-react";
import type { MobilityWithPartner } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Calendar, X } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const WORK_PACKAGES = ["WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7"];

const mobilitySchema = z.object({
  partnerId: z.coerce.number().min(1, "Selecciona un socio"),
  workPackage: z.string().min(1, "Selecciona un work package"),
  theme: z.string().min(1, "Tema requerido"),
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().min(1, "Fecha de fin requerida"),
  headerImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
});
type MobilityForm = z.infer<typeof mobilitySchema>;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function MobilityModal({ mobility, onClose }: { mobility?: MobilityWithPartner; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: partners = [] } = useGetPartners();
  const create = useCreateMobility({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMobilitiesQueryKey() }); onClose(); } } });
  const update = useUpdateMobility({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMobilitiesQueryKey() }); onClose(); } } });

  const form = useForm<MobilityForm>({
    resolver: zodResolver(mobilitySchema),
    defaultValues: mobility ? { ...mobility } : {},
  });

  const onSubmit = (data: MobilityForm) => {
    const payload = { ...data, headerImageUrl: data.headerImageUrl || null, description: data.description || null };
    if (mobility) {
      update.mutate({ id: mobility.id, data: payload });
    } else {
      create.mutate({ data: payload });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{mobility ? "Editar movilidad" : "Nueva movilidad"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Centro destino *</label>
            <select {...form.register("partnerId")} data-testid="select-partner" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20">
              <option value="">Seleccionar socio</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.country})</option>)}
            </select>
            {form.formState.errors.partnerId && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.partnerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Work Package *</label>
              <select {...form.register("workPackage")} data-testid="select-wp" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20">
                <option value="">Seleccionar</option>
                {WORK_PACKAGES.map((wp) => <option key={wp} value={wp}>{wp}</option>)}
              </select>
              {form.formState.errors.workPackage && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.workPackage.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tema *</label>
              <input {...form.register("theme")} data-testid="input-theme" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" placeholder="Ej: Uso del Plástico" />
              {form.formState.errors.theme && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.theme.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha inicio *</label>
              <input {...form.register("startDate")} type="date" data-testid="input-start-date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.startDate && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha fin *</label>
              <input {...form.register("endDate")} type="date" data-testid="input-end-date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.endDate && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
            <textarea {...form.register("description")} rows={3} data-testid="input-description" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Imagen de cabecera (URL)</label>
            <input {...form.register("headerImageUrl")} type="url" data-testid="input-header-image" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              data-testid="button-save-mobility"
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "#003399" }}
            >
              {(create.isPending || update.isPending) ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminMobilities() {
  const { data: mobilities = [], isLoading } = useGetMobilities();
  const qc = useQueryClient();
  const deleteMobility = useDeleteMobility({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMobilitiesQueryKey() }) } });
  const [modal, setModal] = useState<"create" | number | null>(null);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Movilidades</h1>
          <p className="text-slate-500 text-sm mt-0.5">{mobilities.length} movilidades registradas</p>
        </div>
        <button onClick={() => setModal("create")} data-testid="button-create-mobility" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#003399" }}>
          <Plus size={16} /> Nueva movilidad
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Centro</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 hidden md:table-cell">WP / Tema</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 hidden md:table-cell">Fechas</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {mobilities.map((m) => {
                const isPast = new Date(m.startDate) < new Date();
                return (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50" data-testid={`mobility-row-${m.id}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900 text-sm">{m.partner?.name}</div>
                      <div className="text-xs text-slate-400">{m.partner?.country}</div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-xs font-semibold text-[#003399] mr-2">{m.workPackage}</span>
                      <span className="text-xs text-slate-600">{m.theme}</span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} /> {formatDate(m.startDate)} — {formatDate(m.endDate)}
                      </div>
                      <span className={`text-xs mt-0.5 inline-block px-2 py-0.5 rounded-full ${isPast ? "bg-slate-100 text-slate-400" : "bg-[#003399]/10 text-[#003399]"}`}>
                        {isPast ? "Completada" : "Próxima"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setModal(m.id)} data-testid={`button-edit-mobility-${m.id}`} className="p-1.5 text-slate-400 hover:text-[#003399] rounded-lg hover:bg-[#003399]/10 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { if (confirm("¿Eliminar esta movilidad?")) deleteMobility.mutate({ id: m.id }); }} data-testid={`button-delete-mobility-${m.id}`} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {mobilities.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No hay movilidades aún</div>}
        </div>
      )}

      {modal !== null && (
        <MobilityModal
          mobility={typeof modal === "number" ? mobilities.find((m) => m.id === modal) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </AdminLayout>
  );
}
