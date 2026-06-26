"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDeleteOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

interface ConfirmDeleteDialogProps extends ConfirmDeleteOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Confirm delete",
  description,
  confirmLabel = "Delete",
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Caller shows error toast; keep dialog open for retry.
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useConfirmDelete() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDeleteOptions | null>(null);

  const requestDelete = useCallback((opts: ConfirmDeleteOptions) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setOptions(null);
  }

  const dialog = (
    <ConfirmDeleteDialog
      open={open && !!options}
      onOpenChange={handleOpenChange}
      title={options?.title}
      description={options?.description ?? ""}
      confirmLabel={options?.confirmLabel}
      onConfirm={options?.onConfirm ?? (() => {})}
    />
  );

  return { requestDelete, ConfirmDeleteDialog: dialog };
}
