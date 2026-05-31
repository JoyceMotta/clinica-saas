'use client';

import { useEffect, useState } from 'react';
import { listarItens } from '@/lib/local-storage-catalogo';
import TabServicos      from '@/components/catalogo/TabServicos';
import TabTabelaPrecos  from '@/components/catalogo/TabTabelaPrecos';
import TabPacotes       from '@/components/catalogo/TabPacotes';

// ─── Dashboard Card ───────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon,
  accent,
  sub,
}: {
  title: string;
  value: number;
  icon: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {title}
        </span>
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: accent + '22', color: accent }}
        >
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Tipos e constantes ───────────────────────────────────────────────────────

type TabId = 'servicos' | 'tabela' | 'pacotes';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'servicos', label: 'Serviços e Procedimentos', icon: '🩺' },
  { id: 'tabela',   label: 'Tabela de Preços',          icon: '💰' },
  { id: 'pacotes',  label: 'Pacotes',                   icon: '📦' },
];

interface Stats {
  total:         number;
  ativos:        number;
  procedimentos: number;
  produtos:      number;
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CatalogoPage() {
  const [aba, setAba]           = useState<TabId>('servicos');
  const [refreshKey, setRefresh] = useState(0);
  const [stats, setStats]       = useState<Stats>({
    total: 0, ativos: 0, procedimentos: 0, produtos: 0,
  });

  function refresh() {
    setRefresh((k) => k + 1);
  }

  useEffect(() => {
    const itens = listarItens();
    setStats({
      total:         itens.length,
      ativos:        itens.filter((i) => i.ativo).length,
      procedimentos: itens.filter((i) =>
        ['procedimento', 'consulta', 'pacote_sessoes'].includes(i.categoria),
      ).length,
      produtos:      itens.filter((i) => i.categoria === 'produto_fisico').length,
    });
  }, [refreshKey]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>Catálogo</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerencie serviços, procedimentos, produtos e tabela de preços.
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
        >
          <span>💾</span>
          Salvo localmente
        </div>
      </div>

      {/* Dashboard — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de itens"
          value={stats.total}
          icon="📋"
          accent="#1B2A4A"
          sub="No catálogo"
        />
        <StatCard
          title="Itens ativos"
          value={stats.ativos}
          icon="✅"
          accent="#10B981"
          sub="Disponíveis para venda"
        />
        <StatCard
          title="Procedimentos"
          value={stats.procedimentos}
          icon="🩺"
          accent="#C9A84C"
          sub="Consultas, proc. e pacotes"
        />
        <StatCard
          title="Produtos físicos"
          value={stats.produtos}
          icon="📦"
          accent="#3B82F6"
          sub="Cosméticos e correlatos"
        />
      </div>

      {/* Abas */}
      <div>
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {TABS.map((t) => {
            const active = aba === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAba(t.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex-shrink-0"
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

        {/* Conteúdo */}
        <div className="pt-5">
          {aba === 'servicos' && (
            <TabServicos refreshKey={refreshKey} onRefresh={refresh} />
          )}
          {aba === 'tabela' && (
            <TabTabelaPrecos refreshKey={refreshKey} />
          )}
          {aba === 'pacotes' && (
            <TabPacotes refreshKey={refreshKey} onRefresh={refresh} />
          )}
        </div>
      </div>
    </div>
  );
}
