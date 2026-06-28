"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { updateUserSchema, type UpdateUserInput } from "@/lib/validations";
import { useUpdateUser, useUserDetail } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { ROLE_LABELS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFormPlaceholder } from "@/components/ui/cute-placeholder";

interface EditUserDialogProps {
  currentUserId: string;
  userRole: string;
}

function allowedRoles(
  requesterRole: string,
  targetRole: Role,
  targetId: string,
  currentUserId: string
): Role[] {
  if (requesterRole === Role.ADMIN) return Object.values(Role);
  if (requesterRole === Role.MANAGER) {
    if (targetId === currentUserId) return [Role.MANAGER];
    if (targetRole === Role.SALES_REP) return [Role.SALES_REP];
  }
  return [targetRole];
}

export function EditUserDialog({ currentUserId, userRole }: EditUserDialogProps) {
  const { editUserId, setEditUserId } = useUIStore();
  const { data: user, isPending } = useUserDetail(editUserId);
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: Role.SALES_REP,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? "",
        email: user.email,
        password: "",
        role: user.role,
      });
    }
  }, [user, reset]);

  function handleOpenChange(open: boolean) {
    if (!open) setEditUserId(null);
  }

  async function onSubmit(data: UpdateUserInput) {
    if (!editUserId) return;
    try {
      await updateUser.mutateAsync({ id: editUserId, data });
      toast.success("User updated");
      setEditUserId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  }

  const roleOptions =
    user && editUserId
      ? allowedRoles(userRole, user.role, editUserId, currentUserId)
      : [];

  return (
    <Dialog open={!!editUserId} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update profile details, role, or password.</DialogDescription>
        </DialogHeader>

        {isPending || !user ? (
          <DialogFormPlaceholder />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-user-name">Name</Label>
              <Input id="edit-user-name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input id="edit-user-email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-user-password">New password</Label>
              <Input
                id="edit-user-password"
                type="password"
                placeholder="Leave blank to keep current password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {roleOptions.length > 0 && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting || updateUser.isPending}>
              Save changes
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
