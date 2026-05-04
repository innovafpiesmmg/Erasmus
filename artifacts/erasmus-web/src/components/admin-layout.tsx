import { useGetAdminMe, useAdminLogout, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation, Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Users, Calendar, BookOpen, Image, Settings, LogOut, Globe, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/socios", label: "Socios", icon: Users },
  { href: "/admin/movilidades", label: "Movilidades", icon: Calendar },
  { href: "/admin/actividades", label: "Actividades", icon: BookOpen },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading, isError } = useGetAdminMe({ query: { retry: false, queryKey: getGetAdminMeQueryKey() } });
  const queryClient = useQueryClient();
  const logout = useAdminLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminMeQueryKey() });
      },
    },
  });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Verificando sesión...</div>
      </div>
    );
  }

  if (isError || !me?.authenticated) {
    return <Redirect to="/admin/login" />;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#003399" }}>
            <Globe size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs leading-tight">IES MMG</div>
            <div className="text-xs text-slate-400">Erasmus+ SEA</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? location === item.href : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-[#003399] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#003399] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{me.username.charAt(0).toUpperCase()}</span>
          </div>
          <span className="text-xs text-slate-600 font-medium truncate">{me.username}</span>
        </div>
        <button
          onClick={() => logout.mutate()}
          data-testid="button-logout"
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-100 fixed top-0 left-0 bottom-0 z-30">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-100 h-14 flex items-center px-6 gap-4 sticky top-0 z-20">
          <button
            className="md:hidden text-slate-600"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-menu"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-semibold text-slate-700">
            {NAV_ITEMS.find((n) => (n.exact ? location === n.href : location.startsWith(n.href)))?.label || "Admin"}
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
