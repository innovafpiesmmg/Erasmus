import { useGetMedia, useCreateMedia, useDeleteMedia, useUploadMedia, useUpdateMedia, useGetMobilities, getGetMediaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Image, X, Upload, Link, Pencil, Play, Film } from "lucide-react";
import AdminLayout from "@/components/admin-layout";
import VideoThumbnail from "@/components/video-thumbnail";
import { getVideoEmbedInfo, isDirectVideoFile } from "@/lib/video-embed";

const urlSchema = z
  .object({
    url: z.string().url("URL inválida"),
    mediaType: z.enum(["image", "video"]),
    caption: z.string().optional().nullable(),
    mobilityId: z.coerce.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.mediaType !== "video") return;
    const info = getVideoEmbedInfo(data.url);
    if (info.provider !== "youtube" && info.provider !== "vimeo" && !isDirectVideoFile(data.url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Pega un enlace de YouTube, Vimeo o un archivo de vídeo (MP4, WebM…)",
      });
    }
  });
type UrlForm = z.infer<typeof urlSchema>;

const editSchema = z.object({
  caption: z.string().optional().nullable(),
  mobilityId: z.coerce.number().optional().nullable(),
});
type EditForm = z.infer<typeof editSchema>;

function AddMediaModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: mobilities = [] } = useGetMobilities();
  const create = useCreateMedia({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMediaQueryKey() });
        onClose();
      },
    },
  });

  const upload = useUploadMedia({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMediaQueryKey() });
        onClose();
      },
    },
  });

  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadMobilityId, setUploadMobilityId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UrlForm>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "", mediaType: "image", caption: "", mobilityId: null },
  });

  const onUrlSubmit = (data: UrlForm) => {
    create.mutate({ data: { ...data, caption: data.caption || null, mobilityId: data.mobilityId || null } });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    setUploadError(null);
    upload.mutate(
      {
        data: {
          file: selectedFile,
          caption: uploadCaption || null,
          mobilityId: uploadMobilityId ? Number(uploadMobilityId) : null,
        },
      },
      {
        onError: (err: Error) => {
          setUploadError(err?.message ?? "Error al subir el archivo");
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Agregar media</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === "upload" ? "text-[#003399] border-b-2 border-[#003399]" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Upload size={15} /> Subir archivo
          </button>
          <button
            onClick={() => setTab("url")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === "url" ? "text-[#003399] border-b-2 border-[#003399]" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Link size={15} /> Por URL
          </button>
        </div>

        {tab === "upload" ? (
          <div className="p-5 space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileSelect(file);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-[#003399] bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
            >
              {selectedFile ? (
                <div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Image size={20} className="text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500">Arrastra un archivo aquí o <span className="text-[#003399] font-medium">selecciona uno</span></p>
                  <p className="text-xs text-slate-400 mt-1">Imágenes · Máx. 20 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
              <input
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                data-testid="input-upload-caption"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Movilidad asociada</label>
              <select
                value={uploadMobilityId}
                onChange={(e) => setUploadMobilityId(e.target.value)}
                data-testid="select-upload-mobility"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
              >
                <option value="">Sin asociar</option>
                {mobilities.map((m) => <option key={m.id} value={m.id}>{m.partner?.name} — {m.theme}</option>)}
              </select>
            </div>

            {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || upload.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "#003399" }}
              >
                {upload.isPending ? "Subiendo..." : "Subir"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onUrlSubmit)} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo *</label>
              <div className="grid grid-cols-2 gap-2" data-testid="media-type-tabs">
                {(["image", "video"] as const).map((t) => {
                  const selected = form.watch("mediaType") === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => form.setValue("mediaType", t, { shouldValidate: true })}
                      data-testid={`media-type-${t}`}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${selected ? "bg-[#003399] text-white border-[#003399]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      {t === "image" ? "Imagen" : "Vídeo"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                URL {form.watch("mediaType") === "video" ? "del vídeo" : "de la imagen"} *
              </label>
              <input
                {...form.register("url")}
                type="url"
                data-testid="input-media-url"
                placeholder={form.watch("mediaType") === "video" ? "https://youtu.be/... o https://...mp4" : "https://..."}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
              />
              {form.formState.errors.url && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.url.message}</p>}
              {form.watch("mediaType") === "video" && (
                <p className="text-xs text-slate-400 mt-1">
                  Pega un enlace de YouTube, Vimeo o un archivo de vídeo directo (MP4, WebM…).
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
              <input
                {...form.register("caption")}
                data-testid="input-media-caption"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Movilidad asociada</label>
              <select
                {...form.register("mobilityId")}
                data-testid="select-media-mobility"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
              >
                <option value="">Sin asociar</option>
                {mobilities.map((m) => <option key={m.id} value={m.id}>{m.partner?.name} — {m.theme}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button
                type="submit"
                disabled={create.isPending}
                data-testid="button-save-media"
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "#003399" }}
              >
                {create.isPending ? "Guardando..." : "Agregar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

type MediaItem = {
  id: number;
  url: string;
  caption?: string | null;
  mobilityId?: number | null;
  mediaType?: string;
};

function EditMediaModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: mobilities = [] } = useGetMobilities();
  const updateMedia = useUpdateMedia({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMediaQueryKey() });
        onClose();
      },
    },
  });

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      caption: item.caption ?? "",
      mobilityId: item.mobilityId ?? null,
    },
  });

  const onSubmit = (data: EditForm) => {
    updateMedia.mutate({
      id: item.id,
      data: {
        caption: data.caption || null,
        mobilityId: data.mobilityId || null,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Editar foto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <div className="p-5">
          <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-slate-100 relative">
            {item.mediaType === "video" ? (
              (() => {
                const info = getVideoEmbedInfo(item.url);
                if (info.provider === "youtube" || info.provider === "vimeo") {
                  return (
                    <>
                      <VideoThumbnail url={item.url} caption={item.caption} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                          <Play size={20} className="translate-x-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </>
                  );
                }
                return <video src={item.url} className="w-full h-full object-cover" controls preload="metadata" />;
              })()
            ) : (
              <img src={item.url} alt={item.caption || "Media"} className="w-full h-full object-cover" />
            )}
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
              <input
                {...form.register("caption")}
                data-testid="input-edit-caption"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Movilidad asociada</label>
              <select
                {...form.register("mobilityId")}
                data-testid="select-edit-mobility"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
              >
                <option value="">Sin asociar</option>
                {mobilities.map((m) => (
                  <option key={m.id} value={m.id}>{m.partner?.name} — {m.theme}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button
                type="submit"
                disabled={updateMedia.isPending}
                data-testid="button-save-edit-media"
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "#003399" }}
              >
                {updateMedia.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminMedia() {
  const { data: media = [], isLoading } = useGetMedia();
  const { data: mobilities = [] } = useGetMobilities();
  const qc = useQueryClient();
  const deleteMedia = useDeleteMedia({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMediaQueryKey() }) },
  });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [filterMobilityId, setFilterMobilityId] = useState<string>("all");

  const mobilityMap = Object.fromEntries(mobilities.map((m) => [m.id, m]));

  const filteredMedia = filterMobilityId === "all"
    ? media
    : filterMobilityId === "unlinked"
      ? media.filter((m) => m.mobilityId == null)
      : media.filter((m) => m.mobilityId === Number(filterMobilityId));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media</h1>
          <p className="text-slate-500 text-sm mt-0.5">{media.length} archivos en la galería</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          data-testid="button-add-media"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#003399" }}
        >
          <Plus size={16} /> Agregar media
        </button>
      </div>

      <div className="mb-5">
        <select
          value={filterMobilityId}
          onChange={(e) => setFilterMobilityId(e.target.value)}
          data-testid="select-filter-mobility"
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20 bg-white"
        >
          <option value="all">Todas las fotos</option>
          <option value="unlinked">Sin asociar</option>
          {mobilities.map((mob) => (
            <option key={mob.id} value={mob.id}>{mob.workPackage} – {mob.theme}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Image size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{media.length === 0 ? "No hay archivos media aún" : "Ninguna foto coincide con el filtro"}</p>
          {media.length === 0 && <p className="text-xs mt-1">Sube imágenes usando el botón de arriba</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((m) => {
            const linkedMobility = m.mobilityId != null ? mobilityMap[m.mobilityId] : null;
            const isVideo = m.mediaType === "video";
            return (
              <div key={m.id} className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-sm" data-testid={`media-item-${m.id}`}>
                {isVideo ? (
                  <VideoThumbnail url={m.url} caption={m.caption} className="w-full h-full object-cover" />
                ) : (
                  <img src={m.url} alt={m.caption || "Media"} className="w-full h-full object-cover" loading="lazy" />
                )}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" data-testid={`media-item-play-${m.id}`}>
                    <div className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                      <Play size={16} className="translate-x-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setEditItem({ id: m.id, url: m.url, caption: m.caption, mobilityId: m.mobilityId, mediaType: m.mediaType })}
                    data-testid={`button-edit-media-${m.id}`}
                    className="p-2 bg-white text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => { if (confirm("¿Eliminar este archivo?")) deleteMedia.mutate({ id: m.id }); }}
                    data-testid={`button-delete-media-${m.id}`}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute top-2 left-2 flex gap-1" data-testid={`media-mobility-badge-${m.id}`}>
                  {isVideo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 text-white backdrop-blur-sm">
                      <Film size={10} /> Vídeo
                    </span>
                  )}
                  {linkedMobility ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#003399]/90 text-white backdrop-blur-sm truncate max-w-[140px]">
                      {linkedMobility.workPackage} – {linkedMobility.theme}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/60 text-slate-200 backdrop-blur-sm">
                      Sin asociar
                    </span>
                  )}
                </div>
                {m.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs truncate">{m.caption}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && <AddMediaModal onClose={() => setShowModal(false)} />}
      {editItem && <EditMediaModal item={editItem} onClose={() => setEditItem(null)} />}
    </AdminLayout>
  );
}
