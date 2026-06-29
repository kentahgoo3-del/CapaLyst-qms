import React, { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { PageTransition } from "@/components/page-transition";
import {
  useListUsers, getListUsersQueryKey, useCreateUser, useUpdateUser, useDeleteUser,
  useListUserRoleDefinitions, useCreateUserRoleDefinition,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Users as UsersIcon, Shield, Star, Edit2, Loader2, Settings, Trash2, ArchiveIcon, UserX, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSettingOptions } from "@/hooks/use-setting-options";
import { ESignatureDialog } from "@/components/esignature-dialog";
import { useAuth } from "@/context/auth-context";

const DEPARTMENTS = [
  "Production", "Validation", "Quality", "Regulatory",
  "Engineering", "Procurement", "IT", "R&D", "Logistics", "Other",
];

const ROLE_COLORS: Record<string, string> = {
  Admin:  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  QA:     "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  User:   "bg-secondary text-secondary-foreground",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  Admin: <Star className="w-3 h-3 mr-1" />,
  QA:    <Shield className="w-3 h-3 mr-1" />,
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-green-100 text-green-800 border-green-200" },
  retired:  { label: "Retired",  className: "bg-amber-100 text-amber-800 border-amber-200" },
  archived: { label: "Archived", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

type EsigConfig = { title: string; description?: string; actionLabel?: string; onConfirmed: () => void };

export default function UsersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const departments = useSettingOptions("departments", DEPARTMENTS);

  const isAdmin = currentUser?.roles?.includes("Admin") ?? false;

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [esig, setEsig] = useState<EsigConfig | null>(null);

  // Add User form
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addDept, setAddDept] = useState("");
  const [addRoles, setAddRoles] = useState<string[]>(["User"]);

  // Edit User form — all fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("active");
  const [editPassword, setEditPassword] = useState("");
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editMustChange, setEditMustChange] = useState(false);

  // New Role form
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const debouncedSearch = useDebounce(search, 400);
  const params = { page, pageSize: 10, ...(debouncedSearch && { search: debouncedSearch }) };
  const { data, isLoading } = useListUsers(params, { query: { queryKey: getListUsersQueryKey(params) } });
  const { data: roleDefs, refetch: refetchRoles } = useListUserRoleDefinitions();
  const allRoles = roleDefs?.map((r) => r.name) ?? ["Admin", "QA", "User"];

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const createRoleDef = useCreateUserRoleDefinition();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(params) });

  const toggleRole = (roles: string[], setRoles: (r: string[]) => void, role: string) => {
    setRoles(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role]);
  };

  const resetAdd = () => {
    setIsAddOpen(false);
    setAddName(""); setAddEmail(""); setAddPassword(""); setAddDept(""); setAddRoles(["User"]);
  };

  // ── Add User ──────────────────────────────────────────────────────────────
  const doAddUser = () => {
    createUser.mutate({
      data: {
        name: addName,
        email: addEmail,
        password: addPassword || undefined,
        roles: addRoles.length ? addRoles : ["User"],
        department: addDept || undefined,
      }
    }, {
      onSuccess: () => { toast({ title: "User created successfully" }); resetAdd(); invalidate(); },
      onError: (err: any) => {
        toast({ title: err?.response?.data?.error ?? "Failed to create user", variant: "destructive" });
      },
    });
  };

  const handleAddUser = () => {
    if (!addName.trim() || !addEmail.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" }); return;
    }
    setIsAddOpen(false);
    setEsig({ title: "Add User", description: "Your e-signature is required to create a new user account.", actionLabel: "Create", onConfirmed: doAddUser });
  };

  // ── Edit User ──────────────────────────────────────────────────────────────
  const openEdit = (user: any) => {
    setSelectedUser(user);
    setEditName(user.name ?? "");
    setEditEmail(user.email ?? "");
    setEditDept(user.department ?? "");
    setEditRoles(user.roles ?? []);
    setEditStatus(user.status ?? "active");
    setEditPassword("");
    setEditMustChange(user.mustChangePassword ?? false);
    setEditShowPassword(false);
    setIsEditOpen(true);
  };

  const doUpdateUser = (extraChanges?: object) => {
    if (!selectedUser) return;
    const payload: Record<string, any> = {
      name: editName || undefined,
      email: editEmail || undefined,
      roles: editRoles.length ? editRoles : ["User"],
      department: editDept || undefined,
      status: editStatus,
      mustChangePassword: editMustChange,
      ...extraChanges,
    };
    if (editPassword.trim()) payload.password = editPassword.trim();

    updateUser.mutate({ id: selectedUser.id, data: payload }, {
      onSuccess: () => { toast({ title: "User updated successfully" }); setIsEditOpen(false); invalidate(); },
      onError: (err: any) => toast({ title: err?.response?.data?.error ?? "Failed to update user", variant: "destructive" }),
    });
  };

  const handleUpdateUser = () => {
    setIsEditOpen(false);
    setEsig({
      title: "Update User",
      description: `Your e-signature is required to update ${selectedUser?.name}.`,
      actionLabel: "Confirm",
      onConfirmed: () => doUpdateUser(),
    });
  };

  const handleSetStatus = (newStatus: string) => {
    const labels: Record<string, string> = { retired: "Retire", archived: "Archive", active: "Reactivate" };
    setIsEditOpen(false);
    setEsig({
      title: `${labels[newStatus]} User`,
      description: `Your e-signature is required to ${labels[newStatus].toLowerCase()} ${selectedUser?.name}.`,
      actionLabel: labels[newStatus],
      onConfirmed: () => {
        updateUser.mutate({ id: selectedUser.id, data: { status: newStatus } }, {
          onSuccess: () => { toast({ title: `User ${labels[newStatus].toLowerCase()}d` }); invalidate(); },
          onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
        });
      },
    });
  };

  // ── Delete User ───────────────────────────────────────────────────────────
  const openDelete = (user: any) => { setSelectedUser(user); setIsDeleteOpen(true); };

  const doDeleteUser = () => {
    if (!selectedUser) return;
    deleteUser.mutate({ id: selectedUser.id }, {
      onSuccess: () => { toast({ title: `${selectedUser.name} has been removed` }); setIsDeleteOpen(false); setSelectedUser(null); invalidate(); },
      onError: (err: any) => toast({ title: err?.response?.data?.error ?? "Failed to delete user", variant: "destructive" }),
    });
  };

  const handleDeleteUser = () => {
    setIsDeleteOpen(false);
    setEsig({ title: "Remove User", description: `Your e-signature is required to permanently remove ${selectedUser?.name}.`, actionLabel: "Remove", onConfirmed: doDeleteUser });
  };

  // ── Create Role Definition ─────────────────────────────────────────────────
  const handleCreateRole = () => {
    if (!newRoleName.trim()) { toast({ title: "Role name is required", variant: "destructive" }); return; }
    createRoleDef.mutate({ data: { name: newRoleName.trim(), description: newRoleDesc || undefined } }, {
      onSuccess: () => { toast({ title: `Role "${newRoleName}" created` }); setNewRoleName(""); setNewRoleDesc(""); refetchRoles(); },
      onError: (err: any) => toast({ title: err?.response?.data?.error ?? "Failed to create role", variant: "destructive" }),
    });
  };

  return (
    <PageTransition className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-primary" />
            User Administration
          </h1>
          <p className="text-muted-foreground mt-1">Manage system access, roles, and departments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setIsManageRolesOpen(true)}>
            <Settings className="h-4 w-4" />
            Manage Roles
          </Button>
          {isAdmin && (
            <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      <div className="flex mb-6 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="w-[130px]">Department</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No users found.</TableCell>
              </TableRow>
            ) : (
              data?.data.map((user) => {
                const statusInfo = STATUS_BADGE[user.status ?? "active"] ?? STATUS_BADGE.active;
                const isInactive = user.status !== "active";
                return (
                  <TableRow key={user.id} className={`hover:bg-muted/50 ${isInactive ? "opacity-60" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${isInactive ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground"}`}>
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{user.name}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.department ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {(user.roles ?? []).map((role) => (
                          <Badge key={role} variant="secondary" className={`border-transparent ${ROLE_COLORS[role] ?? "bg-secondary text-secondary-foreground"}`}>
                            {ROLE_ICONS[role]}{role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)} className="text-muted-foreground hover:text-foreground" title="Edit user">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && currentUser?.id !== user.id && (
                          <Button variant="ghost" size="icon" onClick={() => openDelete(user)} className="text-muted-foreground hover:text-destructive" title="Delete user">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && (data.total ?? 0) > 10 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{(page - 1) * 10 + 1}</span> to{" "}
            <span className="font-medium text-foreground">{Math.min(page * 10, data.total ?? 0)}</span> of{" "}
            <span className="font-medium text-foreground">{data.total}</span> users
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= (data.total ?? 0)}>Next</Button>
          </div>
        </div>
      )}

      {/* ── Add User Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={(o) => { if (!o) resetAdd(); else setIsAddOpen(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account and assign roles and department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="add-name" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-email">Email Address <span className="text-destructive">*</span></Label>
              <Input id="add-email" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="jane.doe@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-password">Password</Label>
              <Input id="add-password" type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Set initial password" />
              <p className="text-xs text-muted-foreground">Leave blank to require the user to set a password on first login.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={addDept} onValueChange={setAddDept}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Roles <span className="text-destructive">*</span></Label>
              <div className="border rounded-md p-3 space-y-2 max-h-44 overflow-y-auto">
                {allRoles.map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox id={`add-role-${role}`} checked={addRoles.includes(role)} onCheckedChange={() => toggleRole(addRoles, setAddRoles, role)} />
                    <Label htmlFor={`add-role-${role}`} className="font-normal cursor-pointer flex items-center gap-1.5">{ROLE_ICONS[role]}<span className="font-medium">{role}</span></Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetAdd}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={createUser.isPending || !addName || !addEmail}>
              {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update all details for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">

            {/* Identity */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identity</p>
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Department & Roles */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Department & Roles</p>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={editDept} onValueChange={setEditDept}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-36 overflow-y-auto">
                  {allRoles.map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <Checkbox id={`edit-role-${role}`} checked={editRoles.includes(role)} onCheckedChange={() => toggleRole(editRoles, setEditRoles, role)} />
                      <Label htmlFor={`edit-role-${role}`} className="font-normal cursor-pointer flex items-center gap-1.5">{ROLE_ICONS[role]}<span className="font-medium">{role}</span></Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Password Reset */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password Reset</p>
              <div className="space-y-1.5">
                <Label htmlFor="edit-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={editShowPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="pr-10"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setEditShowPassword(v => !v)}>
                    {editShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="edit-mustchange" checked={editMustChange} onCheckedChange={(v) => setEditMustChange(!!v)} />
                <Label htmlFor="edit-mustchange" className="font-normal cursor-pointer text-sm">
                  Require user to change password on next login
                </Label>
              </div>
            </div>

            <Separator />

            {/* Account Status */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Account Status</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={editStatus === "active" ? "default" : "outline"}
                  className={editStatus === "active" ? "bg-green-600 hover:bg-green-700 text-white border-0" : ""}
                  onClick={() => setEditStatus("active")}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Active
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={editStatus === "retired" ? "default" : "outline"}
                  className={editStatus === "retired" ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : ""}
                  onClick={() => setEditStatus("retired")}
                >
                  <UserX className="h-3.5 w-3.5 mr-1.5" />
                  Retire
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={editStatus === "archived" ? "default" : "outline"}
                  className={editStatus === "archived" ? "bg-gray-500 hover:bg-gray-600 text-white border-0" : ""}
                  onClick={() => setEditStatus("archived")}
                >
                  <ArchiveIcon className="h-3.5 w-3.5 mr-1.5" />
                  Archive
                </Button>
              </div>
              {editStatus !== "active" && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  {editStatus === "retired"
                    ? "Retired users cannot log in. Their records and audit history are preserved."
                    : "Archived users cannot log in. This is typically used for permanent departures."}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Permanently remove <strong>{selectedUser?.name}</strong> from the system. This action cannot be undone.
              Consider retiring or archiving the user instead to preserve audit history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleteUser.isPending}>
              {deleteUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage Roles Dialog ──────────────────────────────────────────── */}
      <Dialog open={isManageRolesOpen} onOpenChange={setIsManageRolesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage User Levels</DialogTitle>
            <DialogDescription>View existing role levels and create new ones.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="border rounded-md divide-y max-h-52 overflow-y-auto">
              {(roleDefs ?? []).map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-3 py-2.5">
                  <Badge variant="secondary" className={`mt-0.5 shrink-0 border-transparent ${ROLE_COLORS[r.name] ?? "bg-secondary text-secondary-foreground"}`}>
                    {ROLE_ICONS[r.name]}{r.name}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{r.description ?? "—"}</p>
                </div>
              ))}
              {!roleDefs?.length && <p className="px-3 py-4 text-sm text-muted-foreground text-center">No roles defined yet.</p>}
            </div>
            <div className="border rounded-md p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-semibold">Create New User Level</p>
              <div className="space-y-1.5">
                <Label htmlFor="new-role-name">Role Name <span className="text-destructive">*</span></Label>
                <Input id="new-role-name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Supervisor, Auditor, Inspector" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-role-desc">Description</Label>
                <Textarea id="new-role-desc" value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} placeholder="Describe what this role can access..." rows={2} />
              </div>
              <Button size="sm" onClick={handleCreateRole} disabled={createRoleDef.isPending || !newRoleName.trim()} className="gap-2">
                {createRoleDef.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Create Role
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageRolesOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {esig && (
        <ESignatureDialog
          open
          onOpenChange={(o) => { if (!o) setEsig(null); }}
          title={esig.title}
          description={esig.description}
          actionLabel={esig.actionLabel}
          onConfirmed={() => { esig.onConfirmed(); setEsig(null); }}
        />
      )}
    </PageTransition>
  );
}
