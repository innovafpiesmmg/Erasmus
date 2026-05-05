import { useGetPartners, useCreatePartner, useUpdatePartner, useDeletePartner, getGetPartnersQueryKey } from "@workspace/api-client-react";
import type { Partner } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, MapPin, Globe, X, ImageOff, Instagram, Twitter, Upload, Link as LinkIcon2 } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const COUNTRY_FLAGS: Record<string, string> = {
  España: "🇪🇸", Turquía: "🇹🇷", Letonia: "🇱🇻",
  Rumanía: "🇷🇴", Portugal: "🇵🇹", Macedonia: "🇲🇰",
};

const partnerSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  oid: z.string().optional().nullable(),
  country: z.string().min(1, "País requerido"),
  city: z.string().min(1, "Ciudad requerida"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  webUrl: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  logoUrl: z.string().url("URL inválida").optional().nullable().or(z.literal("")).or(z.string().startsWith("/uploads/")),
  photoUrl: z.string().url("URL inválida").optional().nullable().or(z.literal("")).or(z.string().startsWith("/uploads/")),
  socialInstagram: z.string().optional().nullable(),
  socialTwitter: z.string().optional().nullable(),
  isCoordinator: z.boolean().default(false),
});
type PartnerForm = z.infer<typeof partnerSchema>;

function LogoPreview({ control }: { control: import("react-hook-form").Control<PartnerForm> }) {
  const logoUrl = useWatch({ control, name: "logoUrl" });
  if (!logoUrl) return null;
  return (
    <div className="mt-2 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
      <img
        src={logoUrl}
        alt="Logo preview"
        className="w-14 h-14 object-contain rounded border border-slate-200 bg-white p-1"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        data-testid="logo-preview"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 truncate">{logoUrl}</p>
        <p className="text-xs text-[#003399] mt-0.5 flex items-center gap-1"><ImageOff size={10} /> Vista previa del logo</p>
      </div>
    </div>
  );
}

