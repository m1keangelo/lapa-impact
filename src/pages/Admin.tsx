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
import { Camera, CircleAlert, ClipboardCheck, HandCoins, Newspaper, Send, Users } from 'lucide-react';
import { Toaster } from 'sonner';
import type { User } from 'firebase/auth';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { firebaseReady } from '@/lib/firebase';
import { useLanguage, type LanguageContextValue } from '@/i18n/LanguageContext';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useStaff } from '@/hooks/useStaff';
import type { StaffUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import AdminBar from './admin/AdminBar';
import AuthGate from './admin/AuthGate';
import HealthChips from './admin/HealthChips';
import GiftForm from './admin/GiftForm';
import TransferForm from './admin/TransferForm';
import UpdateForm from './admin/UpdateForm';
import PhotosForm from './admin/PhotosForm';
import RecentActivity from './admin/RecentActivity';
import PurchaseForm from './admin/PurchaseForm';
import MoneyInList from './admin/MoneyInList';
import FieldReportForm from './admin/FieldReportForm';
import QueuePanel from './admin/QueuePanel';
import TeamPanel from './admin/TeamPanel';
import { inputCls } from './admin/formUtils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function buildTabs(t: LanguageContextValue['t']) {
  return [
    { id: 'gift', label: t.admin.tabs.gift, icon: HandCoins },
    { id: 'transfer', label: t.admin.tabs.transfer, icon: Send },
    { id: 'update', label: t.admin.tabs.update, icon: Newspaper },
    { id: 'photos', label: t.admin.tabs.photos, icon: Camera },
    { id: 'queue', label: t.ops.queue.title.replace('.', ''), icon: ClipboardCheck },
    { id: 'team', label: t.ops.team.title.replace('.', ''), icon: Users },
  ] as const;
}

type TabId = 'gift' | 'transfer' | 'update' | 'photos' | 'queue' | 'team';

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
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[520px] rounded-card border border-danger/50 bg-surface p-8 text-center">
        <CircleAlert className="mx-auto h-10 w-10 text-danger" strokeWidth={1.5} />
        <h1 className="mt-4 font-display text-[28px] font-medium text-text">
          {t.admin.noticeTitle}
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-text-muted">
          {t.admin.noticeA}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-amber">
            VITE_FIREBASE_*
          </code>
          {t.admin.noticeB}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-amber">
            .env.example
          </code>
          {t.admin.noticeC}
        </p>
      </div>
    </div>
  );
}

function AdminPanel({
  email,
  staffName,
  onSignOut,
}: {
  email: string;
  staffName: string;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<TabId>('gift');
  const [saveTick, setSaveTick] = useState(0);
  const online = useOnlineStatus();
  const { stats } = useGlobalStats();
  const { t } = useLanguage();
  const TABS = buildTabs(t);
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
          {t.admin.offlineBanner}
        </div>
      )}

      <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-8 md:px-8">
        {/* Command header */}
        <h1 className="font-display text-[24px] font-medium tracking-[-0.01em] text-text md:text-[32px]">
          {t.admin.title}
        </h1>
        <p className="mt-1.5 text-[13px] font-medium tracking-[0.01em] text-text-muted">
          {t.admin.sub}
        </p>
        <HealthChips saveTick={saveTick} />

        {/* Workbench */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabId)}
          className="mt-8 rounded-card border border-border bg-surface"
        >
          {/* Custom tab bar: amber underline animates via layoutId */}
          <div className="flex border-b border-border px-2" role="tablist" aria-label={t.admin.tabAria}>
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
            <TabsContent value="queue" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <QueuePanel reviewerName={staffName} />
              </motion.div>
            </TabsContent>
            <TabsContent value="team" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <TeamPanel />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>

        <RecentActivity />
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Role consoles (spec §8–12)                                            */
/* ------------------------------------------------------------------ */

/** One-time setup: first signed-in account claims the admin profile. */
function BootstrapCard({
  staff,
  onSignOut,
}: {
  staff: ReturnType<typeof useStaff>;
  onSignOut: () => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-[440px] rounded-card border border-border bg-surface p-8"
      >
        <h1 className="font-display text-[26px] font-medium text-text">
          {t.ops.bootstrap.title}
        </h1>
        <p className="mt-2 text-[13px] leading-[1.55] text-text-muted">{t.ops.bootstrap.sub}</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.ops.bootstrap.namePh}
          className={cn(inputCls, 'mt-6')}
        />
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await staff.bootstrapAdmin(name);
            } catch (err) {
              console.warn('[bootstrap] failed:', err);
              setBusy(false);
            }
          }}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-[10px] bg-amber text-[15px] font-semibold text-white transition-colors hover:bg-amber-soft disabled:opacity-60"
        >
          {t.ops.bootstrap.cta}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 w-full text-center text-[13px] font-medium text-text-muted hover:text-text"
        >
          {t.admin.authGate.back}
        </button>
      </motion.div>
    </div>
  );
}

