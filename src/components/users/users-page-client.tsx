"use client";

import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { ROLE_LABELS } from "@/lib/constants";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog";
import { format } from "date-fns";

interface UsersPageClientProps {
  currentUserId: string;
  userRole: string;
}

export function UsersPageClient({ currentUserId, userRole }: UsersPageClientProps) {
  const { data: users = [], isLoading } = useUsers();
  const { setUserModalOpen } = useUIStore();
  const deleteUser = useDeleteUser();
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();

  function handleDelete(id: string, name: string | null) {
    requestDelete({
      title: "Delete user",
      description: `Delete ${name ?? "this user"}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteUser.mutateAsync(id);
          toast.success("User deleted");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to delete user");
          throw error;
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage team members and roles</p>
        </div>
        <Button onClick={() => setUserModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Assigned</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{user.name ?? "—"}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                      </td>
                      <td className="px-4 py-3">{user._count?.assignedLocations ?? 0}</td>
                      <td className="px-4 py-3">{user._count?.createdLocations ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {user.id !== currentUserId && user.role !== Role.ADMIN && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deleteUser.isPending}
                              onClick={() => handleDelete(user.id, user.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog userRole={userRole} />
      {ConfirmDeleteDialog}
    </div>
  );
}
