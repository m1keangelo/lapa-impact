/**
 * Admin Panel (/admin) — the mission operator's control room.
 *
 * Gate: Firebase Auth email/password (useAdminAuth). When Firebase env vars
 * are missing, a clear configuration notice replaces the sign-in form.
 *
 * Signed in: custom admin bar, health chips from stats/global, and a 4-tab
 * workbench — Gift (donation + donor create), Transfer (money out), Update
 * (field report + metrics), Photos (browser-compressed Cloudinary uploads).
 * All stat writes are batched Firestore increments; money is integer cents.
 * Below: "Last logged", a live onSnapshot list of the most recent writes.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CircleAlert, HandCoins, Newspaper, Send } from 'lucide-react';
import { Toaster } from 'sonner';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { firebaseReady } from '@/lib/firebase';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';
import AdminBar from './admin/AdminBar';
import AuthGate from './admin/AuthGate';
import HealthChips from './admin/HealthChips';
import GiftForm from './admin/GiftForm';
import TransferForm from './admin/TransferForm';
import UpdateForm from './admin/UpdateForm';
import PhotosForm from './admin/PhotosForm';
import RecentActivity from './admin/RecentActivity';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TABS = [
  { id: 'gift', label: 'Gift', icon: HandCoins },
  { id: 'transfer', label: 'Transfer', icon: Send },
  { id: 'update', label: 'Update', icon: Newspaper },
  { id: 'photos', label: 'Photos', icon: Camera },
] as const;

type TabId = (typeof TABS)[number]['id'];

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Shown when VITE_FIREBASE_* env vars are missing — no broken form. */
function FirebaseNotice() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[520px] rounded-card border border-danger/50 bg-surface p-8 text-center">
        <CircleAlert className="mx-auto h-10 w-10 text-danger" strokeWidth={1.5} />
        <h1 className="mt-4 font-display text-[28px] font-medium text-text">
          Firebase not configured
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-text-muted">
          The admin panel needs live credentials. Set the{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-amber">
            VITE_FIREBASE_*
          </code>{' '}
          env vars (see{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-amber">
            .env.example
          </code>
          ), restart the dev server, and reload.
        </p>
      </div>
    </div>
  );
}

function AdminPanel({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<TabId>('gift');
  const [saveTick, setSaveTick] = useState(0);
  const online = useOnlineStatus();
  const { stats } = useGlobalStats();
  const onSaved = () => setSaveTick((t) => t + 1);
  const balanceCents = stats.totalIn - stats.totalOut;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <AdminBar email={email} online={online} onSignOut={onSignOut} />

      {!online && (
        <div className="border-b border-amber/40 bg-amber-glow px-5 py-2.5 text-center text-[13px] font-medium text-amber">
          You're offline — writes will fail until reconnected.
        </div>
      )}

      <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-8 md:px-8">
        {/* Command header */}
        <h1 className="font-display text-[24px] font-medium tracking-[-0.01em] text-text md:text-[32px]">
          Log the work.
        </h1>
        <p className="mt-1.5 text-[13px] font-medium tracking-[0.01em] text-text-muted">
          Everything you save appears live on the public ledger within a second.
        </p>
        <HealthChips saveTick={saveTick} />

        {/* Workbench */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabId)}
          className="mt-8 rounded-card border border-border bg-surface"
        >
          {/* Custom tab bar: amber underline animates via layoutId */}
          <div className="flex border-b border-border px-2" role="tablist" aria-label="Admin workbench">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'relative flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-[14px] font-medium transition-colors duration-200 ease-calm',
                    active ? 'text-amber' : 'text-text-muted hover:text-text',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden min-[480px]:inline">{t.label}</span>
                  {active && (
                    <motion.span
                      layoutId="admin-tab-underline"
                      transition={{ duration: 0.2, ease: EASE }}
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-amber"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5 md:p-6">
            <TabsContent value="gift" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <GiftForm onSaved={onSaved} />
              </motion.div>
            </TabsContent>
            <TabsContent value="transfer" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <TransferForm balanceCents={balanceCents} onSaved={onSaved} />
              </motion.div>
            </TabsContent>
            <TabsContent value="update" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <UpdateForm onSaved={onSaved} />
              </motion.div>
            </TabsContent>
            <TabsContent value="photos" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <PhotosForm onSaved={onSaved} />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>

        <RecentActivity />
      </div>
    </motion.div>
  );
}

export default function Admin() {
  const { user, loading, signIn, signOut } = useAdminAuth();

  return (
    <>
      {firebaseReady ? (
        loading ? (
          <div className="flex min-h-[50dvh] items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-amber" />
          </div>
        ) : user ? (
          <AdminPanel email={user.email ?? 'admin'} onSignOut={() => void signOut()} />
        ) : (
          <AuthGate signIn={signIn} />
        )
      ) : (
        <FirebaseNotice />
      )}
      <Toaster
        position="bottom-right"
        theme={document.documentElement.classList.contains('light') ? 'light' : 'dark'}
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          },
        }}
      />
    </>
  );
}
