import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPartners from "@/pages/admin-partners";
import AdminMobilities from "@/pages/admin-mobilities";
import AdminActivities from "@/pages/admin-activities";
import AdminMedia from "@/pages/admin-media";
import AdminSettings from "@/pages/admin-settings";
import AdminBackup from "@/pages/admin-backup";
import AdminUsers from "@/pages/admin-users";
import ActivityDetail from "@/pages/activity-detail";
import MobilityDetail from "@/pages/mobility-detail";
import Gallery from "@/pages/gallery";
import Partners from "@/pages/partners";
import { setUnauthorizedHandler } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

setUnauthorizedHandler(() => {
  const loginPath = `${BASE}/admin/login`;
  const currentPath = window.location.pathname;
  const isAdminPage =
    currentPath.startsWith(`${BASE}/admin`) && !currentPath.startsWith(loginPath);
  if (isAdminPage) {
    window.location.href = `${loginPath}?reason=session_expired`;
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/actividades/:id" component={ActivityDetail} />
      <Route path="/movilidades/:id" component={MobilityDetail} />
      <Route path="/socios" component={Partners} />
      <Route path="/galeria" component={Gallery} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/socios" component={AdminPartners} />
      <Route path="/admin/movilidades" component={AdminMobilities} />
      <Route path="/admin/actividades" component={AdminActivities} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route path="/admin/ajustes" component={AdminSettings} />
      <Route path="/admin/backup" component={AdminBackup} />
      <Route path="/admin/usuarios" component={AdminUsers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
