import { useAdminLogin, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock, User, Globe } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Introduce el nombre de usuario"),
  password: z.string().min(1, "Introduce la contraseña"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const login = useAdminLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminMeQueryKey() });
        setLocation("/admin");
      },
      onError: () => {
        setError("Usuario o contraseña incorrectos");
      },
    },
  });

  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginForm) => {
    setError(null);
    login.mutate({ data });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #001a6e 0%, #003399 50%, #2D5A27 100%)" }}>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Globe size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">IES Manuel Martín González</div>
              <div className="text-white/60 text-xs">Erasmus+ SEA · Panel de Administración</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-1">Acceso al panel</h1>
            <p className="text-white/60 text-sm mb-8">Introduce tus credenciales para continuar</p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Usuario</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    {...form.register("username")}
                    type="text"
                    placeholder="admin"
                    autoComplete="username"
                    data-testid="input-username"
                    className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-sm"
                  />
                </div>
                {form.formState.errors.username && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    {...form.register("password")}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    data-testid="input-password"
                    className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-sm"
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-4 py-3 text-red-200 text-sm" data-testid="login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={login.isPending}
                data-testid="button-submit"
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all bg-white text-[#003399] hover:bg-white/90 disabled:opacity-60"
              >
                {login.isPending ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            Panel exclusivo para administradores del centro
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-sm text-white">
          <div className="text-5xl font-bold mb-4 leading-tight">Gestiona tu proyecto Erasmus+</div>
          <p className="text-white/60 text-lg">Administra socios, movilidades, actividades y contenidos desde un solo lugar.</p>
        </div>
      </div>
    </div>
  );
}
