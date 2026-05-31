import Link from 'next/link';
import ClienteForm from '@/components/ClienteForm';

export default function NovoClientePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/clientes" className="hover:text-navy transition-colors">
          Clientes
        </Link>
        <span>/</span>
        <span className="text-navy font-medium">Novo Cliente</span>
      </nav>

      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-navy">Novo Cliente</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Preencha os dados para cadastrar um cliente no sistema.
        </p>
      </div>

      {/* Card do formulário — sem overflow-hidden para o sticky footer funcionar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 md:px-8 pt-8 pb-0">
        <ClienteForm />
      </div>
    </div>
  );
}
