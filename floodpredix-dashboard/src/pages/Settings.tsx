import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Settings as SettingsIcon,
  Trash2,
  Mail,
  Smartphone,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    minimumSeverity: string;
  };
  preferences: {
    language: string;
    theme: string;
    timezone: string;
  };
}

export function Settings() {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    fetchSettings();
    if (user) {
      const nameParts = user.name?.split(" ") || [];
      setProfileData({
        firstName: nameParts[0] || "",
        lastName: nameParts[1] || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getSettings();
      if (response.success && response.data) {
        setSettings(response.data as UserSettings);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.updateProfile({
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.email,
      });
      await refreshUser();
      alert("Profile updated successfully");
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateSettings(settings);
      alert("Settings updated successfully");
    } catch (err: unknown) {
      console.error("Failed to update settings:", err);
      alert("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await api.deleteAccount();
      window.location.href = "/login";
    } catch (err: unknown) {
      console.error("Failed to delete account:", err);
      alert("Failed to delete account");
    }
  };

  const updateNotification = (key: string, value: boolean | string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  const updatePreference = (key: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: value,
      },
    });
  };

  if (loading || !settings) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Application Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Manage your account, notifications, and system preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card className="bg-[#1a2c22] border-[#254632]">
        <CardHeader className="border-b border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your photo and personal details.
              </CardDescription>
            </div>
            <Button
              className="bg-primary"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32 border-4 border-[#1e293b]">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-2xl">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <Button variant="link" className="text-primary">
              Change Photo
            </Button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                First Name
              </Label>
              <Input
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
                className="bg-[rgba(15,23,42,0.5)] border-[#334155]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Last Name
              </Label>
              <Input
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
                className="bg-[rgba(15,23,42,0.5)] border-[#334155]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="pl-10 bg-[rgba(15,23,42,0.5)] border-[#334155]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Role / Title
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={user?.role || ""}
                  className="pl-10 bg-[#1e293b] border-[#334155]"
                  disabled
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Notifications */}
      <Card className="bg-[#1a2c22] border-[#254632]">
        <CardHeader className="border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-foreground" />
            <div>
              <CardTitle>Alert Notifications</CardTitle>
              <CardDescription>
                Configure how you receive flood warnings.
              </CardDescription>
            </div>
            <Button
              className="ml-auto bg-primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base font-medium">Email Alerts</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive detailed reports via email
              </p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) =>
                updateNotification("email", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base font-medium">
                  SMS Notifications
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Instant text messages for critical events
              </p>
            </div>
            <Switch
              checked={settings.notifications.sms}
              onCheckedChange={(checked) => updateNotification("sms", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base font-medium">
                  Push Notifications
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Browser notifications while online
              </p>
            </div>
            <Switch
              checked={settings.notifications.push}
              onCheckedChange={(checked) => updateNotification("push", checked)}
            />
          </div>

          <Separator className="bg-[#334155]" />

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Minimum Severity Level
            </Label>
            <Select
              value={settings.notifications.minimumSeverity}
              onValueChange={(value) =>
                updateNotification("minimumSeverity", value)
              }
            >
              <SelectTrigger className="bg-[rgba(15,23,42,0.5)] border-[#334155]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="warning-critical">
                  Warning & Critical
                </SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* General Preferences */}
      <Card className="bg-[#1a2c22] border-[#254632]">
        <CardHeader className="border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 text-foreground" />
            <CardTitle>General Preferences</CardTitle>
            <Button
              className="ml-auto bg-primary"
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Language
              </Label>
              <Select
                value={settings.preferences.language}
                onValueChange={(value) => updatePreference("language", value)}
              >
                <SelectTrigger className="bg-[rgba(15,23,42,0.5)] border-[#334155]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-us">English (US)</SelectItem>
                  <SelectItem value="en-gb">English (UK)</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Theme
              </Label>
              <Select
                value={settings.preferences.theme}
                onValueChange={(value) => updatePreference("theme", value)}
              >
                <SelectTrigger className="bg-[rgba(15,23,42,0.5)] border-[#334155]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Timezone
              </Label>
              <Select
                value={settings.preferences.timezone}
                onValueChange={(value) => updatePreference("timezone", value)}
              >
                <SelectTrigger className="bg-[rgba(15,23,42,0.5)] border-[#334155]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pacific">
                    (GMT-08:00) Pacific Time (US & Canada)
                  </SelectItem>
                  <SelectItem value="eastern">
                    (GMT-05:00) Eastern Time (US & Canada)
                  </SelectItem>
                  <SelectItem value="central">
                    (GMT-06:00) Central Time (US & Canada)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-500/10 border-red-500/20">
        <CardHeader className="border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Delete Account
              </h3>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back.
              </p>
            </div>
            <Button
              variant="destructive"
              className="bg-red-950 border-red-800 text-red-400 hover:bg-red-900"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
