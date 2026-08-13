import { ClipboardPen } from 'lucide-react';
import PageStub from './PageStub';

export default function Admin() {
  return (
    <PageStub
      icon={ClipboardPen}
      eyebrow="Admin"
      title="Field admin panel."
      body="Log donations and transfers, post updates, upload photos — this page is being built."
    />
  );
}
