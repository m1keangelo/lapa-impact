import { HeartHandshake } from 'lucide-react';
import PageStub from './PageStub';

export default function Impact() {
  return (
    <PageStub
      icon={HeartHandshake}
      eyebrow="My impact"
      title="Your impact dashboard."
      body="Personal totals, donation history and what your money funded — this page is being built."
    />
  );
}
