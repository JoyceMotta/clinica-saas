'use client';

import { useEffect, useState } from 'react';
import {
  computeRelatorioProfissional,
  computeRelatorioProcedimento,
  listarParcelas,
  formatCentavos,
  today,
  type ItemRelatorio,
} from '@/lib/financeiro-modulo';

interface Props { refreshKey: number }

function primeiroDoMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function RankingBar({ items, total }: { items: ItemRelatorio[]; total: number }) {
  if (!items.length) {
    return <p className="text-sm text-gray-400 text-center py-6">Nenhum dado no período.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = total > 0 ? (item.total / total) * 100 : 0;
        return (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium" style={{ color: '#1B2A4A' }}>{item.label}</span>
              <span className="text-sm font-semibold" style={{ color: '#C9A84C' }}>{formatCentavos(item.total)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: '#C9A84C' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {pct.toFixed(1)}% · {item.count} {item.count === 1 ? 'parcela' : 'parcelas'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function TabRelatorios({ refreshKey }: Props) {
  const [inicio, setInicio] = useState(primeiroDoMes());
  const [fim, setFim]       = useState(today());

  const [porProf, setPorProf]   = useState<ItemRelatorio[]>([]);
  const [porProc, setPorProc]   = useState<ItemRelatorio[]>([]);
  const [totalPeriodo, setTotalPeriodo] = useState(0);
  const [totalParcelas, setTotalParcelas] = useState(0);

  useEffect(() => {
    const dp = computeRelatorioProfissional(inicio, fim);
    const dc = computeRelatorioProcedimento(inicio, fim);
    setPorProf(dp);
    setPorProc(dc);

    const total = dp.reduce((s, i) => s + i.total, 0);
    const count = dp.reduce((s, i) => s + i.count, 0);
    setTotalPeriodo(total);
    setTotalParcelas(count);
  }, [inicio, fim, refreshKey]);

  // Ticket médio
  const ticketMedio = totalParcelas > 0 ? Math.floor(totalPeriodo / totalParcelas) : 0;

  // Inadimplência no período
  const inadimplencia = listarParcelas()
    .filter((p) => !p.dataPagamento && p.dataVencimento >= inicio && p.dataVencimento <= fim && p.dataVencimento < today())
    .reduce((s, p) => s + p.valor, 0);

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>Período de análise</p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Até</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setInicio(primeiroDoMes()); setFim(today()); }}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Este mês
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const last = new Date(y, d.getMonth() + 1, 0).getDate();
                setInicio(`${y}-${m}-01`);
                setFim(`${y}-${m}-${String(last).padStart(2, '0')}`);
              }}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Mês anterior
            </button>
            <button
              onClick={() => {
                const y = new Date().getFullYear();
                setInicio(`${y}-01-01`);
                setFim(`${y}-12-31`);
              }}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Este ano
            </button>
          </div>
        </div>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Faturado no período</p>
          <p className="text-xl font-bold" style={{ color: '#C9A84C' }}>{formatCentavos(totalPeriodo)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ticket médio</p>
          <p className="text-xl font-bold" style={{ color: '#1B2A4A' }}>{formatCentavos(ticketMedio)}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Inadimplência</p>
          <p className="text-xl font-bold text-red-500">{formatCentavos(inadimplencia)}</p>
        </div>
      </div>

      {/* Rankings lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por profissional */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>
            Faturamento por profissional
          </p>
          <RankingBar items={porProf} total={totalPeriodo} />
        </div>

        {/* Por procedimento */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>
            Faturamento por procedimento
          </p>
          <RankingBar items={porProc} total={totalPeriodo} />
        </div>
      </div>

      {/* Exportar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: '#1B2A4A' }}>Exportar relatório</p>
        <p className="text-xs text-gray-400 mb-4">Exporte os dados do período selecionado.</p>
        <div className="flex gap-3">
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-400 cursor-not-allowed"
            title="Em breve"
          >
            <span>📄</span> Exportar PDF
            <span className="ml-1 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Em breve</span>
          </button>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-400 cursor-not-allowed"
            title="Em breve"
          >
            <span>📊</span> Exportar Excel
            <span className="ml-1 text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Em breve</span>
          </button>
        </div>
      </div>
    </div>
  );
}
