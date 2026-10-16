import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";

const schema = z
  .object({
    token: z.string().trim().min(10, "Paste the token from your reset link"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .max(128)
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { token: params.get("token") ?? "", password: "", confirm: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: { token: string; password: string }) => api.post("/auth/password/reset", values),
    onSuccess: () => {
      toast.success("Password updated. Please sign in.");
      navigate("/login", { replace: true });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Unable to reset password"),
  });

  return (
    <AuthLayout title="Choose a new password" subtitle="Reset tokens expire shortly after they are issued.">
      <form
        onSubmit={form.handleSubmit((v) => {
          setError(null);
          mutation.mutate({ token: v.token, password: v.password });
        })}
        className="space-y-4"
        noValidate
      >
        <Field label="Reset token" htmlFor="token" error={form.formState.errors.token?.message}>
          <Input id="token" placeholder="Paste token" {...form.register("token")} />
        </Field>
        <Field label="New password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={form.formState.errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
        </Field>
        {error ? <p className="rounded-md border border-down/30 bg-down-soft/40 px-3 py-2 text-xs text-down">{error}</p> : null}
        <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
          Reset password
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
