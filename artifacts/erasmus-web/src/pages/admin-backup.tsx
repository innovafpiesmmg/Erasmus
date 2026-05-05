import { useState, useRef } from "react";
import AdminLayout from "@/components/admin-layout";
import { Download, Upload, AlertTriangle, CheckCircle, Loader2, FileArchive, RotateCcw, ShieldAlert } from "lucide-react";

export default function AdminBackup() {
  const [downloading, setDownloading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/backup", { credentials: "include" });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup-${date}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("No se pudo descargar la copia de seguridad.");
    } finally {
      setDownloading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    setRestoreResult(null);
    try {
      const formData = new FormData();
      formData.append("backup", restoreFile);
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = await res.json() as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error desconocido");
      setRestoreResult({ ok: true, message: json.message ?? "Restaurado correctamente" });
      setRestoreFile(null);
    } catch (e) {
      setRestoreResult({ ok: false, message: (e as Error).message });
    } finally {
      setRestoring(false);
      setConfirmOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Copia de seguridad</h1>
          <p className="text-slate-500 text-sm mt-1">
            Descarga todos los datos de la plataforma en un archivo ZIP. Puedes restaurarlos en cualquier momento.
          </p>
        </div>

        {/* Download */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#003399]/10 flex items-center justify-center flex-shrink-0">
              <FileArchive size={22} className="text-[#003399]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900 text-base">Descargar copia de seguridad</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Genera un ZIP con todos los datos de la base de datos (socios, movilidades, actividades, galería, ajustes) y los archivos multimedia subidos.
              </p>
              <button
                onClick={handleDownload}
                disabled={downloading}
                data-testid="button-download-backup"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#003399] text-white rounded-xl text-sm font-medium hover:bg-[#002277] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <><Loader2 size={16} className="animate-spin" /> Generando...</>
                ) : (
                  <><Download size={16} /> Descargar backup</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Restore */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <RotateCcw size={22} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-base">Restaurar copia de seguridad</h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Selecciona un archivo ZIP generado por esta plataforma. <strong className="text-slate-700">Todos los datos actuales serán reemplazados.</strong>
              </p>
            </div>
          </div>

          <div
            onClick={() => !restoring && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f?.name.endsWith(".zip")) setRestoreFile(f);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-amber-400 bg-amber-50" : restoreFile ? "border-green-300 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}
          >
            {restoreFile ? (
              <div className="flex flex-col items-center gap-1.5">
                <FileArchive size={28} className="text-green-600" />
                <p className="text-sm font-medium text-green-700">{restoreFile.name}</p>
                <p className="text-xs text-slate-400">{(restoreFile.size / 1024 / 1024).toFixed(2)} MB · Haz clic para cambiar</p>
              </div>
            ) : (
              <div>
                <Upload size={26} className="mx-auto mb-1.5 text-slate-300" />
                <p className="text-sm text-slate-500">Arrastra o <span className="text-[#003399] font-medium">selecciona</span> un archivo .zip</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setRestoreFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {restoreFile && (
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Esta acción <strong>borrará y reemplazará</strong> todos los datos actuales con los del archivo seleccionado. Esta operación no se puede deshacer.
              </p>
            </div>
          )}

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!restoreFile || restoring}
            data-testid="button-restore-backup"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {restoring ? (
              <><Loader2 size={16} className="animate-spin" /> Restaurando...</>
            ) : (
              <><RotateCcw size={16} /> Restaurar datos</>
            )}
          </button>

          {restoreResult && (
            <div className={`mt-4 p-3.5 rounded-xl flex items-start gap-3 border ${restoreResult.ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              {restoreResult.ok
                ? <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                : <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              }
              <p className={`text-sm ${restoreResult.ok ? "text-green-800" : "text-red-700"}`}>{restoreResult.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">¿Confirmar restauración?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Se borrarán <strong>todos los datos actuales</strong> (socios, movilidades, actividades, galería, ajustes y archivos) y se reemplazarán por los del archivo <strong>{restoreFile?.name}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {restoring ? "Restaurando..." : "Sí, restaurar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
