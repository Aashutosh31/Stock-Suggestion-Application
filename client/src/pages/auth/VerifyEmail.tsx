import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"pending" | "ok" | "error">("pending");
  const [message, setMessage] = useState<string>("");
  const attempted = useRef(false);

  const mutation = useMutation({
    mutationFn: (value: string) => api.post("/auth/verify-email", { token: value }),
    onSuccess: () => setState("ok"),
    onError: (err) => {
      setState("error");
      setMessage(err instanceof ApiError ? err.message : "Verification failed");
    },
  });

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    mutation.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthLayout title="Email verification" subtitle="Confirming your email address.">
      {!token ? (
        <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          No verification token was provided. Open the link from your verification email.
        </div>
      ) : state === "pending" ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          Verifying your email…
        </div>
      ) : state === "ok" ? (
        <div className="flex items-start gap-3 rounded-lg border border-up/30 bg-up-soft/40 p-4">
          <CheckCircle2 className="mt-0.5 size-5 text-up" />
          <div className="text-sm text-muted">
            <p className="font-medium text-ink">Email verified</p>
            <p>Your address has been confirmed. You can now sign in.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-down/30 bg-down-soft/40 p-4">
          <XCircle className="mt-0.5 size-5 text-down" />
          <div className="text-sm text-muted">
            <p className="font-medium text-ink">Verification failed</p>
            <p>{message}</p>
          </div>
        </div>
      )}

      <Button asChild variant="outline" className="mt-5 w-full">
        <Link to="/login">Go to sign in</Link>
      </Button>
    </AuthLayout>
  );
}
