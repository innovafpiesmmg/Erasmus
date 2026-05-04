import { useGetMedia, useCreateMedia, useDeleteMedia, useGetMobilities, getGetMediaQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Image, X, Upload, Link } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const urlSchema = z.object({
  url: z.string().url("URL de imagen inválida"),
  caption: z.string().optional().nullable(),
  mediaType: z.enum(["image", "video"]).default("image"),
  mobilityId: z.coerce.number().optional().nullable(),
});
type UrlForm = z.infer<typeof urlSchema>;

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

  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadMobilityId, setUploadMobilityId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UrlForm>({
    resolver: zodResolver(urlSchema),
    defaultValues: { mediaType: "image" },
  });

  const onUrlSubmit = (data: UrlForm) => {
    create.mutate({ data: { ...data, caption: data.caption || null, mobilityId: data.mobilityId || null } });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (uploadCaption) formData.append("caption", uploadCaption);
      if (uploadMobilityId) formData.append("mobilityId", uploadMobilityId);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error || "Error al subir el archivo");
      }
      qc.invalidateQueries({ queryKey: getGetMediaQueryKey() });
      onClose();
    } catch (err: any) {
      setUploadError(err.message ?? "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
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
                  <p className="text-xs text-slate-400 mt-1">Imágenes o vídeos · Máx. 20 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/ogg"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
              <input
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Movilidad asociada</label>
              <select
                value={uploadMobilityId}
                onChange={(e) => setUploadMobilityId(e.target.value)}
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
                disabled={!selectedFile || uploading}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "#003399" }}
              >
                {uploading ? "Subiendo..." : "Subir"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onUrlSubmit)} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">URL de la imagen/vídeo *</label>
              <input
                {...form.register("url")}
                type="url"
                data-testid="input-media-url"
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
              />
              {form.formState.errors.url && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.url.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
              <select
                {...form.register("mediaType")}
                data-testid="select-media-type"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20"
              >
                <option value="image">Imagen</option>
                <option value="video">Vídeo</option>
              </select>
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

export default function AdminMedia() {
  const { data: media = [], isLoading } = useGetMedia();
  const qc = useQueryClient();
  const deleteMedia = useDeleteMedia({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetMediaQueryKey() }) },
  });
  const [showModal, setShowModal] = useState(false);

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

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Image size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay archivos media aún</p>
          <p className="text-xs mt-1">Sube imágenes o vídeos usando el botón de arriba</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((m) => (
            <div key={m.id} className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden shadow-sm" data-testid={`media-item-${m.id}`}>
              {m.mediaType === "video" ? (
                <video src={m.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={m.url} alt={m.caption || "Media"} className="w-full h-full object-cover" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => { if (confirm("¿Eliminar este archivo?")) deleteMedia.mutate({ id: m.id }); }}
                  data-testid={`button-delete-media-${m.id}`}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {m.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{m.caption}</p>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className="text-xs bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-slate-700 font-medium">
                  {m.mediaType === "video" ? "VID" : "IMG"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddMediaModal onClose={() => setShowModal(false)} />}
    </AdminLayout>
  );
}
