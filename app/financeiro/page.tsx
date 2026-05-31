'use client';

import { useState } from 'react';
import DashboardCards       from '@/components/financeiro/DashboardCards';
import ModalNovoLancamento  from '@/components/financeiro/ModalNovoLancamento';
import TabLancamentos       from '@/components/financeiro/TabLancamentos';
import TabContasReceber     from '@/components/financeiro/TabContasReceber';
import TabFluxoCaixa        from '@/components/financeiro/TabFluxoCaixa';
import TabRelatorios        from '@/components/financeiro/TabRelatorios';

type TabId = 'lancamentos' | 'contas' | 'fluxo' | 'relatorios';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'lancamentos', label: 'Lançamentos',      icon: '📝' },
  { id: 'contas',      label: 'Contas a Receber', icon: '📋' },
  { id: 'fluxo',      label: 'Fluxo de Caixa',   icon: '📈' },
  { id: 'relatorios', label: 'Relatórios',        icon: '📊' },
];

export default function FinanceiroPage() {
  const [aba, setAba]             = useState<TabId>('lancamentos');
  const [modalAberto, setModal]   = useState(false);
  const [refreshKey, setRefresh]  = useState(0);

  function refresh() { setRefresh((k) => k + 1); }

  function handleSaved() {
    setModal(false);
    refresh();
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>Financeiro</h1>
          <p className="text-gray-500 mt-1 text-sm">Gestão financeira e fluxo de caixa da clínica.</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
        >
          <span className="text-lg leading-none">+</span>
          Novo Lançamento
        </button>
      </div>

      {/* Dashboard cards */}
      <DashboardCards refreshKey={refreshKey} />

      {/* Abas */}
      <div>
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((t) => {
            const active = aba === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAba(t.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px"
                style={
                  active
                    ? { borderColor: '#C9A84C', color: '#1B2A4A' }
                    : { borderColor: 'transparent', color: '#9CA3AF' }
                }
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo das abas */}
        <div className="pt-5">
          {aba === 'lancamentos' && (
            <TabLancamentos refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {aba === 'contas' && (
            <TabContasReceber refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {aba === 'fluxo' && (
            <TabFluxoCaixa refreshKey={refreshKey} />
          )}
          {aba === 'relatorios' && (
            <TabRelatorios refreshKey={refreshKey} />
          )}
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalNovoLancamento
          onClose={() => setModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
