"use client";

import {
  Plus,
  Trash2,
  MapPin,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { useUIStore } from "@/stores/ui-store";
import { ROLE_LABELS } from "@/lib/constants";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateUserDialog } from "@/components/users/create-user-dialog";
import { AssignCitiesDialog } from "@/components/users/assign-cities-dialog";
import { UserDetailDialog } from "@/components/users/user-detail-dialog";
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog";
import { LOADING_SURFACE_CLASS, UsersTablePlaceholder } from "@/components/ui/cute-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { QueryPageError } from "@/components/ui/query-page-error";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface UsersPageClientProps {
  currentUserId: string;
  userRole: string;
}

export function UsersPageClient({ currentUserId, userRole }: UsersPageClientProps) {
  const { data, isPending, isError, refetch } = useUsers();
  const { setUserModalOpen, setUserDetailId, setAssignCitiesUserId, userFilters, setUserFilters } =
    useUIStore();
  const deleteUser = useDeleteUser();
  const { requestDelete, ConfirmDeleteDialog } = useConfirmDelete();

  const isFirstLoad = isPending && data === undefined;
  const userList = data?.users ?? [];
  const pagination = data?.pagination;
  const rowOffset = pagination ? (pagination.page - 1) * pagination.limit : 0;

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
    <QueryPageError isError={isError} refetch={refetch}>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Users"
          description="Manage team members and roles"
          loadingDescription="Rounding up the team…"
          isLoading={isFirstLoad}
          action={
            <Button onClick={() => setUserModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          }
        />

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardContent className="p-4 lg:p-6">
            <Input
              placeholder="Search by name or email..."
              value={userFilters.search}
              onChange={(e) => setUserFilters({ search: e.target.value, page: 1 })}
            />
          </CardContent>
        </Card>

        <Card className={cn(isFirstLoad && LOADING_SURFACE_CLASS, "animate-fade-in-up")}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-12 px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                    <th className="px-4 py-3 text-right font-medium w-15">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isFirstLoad ? (
                    <UsersTablePlaceholder />
                  ) : userList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        {userFilters.search
                          ? "No users match your search."
                          : "No users yet — add your first team member!"}
                      </td>
                    </tr>
                  ) : (
                    userList.map((user, index) => (
                      <tr
                        key={user.id}
                        className="animate-fade-in-up cursor-pointer border-b hover:bg-muted/30"
                        style={{ animationDelay: `${index * 40}ms` }}
                        onClick={() => setUserDetailId(user.id)}
                      >
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">
                          {rowOffset + index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium">{user.name ?? "—"}</td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setUserDetailId(user.id)}>
                                  <Eye className="h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAssignCitiesUserId(user.id)}>
                                  <MapPin className="h-4 w-4" />
                                  Assign cities
                                </DropdownMenuItem>
                                {user.id !== currentUserId && user.role !== Role.ADMIN && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      disabled={deleteUser.isPending}
                                      onClick={() => handleDelete(user.id, user.name)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete user
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setUserFilters({ page: pagination.page - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setUserFilters({ page: pagination.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <CreateUserDialog userRole={userRole} />
        <AssignCitiesDialog />
        <UserDetailDialog />
        {ConfirmDeleteDialog}
      </div>
    </QueryPageError>
  );
}