function PartnerModal({ partner, onClose }: { partner?: Partner; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useCreatePartner({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetPartnersQueryKey() }); onClose(); } } });
  const update = useUpdatePartner({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetPartnersQueryKey() }); onClose(); } } });

  const form = useForm<PartnerForm>({
    resolver: zodResolver(partnerSchema),
    defaultValues: partner ? { ...partner } : { isCoordinator: false },
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploadError(null);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al subir el archivo");
      }
      const data = await res.json();
      form.setValue("logoUrl", data.url, { shouldValidate: true, shouldDirty: true });
    } catch (err: unknown) {
      setLogoUploadError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setLogoUploading(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    }
  };

  const [photoTab, setPhotoTab] = useState<"upload" | "url">("upload");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const photoUrlValue = useWatch({ control: form.control, name: "photoUrl" });

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    setPhotoUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Error al subir");
      }
      const { url } = await res.json() as { url: string };
      form.setValue("photoUrl", url, { shouldValidate: true });
      setSelectedPhotoFile(file);
    } catch (e) {
      setPhotoUploadError((e as Error).message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const onSubmit = (data: PartnerForm) => {
    const payload = {
      ...data,
      webUrl: data.webUrl || null,
      logoUrl: data.logoUrl || null,
      photoUrl: data.photoUrl || null,
      oid: data.oid || null,
      socialInstagram: data.socialInstagram || null,
      socialTwitter: data.socialTwitter || null,
    };
    if (partner) {
      update.mutate({ id: partner.id, data: payload });
    } else {
      create.mutate({ data: payload });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{partner ? "Editar socio" : "Nuevo socio"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Nombre del centro *</label>
              <input {...form.register("name")} data-testid="input-partner-name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.name && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">País *</label>
              <input {...form.register("country")} data-testid="input-partner-country" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.country && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.country.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ciudad *</label>
              <input {...form.register("city")} data-testid="input-partner-city" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.city && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Latitud *</label>
              <input {...form.register("lat")} type="number" step="any" data-testid="input-partner-lat" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.lat && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.lat.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Longitud *</label>
              <input {...form.register("lng")} type="number" step="any" data-testid="input-partner-lng" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.lng && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.lng.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">OID</label>
              <input {...form.register("oid")} data-testid="input-partner-oid" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Web URL</label>
              <input {...form.register("webUrl")} type="url" data-testid="input-partner-web" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
              {form.formState.errors.webUrl && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.webUrl.message}</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo</label>
              <div className="flex gap-2">
                <input {...form.register("logoUrl")} type="text" data-testid="input-partner-logo" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" placeholder="https://..." />
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  disabled={logoUploading}
                  data-testid="button-upload-logo"
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
                >
                  <Upload size={14} />
                  {logoUploading ? "Subiendo..." : "Subir archivo"}
                </button>
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  data-testid="input-logo-file"
                  onChange={handleLogoFileChange}
                />
              </div>
              {form.formState.errors.logoUrl && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.logoUrl.message}</p>}
              {logoUploadError && <p className="text-red-500 text-xs mt-0.5">{logoUploadError}</p>}
              <LogoPreview control={form.control} />
            </div>

            {/* ── Foto del país ── */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-2">Foto del país / centro</label>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-3">
                <button type="button" onClick={() => setPhotoTab("upload")} className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${photoTab === "upload" ? "bg-[#003399] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                  <Upload size={13} /> Subir archivo
                </button>
                <button type="button" onClick={() => setPhotoTab("url")} className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${photoTab === "url" ? "bg-[#003399] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
                  <LinkIcon2 size={13} /> Por URL
                </button>
              </div>

              {photoTab === "upload" ? (
                <div>
                  <div
                    onClick={() => !photoUploading && photoFileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
                    onDragLeave={() => setPhotoDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setPhotoDragOver(false); const f = e.dataTransfer.files[0]; if (f) handlePhotoUpload(f); }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${photoDragOver ? "border-[#003399] bg-blue-50" : photoUploading ? "border-slate-200 bg-slate-50 cursor-wait" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    {photoUploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="w-7 h-7 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-slate-500">Subiendo...</p>
                      </div>
                    ) : photoUrlValue && selectedPhotoFile ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <img src={photoUrlValue} alt="" className="h-16 w-full rounded-lg object-cover" />
                        <p className="text-xs text-green-600 font-medium">✓ Subida correctamente</p>
                      </div>
                    ) : partner?.photoUrl && !selectedPhotoFile ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <img src={partner.photoUrl} alt="" className="h-16 w-full rounded-lg object-cover" />
                        <p className="text-xs text-slate-400">Haz clic para cambiar la foto</p>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} className="mx-auto mb-1.5 text-slate-300" />
                        <p className="text-sm text-slate-500">Arrastra o <span className="text-[#003399] font-medium">selecciona</span></p>
                        <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP · Máx. 20 MB</p>
                      </div>
                    )}
                    <input ref={photoFileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                  </div>
                  {photoUploadError && <p className="text-red-500 text-xs mt-1">{photoUploadError}</p>}
                </div>
              ) : (
                <div>
                  <input {...form.register("photoUrl")} type="url" placeholder="https://..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
                  {form.formState.errors.photoUrl && <p className="text-red-500 text-xs mt-0.5">{form.formState.errors.photoUrl.message}</p>}
                  {photoUrlValue && !form.formState.errors.photoUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50" style={{ height: 100 }}>
                      <img src={photoUrlValue} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><Instagram size={12} /> Instagram</label>
              <input {...form.register("socialInstagram")} data-testid="input-partner-instagram" placeholder="@cuenta" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1"><Twitter size={12} /> Twitter / X</label>
              <input {...form.register("socialTwitter")} data-testid="input-partner-twitter" placeholder="@cuenta" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20" />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input {...form.register("isCoordinator")} type="checkbox" id="isCoordinator" data-testid="input-partner-coordinator" className="rounded" />
              <label htmlFor="isCoordinator" className="text-sm text-slate-700">Este centro es el coordinador del proyecto</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              data-testid="button-save-partner"
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

export default function AdminPartners() {
  const { data: partners = [], isLoading } = useGetPartners();
  const qc = useQueryClient();
  const deletePartner = useDeletePartner({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetPartnersQueryKey() }) } });
  const [modal, setModal] = useState<"create" | number | null>(null);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Socios</h1>
          <p className="text-slate-500 text-sm mt-0.5">{partners.length} centros asociados</p>
        </div>
        <button
          onClick={() => setModal("create")}
          data-testid="button-create-partner"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#003399" }}
        >
          <Plus size={16} /> Nuevo socio
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Centro</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 hidden md:table-cell">País</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 hidden lg:table-cell">Coordenadas</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3 hidden md:table-cell">Tipo</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50" data-testid={`partner-row-${p.id}`}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.city}</div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <span>{COUNTRY_FLAGS[p.country] || "🌍"}</span>
                      {p.country}
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={12} /> {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {p.isCoordinator ? (
                      <span className="text-xs bg-[#003399]/10 text-[#003399] px-2 py-0.5 rounded-full">Coordinador</span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Socio</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setModal(p.id)} data-testid={`button-edit-partner-${p.id}`} className="p-1.5 text-slate-400 hover:text-[#003399] rounded-lg hover:bg-[#003399]/10 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => { if (confirm("¿Eliminar este socio?")) deletePartner.mutate({ id: p.id }); }} data-testid={`button-delete-partner-${p.id}`} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {partners.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Globe size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay socios aún</p>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <PartnerModal
          partner={typeof modal === "number" ? partners.find((p) => p.id === modal) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </AdminLayout>
  );
}
