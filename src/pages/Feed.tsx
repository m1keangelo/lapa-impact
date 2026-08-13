import { Rss } from 'lucide-react';
import PageStub from './PageStub';

export default function Feed() {
  return (
    <PageStub
      icon={Rss}
      eyebrow="Live feed"
      title="The ledger, live."
      body="The full real-time stream of donations, transfers, updates and photos — this page is being built."
    />
  );
}
