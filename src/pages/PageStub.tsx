import type { LucideIcon } from 'lucide-react';

interface PageStubProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
}

/** Placeholder page used until the owning page agent ships the real one. */
export default function PageStub({ icon: Icon, eyebrow, title, body }: PageStubProps) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-5 text-center">
      <Icon className="h-10 w-10 text-text-faint" strokeWidth={1.5} />
      <p className="eyebrow flex items-center gap-3">
        <span className="inline-block h-px w-4 bg-amber" aria-hidden />
        {eyebrow}
      </p>
      <h1 className="font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl">
        {title}
      </h1>
      <p className="max-w-[48ch] text-[15px] leading-[1.55] text-text-muted">{body}</p>
    </div>
  );
}
