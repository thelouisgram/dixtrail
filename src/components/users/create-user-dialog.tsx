"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { createUserSchema, type CreateUserInput } from "@/lib/validations";
import { useCreateUser } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { ROLE_LABELS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
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

interface CreateUserDialogProps {
  userRole: string;
}

const defaultValues: CreateUserInput = {
  name: "",
  email: "",
  password: "",
  role: Role.SALES_REP,
};

function allowedRoles(userRole: string): Role[] {
  if (userRole === Role.ADMIN) return Object.values(Role);
  return [Role.SALES_REP];
}

export function CreateUserDialog({ userRole }: CreateUserDialogProps) {
  const { userModalOpen, setUserModalOpen } = useUIStore();
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues,
  });

  function handleOpenChange(open: boolean) {
    setUserModalOpen(open);
    if (!open) reset(defaultValues);
  }

  async function onSubmit(data: CreateUserInput) {
    try {
      await createUser.mutateAsync(data);
      toast.success("User created");
      reset(defaultValues);
      setUserModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    }
  }

  return (
    <Dialog open={userModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Password</Label>
            <Input id="user-password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
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
                    {allowedRoles(userRole).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting || createUser.isPending}>
            Create User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
