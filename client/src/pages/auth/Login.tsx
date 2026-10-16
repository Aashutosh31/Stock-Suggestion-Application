import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/primitives";
import { useDemoLogin, useLogin } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const demo = useDemoLogin();
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => {
        toast.success("Welcome back");
        navigate(from, { replace: true });
      },
      onError: (err) => setFormError(err instanceof ApiError ? err.message : "Unable to sign in"),
    });
  });

  return (
    <AuthLayout title="Sign in" subtitle="Access your research terminal, watchlists and portfolio.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...form.register("password")} />
        </Field>

        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-xs text-brand hover:underline">
            Forgot password?
          </Link>
        </div>

        {formError ? (
          <p className="rounded-md border border-down/30 bg-down-soft/40 px-3 py-2 text-xs text-down">{formError}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] uppercase tracking-wide text-subtle">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        loading={demo.isPending}
        onClick={() =>
          demo.mutate(undefined, {
            onSuccess: () => {
              toast.success("Signed in to the demo workspace");
              navigate("/", { replace: true });
            },
            onError: (err) => toast.error(err instanceof ApiError ? err.message : "Demo login failed"),
          })
        }
      >
        <FlaskConical /> Continue with demo account
      </Button>
      <p className="mt-2 text-center text-xs text-subtle">
        The demo account uses seeded sample data and clearly labelled simulated prices.
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link to="/register" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
