import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
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

export default function Register() {
  const navigate = useNavigate();
  const register = useRegister();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "", confirm: "" } });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    register.mutate(
      { name: values.name, email: values.email, password: values.password },
      {
        onSuccess: () => {
          toast.success("Account created");
          navigate("/", { replace: true });
        },
        onError: (err) => setFormError(err instanceof ApiError ? err.message : "Unable to create account"),
      },
    );
  });

  return (
    <AuthLayout title="Create your account" subtitle="Start researching Indian equities in minutes.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={form.formState.errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Ada Lovelace" {...form.register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint="At least 8 characters, with a letter and a number."
          error={form.formState.errors.password?.message}
        >
          <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...form.register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={form.formState.errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" {...form.register("confirm")} />
        </Field>

        {formError ? (
          <p className="rounded-md border border-down/30 bg-down-soft/40 px-3 py-2 text-xs text-down">{formError}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={register.isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
