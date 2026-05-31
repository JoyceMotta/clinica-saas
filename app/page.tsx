import { Suspense } from 'react';
import AniversariosWidget from '@/components/AniversariosWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* ── Cabeçalho ── */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Bem-vindo ao painel da Clínica.</p>
      </div>

      {/* ── Aniversários ── */}
      <div>
        <h2 className="text-base font-bold mb-4" style={{ color: '#1B2A4A' }}>
          Aniversários
        </h2>
        <Suspense fallback={null}>
          <AniversariosWidget />
        </Suspense>
      </div>
    </div>
  );
}
