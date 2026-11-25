import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get your verdict · Persist',
  description:
    'Bring your day from your assistant, a sketch, or an example. Persist reads the load and tells you how hard to go. No account, nothing uploaded.',
};

export default function VerdictLayout({ children }: { children: React.ReactNode }) {
  return children;
}
