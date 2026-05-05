import {
  useGetActivities, useCreateActivity, useUpdateActivity, useDeleteActivity,
  useGetMobilities, getGetActivitiesQueryKey,
} from "@workspace/api-client-react";
import type { Activity } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, BookOpen, X, ImageOff, Upload, Link } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const activitySchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url("URL inválida").or(z.string().startsWith("/uploads/")).optional().nullable().or(z.literal("")),
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
    defaultValues: activity ?? {},
  });

  const imageUrlValue = useWatch({ control: form.control, name: "imageUrl" });

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
      form.setValue("imageUrl", url, { shouldValidate: true });
      setSelectedFile(file);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
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

          {/* ── Image section ── */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Imagen de portada</label>
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
                  ) : imageUrlValue && selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={imageUrlValue} alt="" className="h-20 rounded-lg object-cover mx-auto" />
                      <p className="text-xs text-slate-500 truncate max-w-full">{selectedFile.name}</p>
                      <p className="text-xs text-green-600 font-medium">✓ Subida correctamente</p>
                    </div>
                  ) : activity?.imageUrl && !selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={activity.imageUrl} alt="" className="h-20 rounded-lg object-cover mx-auto" />
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
                    data-testid="input-activity-image"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />
                </div>
                {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
              </div>
            ) : (
              <div>
                <input
                  {...form.register("imageUrl")}
                  type="url"
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
                />
                {form.formState.errors.imageUrl && (
                  <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.imageUrl.message}</p>
                )}
                {imageUrlValue && !form.formState.errors.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50" style={{ height: 120 }}>
                    <img
                      src={imageUrlValue}
                      alt="Previsualización"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button
              type="submit"
              disabled={create.isPending || update.isPending || uploading}
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
                    <div className="flex items-center gap-3">
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <ImageOff size={14} className="text-slate-300" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{a.title}</div>
                        {a.description && <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{a.description}</div>}
                      </div>
                    </div>
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