/** Signed in but deactivated, or waiting for a role. */
function NoAccessCard({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[440px] rounded-card border border-border bg-surface p-8 text-center">
        <h1 className="font-display text-[26px] font-medium text-text">{t.ops.noAccess.title}</h1>
        <p className="mt-2 text-[13px] leading-[1.55] text-text-muted">{t.ops.noAccess.sub}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-5 text-[13px] font-medium text-text-muted hover:text-text"
        >
          {t.admin.authGate.back}
        </button>
      </div>
    </div>
  );
}

/** Finance console — Mayra's desk: money in (live) + money out w/ receipts. */
function FinanceConsole({
  staff,
  email,
  onSignOut,
}: {
  staff: StaffUser;
  email: string;
  onSignOut: () => void;
}) {
  const online = useOnlineStatus();
  const { stats } = useGlobalStats();
  const { t } = useLanguage();
  const balanceCents = stats.totalIn - stats.totalOut;
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <AdminBar email={email} online={online} onSignOut={onSignOut} />
      <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-8 md:px-8">
        <p className="eyebrow">{t.ops.roles.finance} · {staff.name}</p>
        <h1 className="mt-2 font-display text-[24px] font-medium tracking-[-0.01em] text-text md:text-[32px]">
          {t.ops.finance.title}
        </h1>
        <p className="mt-1.5 text-[13px] font-medium tracking-[0.01em] text-text-muted">
          {t.ops.finance.sub}
        </p>
        <div className="mt-8 flex flex-col gap-6">
          <section className="rounded-card border border-border bg-surface p-5 md:p-6">
            <h2 className="font-display text-[19px] font-medium text-text">
              {t.ops.finance.outTitle}
            </h2>
            <div className="mt-5">
              <PurchaseForm balanceCents={balanceCents} onSaved={() => undefined} />
            </div>
          </section>
          <MoneyInList />
        </div>
      </div>
    </motion.div>
  );
}

/** Field console — volunteer reports: photos + note, submitted for review. */
function FieldConsole({
  staff,
  user,
  onSignOut,
}: {
  staff: StaffUser;
  user: User;
  onSignOut: () => void;
}) {
  const online = useOnlineStatus();
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <AdminBar email={user.email ?? ''} online={online} onSignOut={onSignOut} />
      <div className="mx-auto w-full max-w-[760px] px-5 pb-20 pt-8 md:px-8">
        <p className="eyebrow">{t.ops.roles.field} · {staff.name}</p>
        <h1 className="mt-2 font-display text-[24px] font-medium tracking-[-0.01em] text-text md:text-[32px]">
          {t.ops.field.title}
        </h1>
        <p className="mt-1.5 text-[13px] font-medium tracking-[0.01em] text-text-muted">
          {t.ops.field.sub}
        </p>
        <div className="mt-8 rounded-card border border-border bg-surface p-5 md:p-6">
          <FieldReportForm user={user} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Admin() {
  const { user, loading, signIn, signOut } = useAdminAuth();
  const staff = useStaff(user);

  const spinner = (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-amber" />
    </div>
  );

  return (
    <>
      {firebaseReady ? (
        loading ? (
          spinner
        ) : user ? (
          staff.loading ? (
            spinner
          ) : staff.needsBootstrap ? (
            <BootstrapCard staff={staff} onSignOut={() => void signOut()} />
          ) : staff.staff && !staff.staff.active ? (
            <NoAccessCard onSignOut={() => void signOut()} />
          ) : staff.staff?.role === 'finance' ? (
            <FinanceConsole
              staff={staff.staff}
              email={user.email ?? 'finance'}
              onSignOut={() => void signOut()}
            />
          ) : staff.staff?.role === 'field' ? (
            <FieldConsole
              staff={staff.staff}
              user={user}
              onSignOut={() => void signOut()}
            />
          ) : (
            <AdminPanel
              email={user.email ?? 'admin'}
              staffName={staff.staff?.name ?? user.email ?? 'admin'}
              onSignOut={() => void signOut()}
            />
          )
        ) : (
          <AuthGate signIn={signIn} />
        )
      ) : (
        <FirebaseNotice />
      )}
      <Toaster
        position="bottom-right"
        theme="light"
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
