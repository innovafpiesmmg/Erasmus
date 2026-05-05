import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Settings } from "lucide-react";
import AdminLayout from "@/components/admin-layout";

const settingsSchema = z.object({
  siteTitle: z.string().min(1, "Título requerido"),
  projectName: z.string().min(1, "Nombre del proyecto requerido"),
  projectDescription: z.string().optional().nullable(),
  heroTitle: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  socialInstagram: z.string().optional().nullable(),
  socialTwitter: z.string().optional().nullable(),
  socialFacebook: z.string().optional().nullable(),
  projectStartYear: z.string().optional().nullable(),
  projectEndYear: z.string().optional().nullable(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSettings();
  const qc = useQueryClient();
  const update = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
    },
  });

  const form = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (settings) {
      form.reset({
        siteTitle: settings.siteTitle || "",
        projectName: settings.projectName || "",
        projectDescription: settings.projectDescription || "",
        heroTitle: settings.heroTitle || "",
        heroSubtitle: settings.heroSubtitle || "",
        email: settings.email || "",
        phone: settings.phone || "",
        address: settings.address || "",
        socialInstagram: settings.socialInstagram || "",
        socialTwitter: settings.socialTwitter || "",
        socialFacebook: settings.socialFacebook || "",
        projectStartYear: settings.projectStartYear || "2025",
        projectEndYear: settings.projectEndYear || "2027",
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsForm) => {
    update.mutate({
      data: {
        siteTitle: data.siteTitle || undefined,
        projectName: data.projectName || undefined,
        projectDescription: data.projectDescription || undefined,
        heroTitle: data.heroTitle || undefined,
        heroSubtitle: data.heroSubtitle || undefined,
        email: data.email || undefined,
        phone: data.phone || null,
        address: data.address || null,
        socialInstagram: data.socialInstagram || null,
        socialTwitter: data.socialTwitter || null,
        socialFacebook: data.socialFacebook || null,
        projectStartYear: data.projectStartYear || undefined,
        projectEndYear: data.projectEndYear || undefined,
      },
    });
  };

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/20";

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-2xl space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-slate-100 animate-pulse" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ajustes del sitio</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configura la información pública del proyecto</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={16} className="text-[#003399]" />
            <h2 className="font-semibold text-slate-900 text-sm">Información general</h2>
          </div>
          <div className="space-y-4">
            <FormField label="Nombre del centro" error={form.formState.errors.siteTitle?.message}>
              <input {...form.register("siteTitle")} data-testid="input-site-title" className={inputClass} />
            </FormField>

            <FormField label="Nombre del proyecto" error={form.formState.errors.projectName?.message}>
              <input {...form.register("projectName")} data-testid="input-project-name" className={inputClass} />
            </FormField>

            <FormField label="Descripción del proyecto">
              <textarea {...form.register("projectDescription")} rows={3} data-testid="input-project-description" className={`${inputClass} resize-none`} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Año de inicio" error={form.formState.errors.projectStartYear?.message}>
                <input {...form.register("projectStartYear")} data-testid="input-start-year" className={inputClass} placeholder="2025" maxLength={4} />
              </FormField>
              <FormField label="Año de fin" error={form.formState.errors.projectEndYear?.message}>
                <input {...form.register("projectEndYear")} data-testid="input-end-year" className={inputClass} placeholder="2027" maxLength={4} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-5">Página de inicio (Hero)</h2>
          <div className="space-y-4">
            <FormField label="Título principal">
              <input {...form.register("heroTitle")} data-testid="input-hero-title" className={inputClass} placeholder="Pequeños cambios, grandes transformaciones" />
            </FormField>

            <FormField label="Subtítulo">
              <input {...form.register("heroSubtitle")} data-testid="input-hero-subtitle" className={inputClass} />
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-5">Contacto</h2>
          <div className="space-y-4">
            <FormField label="Email" error={form.formState.errors.email?.message}>
              <input {...form.register("email")} type="email" data-testid="input-email" className={inputClass} />
            </FormField>

            <FormField label="Teléfono">
              <input {...form.register("phone")} data-testid="input-phone" className={inputClass} />
            </FormField>

            <FormField label="Dirección">
              <input {...form.register("address")} data-testid="input-address" className={inputClass} />
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-5">Redes sociales</h2>
          <div className="space-y-4">
            <FormField label="Instagram">
              <input {...form.register("socialInstagram")} data-testid="input-instagram" className={inputClass} placeholder="@usuario" />
            </FormField>

            <FormField label="Twitter / X">
              <input {...form.register("socialTwitter")} data-testid="input-twitter" className={inputClass} placeholder="@usuario" />
            </FormField>

            <FormField label="Facebook">
              <input {...form.register("socialFacebook")} data-testid="input-facebook" className={inputClass} />
            </FormField>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={update.isPending}
            data-testid="button-save-settings"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity"
            style={{ background: "#003399" }}
          >
            <Save size={16} />
            {update.isPending ? "Guardando..." : "Guardar ajustes"}
          </button>

          {update.isSuccess && !update.isPending && (
            <span className="text-sm text-[#2D5A27] font-medium">Ajustes guardados correctamente</span>
          )}
          {update.isError && (
            <span className="text-sm text-red-500">Error al guardar los ajustes</span>
          )}
        </div>
      </form>
    </AdminLayout>
  );
}
