'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Activity, Ban, Bell, Coins, Download, FileText, Gauge, GitBranch, Grid3x3, History, Inbox, KeyRound, LayoutDashboard, Link2, ListOrdered, LogOut,
  Menu, Radio, Reply, ScrollText, Send, Shuffle, ShieldAlert, Smartphone, SquareTerminal, TrendingUp, Users, Webhook, X, Megaphone, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { title: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/queue', label: 'Live queue', icon: ListOrdered },
  ] },
  { title: 'Messaging', items: [
    { href: '/send', label: 'Send SMS', icon: Send },
    { href: '/distribute', label: 'Distribution', icon: Shuffle },
    { href: '/templates', label: 'Templates', icon: FileText },
    { href: '/history', label: 'History', icon: History },
    { href: '/incoming', label: 'Incoming', icon: Inbox },
    { href: '/auto-reply', label: 'Auto-reply', icon: Reply },
    { href: '/otp', label: 'OTP', icon: KeyRound },
    { href: '/short-links', label: 'Short links', icon: Link2 },
  ] },
  { title: 'Audience', items: [
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/blacklist', label: 'Blacklist', icon: Ban },
  ] },
  { title: 'Fleet', items: [
    { href: '/devices', label: 'Devices', icon: Smartphone },
    { href: '/scores', label: 'Scores', icon: Gauge },
    { href: '/commands', label: 'Remote commands', icon: SquareTerminal },
    { href: '/autoscale', label: 'Auto-scaling', icon: TrendingUp },
  ] },
  { title: 'Insights', items: [
    { href: '/heatmap', label: 'Heatmap', icon: Grid3x3 },
    { href: '/uptime', label: 'Uptime', icon: Activity },
    { href: '/costs', label: 'Costs', icon: Coins },
    { href: '/anomaly', label: 'Anomalies', icon: ShieldAlert },
  ] },
  { title: 'Operations', items: [
    { href: '/alerts', label: 'Alert channels', icon: Bell },
    { href: '/webhooks', label: 'Webhooks', icon: Webhook },
    { href: '/incidents', label: 'Status & incidents', icon: Megaphone },
    { href: '/api-versions', label: 'API versions', icon: GitBranch },
    { href: '/logs', label: 'Audit log', icon: ScrollText },
    { href: '/export', label: 'Export', icon: Download },
  ] },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><Radio className="size-4" /></div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">SMS Gateway</div>
          <div className="text-[11px] text-sidebar-muted">Operator console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.title}>
            <div className="px-2 pb-1.5 text-[10.5px] font-medium tracking-[0.08em] text-sidebar-muted uppercase">{group.title}</div>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                        active ? 'bg-sidebar-accent font-medium text-white' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white',
                      )}
                    >
                      <Icon className={cn('size-4', active ? 'text-primary' : 'text-sidebar-muted')} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-white/8 p-3">
        <Link href="/status" target="_blank" className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white">
          <ExternalLink className="size-4 text-sidebar-muted" /> Public status page
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white">
          <LogOut className="size-4 text-sidebar-muted" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-sidebar text-sidebar-foreground lg:block">
        <NavContent />
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-sidebar px-4 py-2.5 text-sidebar-foreground lg:hidden">
        <div className="flex items-center gap-2 text-sm font-semibold"><Radio className="size-4 text-primary" /> SMS Gateway</div>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-1.5 hover:bg-sidebar-accent"><Menu className="size-5" /></button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute top-4 right-3 rounded-md p-1 hover:bg-sidebar-accent"><X className="size-4" /></button>
            <NavContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
