import {
  useGetMobilities, useCreateMobility, useUpdateMobility, useDeleteMobility,
  useGetPartners, useGetActivities, getGetMobilitiesQueryKey,
} from "@workspace/api-client-react";
import type { MobilityWithPartner } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Calendar, X, Upload, Link } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const WORK_PACKAGES = ["WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7"];

const mobilitySchema = z.object({
  partnerId: z.coerce.number().min(1, "Selecciona un socio"),
  workPackage: z.string().min(1, "Selecciona un work package"),
  theme: z.string().min(1, "Tema requerido"),
  startDate: z.string().min(1, "Fecha de inicio requerida"),
  endDate: z.string().min(1, "Fecha de fin requerida"),
  headerImageUrl: z.string().url().or(z.string().startsWith("/uploads/")).optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
});
type MobilityForm = z.infer<typeof mobilitySchema>;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function MobilityModal({ mobility, activityCount = 0, onClose }: { mobility?: MobilityWithPartner; activityCount?: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: partners = [] } = useGetPartners();
  const create = useCreateMobility({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMobilitiesQueryKey() }); onClose(); } } });
  const update = useUpdateMobility({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMobilitiesQueryKey() }); onClose(); } } });

  const form = useForm<MobilityForm>({
    resolver: zodResolver(mobilitySchema),
    defaultValues: mobility ? { ...mobility } : {},
  });

  const headerImageUrlValue = useWatch({ control: form.control, name: "headerImageUrl" });

  const [imgTab, setImgTab] = useState<"upload" | "url">("upload");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Error al subir");
      }
      const { url } = await res.json() as { url: string };
      form.setValue("headerImageUrl", url, { shouldValidate: true });
      setSelectedFile(file);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

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
            <label className="block text-xs font-medium text-slate-700 mb-2">Imagen de cabecera</label>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-3">
              <button
                type="button"
                onClick={() => setImgTab("upload")}
                className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${imgTab === "upload" ? "bg-[#003399] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Upload size={13} /> Subir archivo
              </button>
              <button
                type="button"
                onClick={() => setImgTab("url")}
                className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${imgTab === "url" ? "bg-[#003399] text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Link size={13} /> Por URL
              </button>
            </div>

            {imgTab === "upload" ? (
              <div>
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileUpload(file);
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-[#003399] bg-blue-50" : uploading ? "border-slate-200 bg-slate-50 cursor-wait" : "border-slate-200 hover:border-slate-300"}`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">Subiendo...</p>
                    </div>
                  ) : headerImageUrlValue && selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={headerImageUrlValue} alt="" className="h-20 rounded-lg object-cover mx-auto" />
                      <p className="text-xs text-slate-500 truncate max-w-full">{selectedFile.name}</p>
                      <p className="text-xs text-green-600 font-medium">✓ Subida correctamente</p>
                    </div>
                  ) : mobility?.headerImageUrl && !selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={mobility.headerImageUrl} alt="" className="h-20 rounded-lg object-cover mx-auto" />
                      <p className="text-xs text-slate-400">Haz clic para cambiar la imagen</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} className="mx-auto mb-2 text-slate-300" />
                      <p className="text-sm text-slate-500">Arrastra aquí o <span className="text-[#003399] font-medium">selecciona un archivo</span></p>
                      <p className="text-xs text-slate-400 mt-1">JPEG, PNG, GIF, WebP · Máx. 20 MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    data-testid="input-header-image"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />
                </div>
                {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
              </div>
            ) : (
              <div>
                <input
                  {...form.register("headerImageUrl")}
                  type="url"
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
                />
                {form.formState.errors.headerImageUrl && (
                  <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.headerImageUrl.message}</p>
                )}
                {headerImageUrlValue && !form.formState.errors.headerImageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50" style={{ height: 120 }}>
                    <img src={headerImageUrlValue} alt="Previsualización" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {mobility && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100" data-testid="modal-activity-count">
              <span className="text-xs text-slate-500">Actividades vinculadas:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${activityCount > 0 ? "bg-[#2D5A27]/10 text-[#2D5A27]" : "bg-slate-100 text-slate-400"}`}>
                {activityCount}
              </span>
            </div>
          )}

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
  const { data: activities = [] } = useGetActivities();
  const qc = useQueryClient();
  const deleteMobility = useDeleteMobility({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMobilitiesQueryKey() }) } });
  const [modal, setModal] = useState<"create" | number | null>(null);

  const activityCountByMobility = activities.reduce<Record<number, number>>((acc, a) => {
    if (a.mobilityId != null) acc[a.mobilityId] = (acc[a.mobilityId] ?? 0) + 1;
    return acc;
  }, {});

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
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 hidden lg:table-cell">Actividades</th>
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
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${(activityCountByMobility[m.id] ?? 0) > 0 ? "bg-[#2D5A27]/10 text-[#2D5A27]" : "bg-slate-100 text-slate-400"}`} data-testid={`activity-count-${m.id}`}>
                        {activityCountByMobility[m.id] ?? 0} actividades
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
          activityCount={typeof modal === "number" ? (activityCountByMobility[modal] ?? 0) : 0}
          onClose={() => setModal(null)}
        />
      )}
    </AdminLayout>
  );
}
