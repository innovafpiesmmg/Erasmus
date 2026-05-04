import {
  useGetActivities, useCreateActivity, useUpdateActivity, useDeleteActivity,
  useGetMobilities, getGetActivitiesQueryKey,
} from "@workspace/api-client-react";
import type { Activity } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, BookOpen, X } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const activitySchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  mobilityId: z.coerce.number().optional().nullable(),
});
type ActivityForm = z.infer<typeof activitySchema>;

function ActivityModal({ activity, onClose }: { activity?: Activity; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: mobilities = [] } = useGetMobilities();
  const create = useCreateActivity({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetActivitiesQueryKey() }); onClose(); } } });
  const update = useUpdateActivity({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetActivitiesQueryKey() }); onClose(); } } });

  const form = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: activity || {},
  });

  const onSubmit = (data: ActivityForm) => {
    const payload = {
      title: data.title,
      description: data.description || "",
      imageUrl: data.imageUrl || null,
      mobilityId: data.mobilityId || null,
    };
    if (activity) {
      update.mutate({ id: activity.id, data: payload });
    } else {
      create.mutate({ data: payload });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{activity ? "Editar actividad" : "Nueva actividad"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Título *</label>
            <input {...form.register("title")} data-testid="input-activity-title" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
            {form.formState.errors.title && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
            <textarea {...form.register("description")} rows={3} data-testid="input-activity-description" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Movilidad asociada</label>
            <select {...form.register("mobilityId")} data-testid="select-mobility" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20">
              <option value="">Sin asociar</option>
              {mobilities.map((m) => (
                <option key={m.id} value={m.id}>{m.partner?.name} — {m.theme} ({m.workPackage})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Imagen (URL)</label>
            <input {...form.register("imageUrl")} type="url" data-testid="input-activity-image" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
            {form.formState.errors.imageUrl && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.imageUrl.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              data-testid="button-save-activity"
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

export default function AdminActivities() {
  const { data: activities = [], isLoading } = useGetActivities();
  const qc = useQueryClient();
  const deleteActivity = useDeleteActivity({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetActivitiesQueryKey() }) } });
  const [modal, setModal] = useState<"create" | number | null>(null);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Actividades</h1>
          <p className="text-slate-500 text-sm mt-0.5">{activities.length} actividades registradas</p>
        </div>
        <button onClick={() => setModal("create")} data-testid="button-create-activity" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#003399" }}>
          <Plus size={16} /> Nueva actividad
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Título</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 hidden md:table-cell">Movilidad</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50" data-testid={`activity-row-${a.id}`}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900 text-sm">{a.title}</div>
                    {a.description && <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.description}</div>}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {a.mobilityId ? (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Movilidad #{a.mobilityId}</span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin asociar</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setModal(a.id)} data-testid={`button-edit-activity-${a.id}`} className="p-1.5 text-slate-400 hover:text-[#003399] rounded-lg hover:bg-[#003399]/10 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => { if (confirm("¿Eliminar esta actividad?")) deleteActivity.mutate({ id: a.id }); }} data-testid={`button-delete-activity-${a.id}`} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activities.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay actividades aún</p>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <ActivityModal
          activity={typeof modal === "number" ? activities.find((a) => a.id === modal) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </AdminLayout>
  );
}
