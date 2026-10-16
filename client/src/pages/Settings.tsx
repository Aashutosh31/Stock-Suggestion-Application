import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, KeyRound, Monitor, Moon, Palette, ShieldAlert, Sun, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { exportUserData, useChangePassword, useDeleteAccount, useUpdatePreferences, useUpdateProfile } from "@/hooks/queries";
import type { ThemeChoice } from "@/stores/uiStore";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function Settings() {
  const user = useCurrentUser();

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance, security and data."
        actions={user?.role === "admin" ? <Badge variant="brand">Administrator</Badge> : undefined}
      />

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">
            <UserCog className="mr-1 size-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-1 size-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="mr-1 size-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="data">Data & account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="data">
          <DataTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileTab() {
  const user = useCurrentUser();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? "");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Display name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email" hint="Email changes require re-verification and are disabled in this build.">
          <Input value={user?.email ?? ""} disabled />
        </Field>
        <div className="flex items-center gap-2">
          <Button
            disabled={!name.trim() || name === user?.name}
            loading={update.isPending}
            onClick={() =>
              update.mutate(name.trim(), {
                onSuccess: () => toast.success("Profile updated"),
                onError: () => toast.error("Could not update profile"),
              })
            }
          >
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const prefs = useUpdatePreferences();
  const options: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs text-muted">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  prefs.mutate({ theme: opt.value });
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-xs transition-colors",
                  theme === opt.value ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-line-strong",
                )}
              >
                <opt.icon className="size-5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-subtle">Colour preference is stored on your account and applied across devices.</p>
      </CardContent>
    </Card>
  );
}

function NotificationsTab() {
  const user = useCurrentUser();
  const prefs = useUpdatePreferences();
  const [inApp, setInApp] = useState(user?.preferences.notifications.inApp ?? true);
  const [email, setEmail] = useState(user?.preferences.notifications.email ?? false);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-4 py-3">
          <div>
            <p className="text-sm text-ink">In-app notifications</p>
            <p className="text-xs text-muted">Show alert triggers in the notification centre.</p>
          </div>
          <Switch checked={inApp} onCheckedChange={(v) => { setInApp(v); prefs.mutate({ notifications: { inApp: v } }); }} />
        </label>
        <label className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-4 py-3">
          <div>
            <p className="text-sm text-ink">Email notifications</p>
            <p className="text-xs text-muted">Requires SMTP configuration on the server.</p>
          </div>
          <Switch checked={email} onCheckedChange={(v) => { setEmail(v); prefs.mutate({ notifications: { email: v } }); }} />
        </label>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const change = useChangePassword();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Current password">
          <Input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password" hint="At least 8 characters, with a letter and a number.">
          <Input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password" error={confirm && confirm !== newPassword ? "Passwords do not match" : null}>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        {error ? <p className="rounded-md border border-down/30 bg-down-soft/40 px-3 py-2 text-xs text-down">{error}</p> : null}
        <Button
          disabled={!currentPassword || !newPassword || newPassword !== confirm}
          loading={change.isPending}
          onClick={() => {
            setError(null);
            change.mutate(
              { currentPassword, newPassword },
              {
                onSuccess: () => {
                  toast.success("Password updated");
                  setCurrent("");
                  setNew("");
                  setConfirm("");
                },
                onError: (err) => setError(err instanceof ApiError ? err.message : "Could not change password"),
              },
            );
          }}
        >
          Update password
        </Button>
      </CardContent>
    </Card>
  );
}

function DataTab() {
  const user = useCurrentUser();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isDemo = user?.email === "demo@nivesh.local";

  return (
    <div className="grid max-w-3xl gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="size-4 text-brand" /> Export your data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Download a JSON copy of your watchlists, portfolios, transactions, notes, saved screens, alerts and paper
            trades.
          </p>
          <Button
            variant="outline"
            loading={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const data = await exportUserData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `nivesh-export-${new Date().toISOString().slice(0, 10)}.json`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success("Export downloaded");
              } catch {
                toast.error("Export failed");
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="size-4" /> Download JSON
          </Button>
        </CardContent>
      </Card>

      <Card className="border-down/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-down">
            <ShieldAlert className="size-4" /> Delete account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isDemo ? (
            <p className="text-sm text-muted">The shared demo account cannot be deleted.</p>
          ) : (
            <>
              <p className="text-sm text-muted">
                Permanently removes your account and all associated data. This action cannot be undone.
              </p>
              {confirmOpen ? (
                <div className="space-y-3">
                  <Field label="Confirm your password">
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      disabled={!password}
                      loading={deleteAccount.isPending}
                      onClick={() =>
                        deleteAccount.mutate(password, {
                          onSuccess: () => {
                            toast.success("Account deleted");
                            logout.mutate();
                            navigate("/login", { replace: true });
                          },
                          onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete account"),
                        })
                      }
                    >
                      <Trash2 className="size-4" /> Permanently delete
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="border-down/40 text-down" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="size-4" /> Delete my account
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
