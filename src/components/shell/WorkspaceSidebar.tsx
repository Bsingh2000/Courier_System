"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface WorkspaceSidebarProps {
  brand: React.ReactNode;
  title: string;
  subtitle: string;
  items: Array<{
    href: string;
    label: string;
    note: string;
  }>;
  footer: React.ReactNode;
  quickAction?: {
    href: string;
    label: string;
  };
}

function isActiveNavItem(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" &&
      href !== "/portal" &&
      href !== "/driver" &&
      pathname.startsWith(`${href}/`))
  );
}

export function WorkspaceSidebar({
  brand,
  title,
  subtitle,
  items,
  footer,
  quickAction,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeItem = items.find((item) => isActiveNavItem(pathname, item.href)) ?? items[0];

  const navContent = (
    <>
      <div className="workspace-sidebar-intro space-y-4">
        {brand}
        <div>
          <p className="section-label">{title}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map((item) => {
          const active = isActiveNavItem(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={cn("workspace-nav-link", active && "workspace-nav-link-active")}
            >
              <span className="text-sm font-semibold text-white">{item.label}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">{item.note}</span>
            </Link>
          );
        })}
      </nav>

      <div className="workspace-sidebar-footer">{footer}</div>
    </>
  );

  return (
    <>
      <div className="workspace-mobile-bar panel-strong xl:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-4">
            <div>{brand}</div>
            <div>
              <p className="section-label">{title}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {activeItem?.label ?? title}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {activeItem?.note ?? subtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-center">
            {quickAction ? (
              <Link
                href={quickAction.href}
                className={cn("button-secondary hidden sm:inline-flex")}
              >
                <ArrowUpRight className="h-4 w-4" />
                {quickAction.label}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="button-secondary px-4"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {drawerOpen ? (
        <div className="workspace-drawer xl:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="workspace-drawer-backdrop"
            aria-label="Close navigation"
          />
          <aside className="workspace-drawer-panel panel-strong flex h-full flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <p className="section-label">Navigate</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="button-ghost"
                aria-label="Close navigation drawer"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      ) : null}

      <aside className="workspace-sidebar panel-strong hidden h-full flex-col gap-6 xl:flex">
        {navContent}
      </aside>
    </>
  );
}
