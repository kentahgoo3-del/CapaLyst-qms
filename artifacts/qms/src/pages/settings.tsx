import { useEffect, useState } from "react";
import { PageTransition } from "@/components/page-transition";
import {
  useListSettingOptions,
  useCreateSettingOption,
  useDeleteSettingOption,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListSettingOptionsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Settings2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface CategoryDef {
  key: string;
  label: string;
  description: string;
}

const SECTIONS: { title: string; categories: CategoryDef[] }[] = [
  {
    title: "Deviations",
    categories: [
      { key: "deviation_types", label: "Deviation Types", description: "Types used when classifying a new deviation record" },
      { key: "operations", label: "Operations", description: "Operational areas linked to deviations" },
      { key: "priority_levels", label: "Priority Levels", description: "Severity priority options for deviations" },
      { key: "impact_levels", label: "Impact Levels", description: "Impact assessment options for deviation investigations" },
      { key: "barrier_types", label: "Barrier Types", description: "Barrier/contributing factor classifications" },
      { key: "root_cause_categories", label: "Root Cause Categories", description: "Root cause classification options" },
      { key: "solving_methods", label: "Solving Methods", description: "Root cause analysis methodologies" },
    ],
  },
  {
    title: "CAPA",
    categories: [
      { key: "capa_types", label: "CAPA Types", description: "Corrective/preventive action type options" },
      { key: "specific_attributes", label: "Specific Attributes", description: "GxP attribute classification options (GMP, GLP, etc.)" },
    ],
  },
  {
    title: "Change Control",
    categories: [
      { key: "change_types", label: "Type of Change", description: "Categories of change used in change control records" },
      { key: "justification_types", label: "Justification Types", description: "Justification categories for change control" },
    ],
  },
  {
    title: "Equipment",
    categories: [
      { key: "lab_equipment", label: "Lab Equipment", description: "Laboratory instruments available for selection in deviation/CC records" },
      { key: "manufacturing_equipment", label: "Manufacturing Equipment", description: "Manufacturing plant equipment items" },
      { key: "packaging_equipment", label: "Packaging Equipment", description: "Packaging line equipment items" },
    ],
  },
  {
    title: "General",
    categories: [
      { key: "locations", label: "Locations", description: "Facility areas used in CAPA and change control" },
      { key: "departments", label: "Departments", description: "Department options used across users and change control" },
    ],
  },
];

const ALL_CATS = SECTIONS.flatMap((s) => s.categories);

function CategoryPanel({ cat }: { cat: CategoryDef }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newValue, setNewValue] = useState("");
  const { data: options = [], isLoading } = useListSettingOptions({ category: cat.key });
  const { mutate: create, isPending: creating } = useCreateSettingOption({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSettingOptionsQueryKey({ category: cat.key }) });
        qc.invalidateQueries({ queryKey: getListSettingOptionsQueryKey() });
        setNewValue("");
        toast({ title: "Option added" });
      },
      onError: () => toast({ title: "Failed to add option", variant: "destructive" }),
    },
  });
  const { mutate: remove } = useDeleteSettingOption({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSettingOptionsQueryKey({ category: cat.key }) });
        qc.invalidateQueries({ queryKey: getListSettingOptionsQueryKey() });
        toast({ title: "Option removed" });
      },
      onError: () => toast({ title: "Failed to remove option", variant: "destructive" }),
    },
  });

  const handleAdd = () => {
    const val = newValue.trim();
    if (!val) return;
    if (options.some((o) => o.value.toLowerCase() === val.toLowerCase())) {
      toast({ title: "Already exists", description: `"${val}" is already in the list.`, variant: "destructive" });
      return;
    }
    create({ data: { category: cat.key, value: val } });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{cat.label}</CardTitle>
        <CardDescription>{cat.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No options yet. Add one below.</p>
            )}
            {options.map((opt) => (
              <Badge
                key={opt.id}
                variant="secondary"
                className="pr-1 gap-1 text-sm font-normal"
              >
                {opt.value}
                <button
                  className="ml-1 rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors p-0.5"
                  onClick={() => remove({ id: opt.id })}
                  title={`Remove "${opt.value}"`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder={`New ${cat.label.toLowerCase()} option…`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={creating || !newValue.trim()}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityPanel() {
  const { toast } = useToast();
  const [minutes, setMinutes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/config", { credentials: "include" })
      .then((r) => r.ok ? r.json() : {})
      .then((cfg: Record<string, string>) => {
        setMinutes(cfg["session_timeout_minutes"] ?? "30");
        setLoading(false);
      })
      .catch(() => { setMinutes("30"); setLoading(false); });
  }, []);

  const handleSave = async () => {
    const val = parseInt(minutes, 10);
    if (isNaN(val) || val < 0) {
      toast({ title: "Enter a valid number of minutes (0 to disable)", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: "session_timeout_minutes", value: String(val) }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Session timeout saved", description: val === 0 ? "Timeout disabled." : `Users will be logged out after ${val} minutes of inactivity.` });
    } catch {
      toast({ title: "Failed to save timeout", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Session Timeout</CardTitle>
        </div>
        <CardDescription>
          Automatically log out inactive Users and QA users after a set period. Admin accounts are exempt.
          Set to 0 to disable the timeout entirely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />Loading…
          </div>
        ) : (
          <div className="flex items-center gap-3 max-w-xs">
            <Input
              type="number"
              min={0}
              max={480}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-28"
              placeholder="30"
            />
            <span className="text-sm text-muted-foreground">minutes</span>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          The countdown resets on any mouse, keyboard, or scroll activity. Applies to User and QA role accounts only.
        </p>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin") || user?.roles?.includes("QA");
  const [activeTab, setActiveTab] = useState(ALL_CATS[0].key);

  if (!isAdmin) {
    return (
      <PageTransition>
        <div className="p-8 text-center text-muted-foreground">
          <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>You do not have permission to access System Settings.</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all dropdown lists used across the QMS modules. Changes take effect immediately.
          </p>
        </div>

        {/* Security section - Admin only */}
        {user?.roles?.includes("Admin") && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Security</p>
            <SecurityPanel />
          </div>
        )}

        {/* Dropdown option management */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Dropdown Lists</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="space-y-4">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {section.title}
                </p>
                <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
                  {section.categories.map((cat) => (
                    <TabsTrigger
                      key={cat.key}
                      value={cat.key}
                      className="rounded-md border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=inactive]:bg-card text-sm"
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {ALL_CATS.map((cat) => (
              <TabsContent key={cat.key} value={cat.key} className="mt-0">
                <CategoryPanel cat={cat} />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </PageTransition>
  );
}
