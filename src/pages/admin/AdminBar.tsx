/**
 * Admin chrome: minimal `surface` bar (logo + "Mission Ledger — Admin",
 * connection badge, admin email, sign-out). Sits inside the shared Layout —
 * the public Navbar above it is owned by the scaffold.
 */
import { LogOut } from 'lucide-react';
import LiveBadge from '@/components/LiveBadge';
import { cn } from '@/lib/utils';

export default function AdminBar({
  email,
  online,
  onSignOut,
}: {
  email: string;
  online: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="sticky top-[60px] z-40 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-container items-center gap-3 px-5 md:px-8">
        <img src="/logo.svg" alt="" className="h-5 w-5" />
        <span className="font-display text-[18px] font-medium tracking-[-0.01em] text-text">
          Mission Ledger <span className="text-amber">— Admin</span>
        </span>

        <div className="ml-auto flex items-center gap-3">
          {online ? (
            <LiveBadge className="hidden sm:inline-flex" />
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/50 bg-surface px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-amber" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
                Offline
              </span>
            </span>
          )}
          <span className="hidden font-mono text-[12px] text-text-muted md:inline">
            {email}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className={cn(
              'flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[13px] font-medium',
              'text-text-muted transition-colors duration-150 ease-calm hover:bg-surface-2 hover:text-text',
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden min-[480px]:inline">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
