import { useEffect, useState, useRef, useCallback } from "react";
import { useRenewAdminSession, getGetAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

const WARN_BEFORE_MS = 5 * 60 * 1000;
const TICK_INTERVAL_MS = 10_000;

interface SessionExpiryWarningProps {
  expiresAt: string | null | undefined;
}

export default function SessionExpiryWarning({ expiresAt }: SessionExpiryWarningProps) {
  const queryClient = useQueryClient();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const prevExpiresAt = useRef<string | null | undefined>(null);

  const renew = useRenewAdminSession({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetAdminMeQueryKey(), data);
        setDismissed(false);
      },
    },
  });

  const computeSecondsLeft = useCallback((expiry: string | null | undefined) => {
    if (!expiry) return null;
    const ms = new Date(expiry).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  }, []);

  useEffect(() => {
    if (expiresAt !== prevExpiresAt.current) {
      prevExpiresAt.current = expiresAt;
      setDismissed(false);
    }

    const update = () => setSecondsLeft(computeSecondsLeft(expiresAt));
    update();
    const id = setInterval(update, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [expiresAt, computeSecondsLeft]);

  const warnThresholdSeconds = WARN_BEFORE_MS / 1000;
  const show = !dismissed && secondsLeft !== null && secondsLeft <= warnThresholdSeconds && secondsLeft > 0;

  if (!show) return null;

  const minutes = Math.ceil(secondsLeft / 60);

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg">
        <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Tu sesión expira pronto
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {minutes === 1
              ? "Queda menos de 1 minuto. Guarda tu trabajo antes de que se cierre la sesión."
              : `Quedan aproximadamente ${minutes} minutos de sesión.`}
          </p>
          <button
            onClick={() => renew.mutate()}
            disabled={renew.isPending}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={12} className={renew.isPending ? "animate-spin" : ""} />
            Renovar sesión
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Descartar aviso"
          className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
