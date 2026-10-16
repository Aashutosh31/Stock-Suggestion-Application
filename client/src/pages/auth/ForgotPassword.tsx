import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";

const schema = z.object({ email: z.string().trim().min(1, "Email is required").email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const mutation = useMutation({
    mutationFn: (email: string) => api.post<{ requested: boolean }>("/auth/password/forgot", { email }),
    onSuccess: () => setSent(true),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Unable to submit request"),
  });

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle="If an account exists, a reset link is on its way.">
        <div className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
          <CheckCircle2 className="mt-0.5 size-5 text-up" />
          <div className="text-sm text-muted">
            <p className="font-medium text-ink">Request received</p>
            <p>
              For security we do not reveal whether an email is registered. If it is, you will receive a reset link
              shortly. In local development the email may be logged to the server console.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a secure reset link.">
      <form
        onSubmit={form.handleSubmit((v) => {
          setError(null);
          mutation.mutate(v.email);
        })}
        className="space-y-4"
        noValidate
      >
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
        </Field>
        {error ? <p className="rounded-md border border-down/30 bg-down-soft/40 px-3 py-2 text-xs text-down">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
