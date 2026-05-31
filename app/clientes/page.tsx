import { Suspense } from 'react';
import ClienteListagem from '@/components/ClienteListagem';

interface PageProps {
  searchParams: { q?: string };
}

export default function ClientesPage({ searchParams }: PageProps) {
  return (
    <Suspense>
      <ClienteListagem initialQuery={searchParams.q ?? ''} />
    </Suspense>
  );
}
