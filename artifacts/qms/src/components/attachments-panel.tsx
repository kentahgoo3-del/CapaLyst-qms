import { useRef, useState } from "react";
import { Paperclip, Upload, Trash2, Download, FileText, FileImage, File } from "lucide-react";
import { useListAttachments, useDeleteAttachment, getListAttachmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AttachmentsPanelProps {
  module: string;
  recordId: number;
  readOnly?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return FileText;
  return File;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AttachmentsPanel({ module, recordId, readOnly = false }: AttachmentsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: attachments = [], isLoading } = useListAttachments({ module, recordId });
  const deleteMutation = useDeleteAttachment();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAttachmentsQueryKey({ module, recordId }) });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("module", module);
      fd.append("recordId", String(recordId));
      const res = await fetch("/api/attachments/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) {
        toast({ title: "Upload failed", description: "Could not upload file", variant: "destructive" });
        return;
      }
      toast({ title: "File uploaded" });
      invalidate();
    } catch {
      toast({ title: "Upload failed", description: "Network error", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "Attachment deleted" }); invalidate(); },
      onError: () => toast({ title: "Delete failed", variant: "destructive" }),
    });
  };

  const handleDownload = (id: number) => {
    window.open(`/api/attachments/${id}/download`, "_blank");
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading attachments…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Attachments ({attachments.length})</span>
        </div>
        {!readOnly && (
          <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4 mr-1.5" />
              {uploading ? "Uploading…" : "Upload File"}
            </Button>
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm border rounded-lg bg-muted/20">
          <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No attachments yet</p>
          {!readOnly && <p className="text-xs mt-1">Click "Upload File" to add documents</p>}
        </div>
      ) : (
        <div className="divide-y border rounded-lg overflow-hidden">
          {attachments.map((a) => {
            const Icon = getFileIcon(a.mimeType);
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(a.fileSize)} · {a.uploadedBy} · {formatDateTime(a.uploadedAt)}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(a.id)} title="Download">
                    <Download className="w-4 h-4" />
                  </Button>
                  {!readOnly && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id, a.fileName)} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
