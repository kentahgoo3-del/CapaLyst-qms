import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck } from "lucide-react";

export interface ESignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actionLabel?: string;
  withReason?: boolean;
  reasonLabel?: string;
  onConfirmed: (reason?: string) => void;
}

export function ESignatureDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Confirm",
  withReason = false,
  reasonLabel = "Reason",
  onConfirmed,
}: ESignatureDialogProps) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setReason("");
      setError("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (withReason && !reason.trim()) {
      setError("Please enter a reason.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Incorrect password");
        setLoading(false);
        return;
      }
      onConfirmed(withReason ? reason : undefined);
      onOpenChange(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-500 shrink-0" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="pt-1">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-1">
          {withReason && (
            <div className="space-y-1.5">
              <Label>
                {reasonLabel} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason…"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              Electronic Signature — Password{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password to confirm"
              autoFocus={!withReason}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleConfirm()}
            />
            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          <div className="rounded-md bg-muted/40 border px-3 py-2 text-xs text-muted-foreground">
            By confirming, you are electronically signing this action in compliance
            with 21 CFR Part 11.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
