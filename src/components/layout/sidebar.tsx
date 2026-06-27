"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Globe,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn, formatRoleLabel } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { NotificationNavLink } from "@/components/layout/notification-nav-link";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/locations", label: "Locations", icon: MapPin },
  { href: "/dashboard/notifications", label: "Notifications", isNotifications: true },
  { href: "/dashboard/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/dashboard/territories", label: "Territories", icon: Globe, adminOnly: true },
];

interface SidebarProps {
  userRole: string;
  userName?: string | null;
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || userRole === "ADMIN" || userRole === "MANAGER"
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Logo href="/dashboard" size="sm" />
        <div className="flex items-center gap-1">
          <NotificationNavLink
            showLabel={false}
            active={isActive("/dashboard/notifications")}
            className="relative h-9 w-9 justify-center px-0 py-0"
            onClick={closeSidebar}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="fixed inset-0 top-14 z-30 bg-black/50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-14 z-40 flex w-72 max-w-[85vw] flex-col border-r bg-card shadow-xl transition-transform duration-200 ease-in-out",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:min-h-screen lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="hidden h-16 shrink-0 items-center border-b px-6 lg:flex">
          <Logo href="/dashboard" />
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {filteredNav.map((item) => {
            if (item.isNotifications) {
              return (
                <NotificationNavLink
                  key={item.href}
                  active={isActive(item.href)}
                  onClick={closeSidebar}
                />
              );
            }

            const Icon = item.icon!;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t p-4">
          <p className="mb-2 truncate text-sm font-medium">{userName ?? "User"}</p>
          <p className="mb-3 text-xs text-muted-foreground">
            {formatRoleLabel(userRole)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
