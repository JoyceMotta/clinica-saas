import ClienteFicha from '@/components/ClienteFicha';

interface PageProps {
  params: { id: string };
}

export default function ClientePage({ params }: PageProps) {
  return <ClienteFicha id={params.id} />;
}
