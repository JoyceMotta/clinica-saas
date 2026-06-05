import { Suspense } from 'react';
import SaudacaoDashboard from '@/components/SaudacaoDashboard';
import AniversariosWidget from '@/components/AniversariosWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-8">

      {/* Saudação personalizada */}
      <Suspense fallback={
        <div>
          <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
      }>
        <SaudacaoDashboard />
      </Suspense>

      {/* Aniversários */}
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
