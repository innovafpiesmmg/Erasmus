import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { UserPlus, Trash2, KeyRound, Shield, ShieldOff, Loader2, X, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Partner } from "@workspace/api-client-react";

interface AdminUser {
  id: number;
  username: string;
  isSuperAdmin: boolean;
  partnerId: number | null;
  createdAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${BASE}/api/admin/users`, { credentials: "include" });
  if (!res.ok) throw new Error("Error al cargar administradores");
  return res.json() as Promise<AdminUser[]>;
}

async function fetchPartners(): Promise<Partner[]> {
  const res = await fetch(`${BASE}/api/partners`, { credentials: "include" });
  if (!res.ok) return [];
  return res.json() as Promise<Partner[]>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder, error }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors ${error ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-[#003399]"}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPartnerId, setNewPartnerId] = useState<string>("");
  const [newErrors, setNewErrors] = useState<{ username?: string; password?: string }>({});

  const [changePassword, setChangePassword] = useState("");
  const [changeError, setChangeError] = useState("");

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: fetchUsers,
  });

  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
    queryFn: fetchPartners,
  });

  const partnerMap = Object.fromEntries(partners.map((p) => [p.id, p]));

  const createMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; partnerId: number | null }) => {
      const res = await fetch(`${BASE}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al crear administrador");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowCreate(false);
      setNewUsername("");
      setNewPassword("");
      setNewPartnerId("");
      toast({ title: "Administrador creado", description: `El usuario "${newUsername}" ha sido creado correctamente.` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al cambiar contraseña");
    },
    onSuccess: () => {
      setPasswordTarget(null);
      setChangePassword("");
      toast({ title: "Contraseña actualizada", description: "La contraseña se ha cambiado correctamente." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al eliminar administrador");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteTarget(null);
      toast({ title: "Administrador eliminado" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleCreate() {
    const errors: { username?: string; password?: string } = {};
    if (newUsername.trim().length < 3) errors.username = "Mínimo 3 caracteres";
    if (newPassword.length < 6) errors.password = "Mínimo 6 caracteres";
    setNewErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const partnerId = newPartnerId ? Number(newPartnerId) : null;
    createMutation.mutate({ username: newUsername.trim(), password: newPassword, partnerId });
  }

  function handleChangePassword() {
    if (changePassword.length < 6) {
      setChangeError("Mínimo 6 caracteres");
      return;
    }
    setChangeError("");
    passwordMutation.mutate({ id: passwordTarget!.id, password: changePassword });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Administradores</h1>
            <p className="text-sm text-slate-500 mt-1">Gestiona quién tiene acceso al panel de administración</p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setNewUsername(""); setNewPassword(""); setNewPartnerId(""); setNewErrors({}); }}
            className="flex items-center gap-2 bg-[#003399] hover:bg-[#002277] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={16} />
            Nuevo administrador
          </button>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No hay administradores</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Usuario</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Acceso</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Centro asignado</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Creado</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => {
                  const assignedPartner = user.partnerId ? partnerMap[user.partnerId] : null;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#003399]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#003399] text-sm font-bold">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-medium text-slate-900 text-sm">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        {user.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                            <Shield size={11} />
                            Superadmin
                          </span>
                        ) : user.partnerId != null ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                            <Building2 size={11} />
                            Socio
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            <ShieldOff size={11} />
                            Administrador
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {assignedPartner ? (
                          <span className="text-sm text-slate-700">{assignedPartner.name} <span className="text-slate-400">({assignedPartner.country})</span></span>
                        ) : (
                          <span className="text-sm text-slate-400">— Acceso global —</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-sm text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => { setPasswordTarget(user); setChangePassword(""); setChangeError(""); }}
                            title="Cambiar contraseña"
                            className="p-2 text-slate-400 hover:text-[#003399] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <KeyRound size={16} />
                          </button>
                          {!user.isSuperAdmin && (
                            <button
                              onClick={() => setDeleteTarget(user)}
                              title="Eliminar"
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <Shield size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Tipos de acceso</p>
              <ul className="mt-1 space-y-1 text-amber-700 text-xs">
                <li><strong>Superadmin</strong>: acceso total, no se puede eliminar.</li>
                <li><strong>Administrador</strong>: acceso total al panel sin restricciones.</li>
                <li><strong>Socio</strong>: solo puede editar su propio centro, sus movilidades y actividades.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <Modal title="Nuevo administrador" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <InputField
              label="Nombre de usuario"
              value={newUsername}
              onChange={setNewUsername}
              placeholder="nombre.usuario"
              error={newErrors.username}
            />
            <InputField
              label="Contraseña"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              error={newErrors.password}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Centro asignado</label>
              <select
                value={newPartnerId}
                onChange={(e) => setNewPartnerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#003399] bg-white"
              >
                <option value="">— Acceso global (sin restricción) —</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.country})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400">
                Si asignas un centro, el admin solo podrá editar ese socio y sus actividades.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 bg-[#003399] hover:bg-[#002277] text-white text-sm rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Crear administrador
              </button>
            </div>
          </div>
        </Modal>
      )}

      {passwordTarget && (
        <Modal title={`Cambiar contraseña — ${passwordTarget.username}`} onClose={() => setPasswordTarget(null)}>
          <div className="space-y-4">
            <InputField
              label="Nueva contraseña"
              type="password"
              value={changePassword}
              onChange={setChangePassword}
              placeholder="Mínimo 6 caracteres"
              error={changeError}
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPasswordTarget(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordMutation.isPending}
                className="flex-1 px-4 py-2 bg-[#003399] hover:bg-[#002277] text-white text-sm rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {passwordMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Guardar contraseña
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Eliminar administrador" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Seguro que quieres eliminar al administrador <span className="font-semibold text-slate-900">{deleteTarget.username}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
