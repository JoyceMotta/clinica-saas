'use client';

import { useEffect, useState } from 'react';
import {
  computeFluxoCaixa,
  listarParcelas,
  formatCentavos,
  today,
  type SemanaFluxo,
} from '@/lib/financeiro-modulo';

interface Props { refreshKey: number }

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export default function TabFluxoCaixa({ refreshKey }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [semanas, setSemanas] = useState<SemanaFluxo[]>([]);

  const [totalMes, setTotalMes]         = useState(0);
  const [projecaoMes, setProjecaoMes]   = useState(0);

  useEffect(() => {
    const data = computeFluxoCaixa(year, month);
    setSemanas(data);

    const mesStr  = `${year}-${String(month).padStart(2, '0')}`;
    const todayStr = today();
    const parcelas = listarParcelas();

    let recebido = 0, projecao = 0;
    for (const p of parcelas) {
      if (p.dataPagamento && p.dataPagamento.startsWith(mesStr)) recebido += p.valor;
      if (!p.dataPagamento && p.dataVencimento.startsWith(mesStr) && p.dataVencimento >= todayStr) projecao += p.valor;
    }
    setTotalMes(recebido);
    setProjecaoMes(projecao);
  }, [year, month, refreshKey]);

  const maxBar = Math.max(...semanas.map((s) => s.recebido + s.projecao), 1);

  function navMes(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
  }

  return (
    <div className="space-y-6">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navMes(-1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
        >
          ‹
        </button>
        <h3 className="text-base font-bold" style={{ color: '#1B2A4A' }}>
          {MESES[month - 1]} {year}
        </h3>
        <button
          onClick={() => navMes(1)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
        >
          ›
        </button>
      </div>

      {/* Cards totais */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total recebido no mês</p>
          <p className="text-2xl font-bold" style={{ color: '#16A34A' }}>{formatCentavos(totalMes)}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Projeção (a receber)</p>
          <p className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{formatCentavos(projecaoMes)}</p>
          <p className="text-xs text-gray-400 mt-1">Parcelas futuras do mês</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm font-semibold mb-6" style={{ color: '#1B2A4A' }}>Entradas por semana</p>

        {semanas.every((s) => s.recebido === 0 && s.projecao === 0) ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">Nenhuma entrada neste mês ainda.</p>
          </div>
        ) : (
          <div className="flex items-end gap-3 h-48">
            {semanas.map((s, i) => {
              const totalBar   = s.recebido + s.projecao;
              const pctReceb   = (s.recebido / maxBar) * 100;
              const pctProj    = (s.projecao / maxBar) * 100;
              const isThisWeek = today() >= s.inicio && today() <= s.fim;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
                  {/* Valor acima da barra */}
                  <div className="flex-1 flex flex-col justify-end w-full relative group">
                    {totalBar > 0 && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 z-10">
                        {formatCentavos(totalBar)}
                      </div>
                    )}
                    <div className="w-full rounded-t overflow-hidden" style={{ height: `${Math.max((totalBar / maxBar) * 100, totalBar > 0 ? 4 : 0)}%` }}>
                      {/* Barra de recebido */}
                      {s.recebido > 0 && (
                        <div style={{ height: `${(pctReceb / (pctReceb + pctProj || 1)) * 100}%`, backgroundColor: '#C9A84C' }} />
                      )}
                      {/* Barra de projeção */}
                      {s.projecao > 0 && (
                        <div style={{ height: `${(pctProj / (pctReceb + pctProj || 1)) * 100}%`, backgroundColor: 'rgba(201,168,76,0.3)' }} />
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <p
                    className="text-xs text-center leading-tight"
                    style={{ color: isThisWeek ? '#C9A84C' : '#9CA3AF', fontWeight: isThisWeek ? 700 : 400 }}
                  >
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Legenda */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#C9A84C' }} />
            <span className="text-xs text-gray-500">Recebido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(201,168,76,0.3)' }} />
            <span className="text-xs text-gray-500">Projeção</span>
          </div>
        </div>
      </div>

      {/* Detalhamento por semana */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Semana</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Recebido</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Projeção</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {semanas.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 text-xs">{s.label}</td>
                <td className="px-4 py-3 text-right font-medium" style={{ color: s.recebido > 0 ? '#16A34A' : '#D1D5DB' }}>
                  {s.recebido > 0 ? formatCentavos(s.recebido) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">
                  {s.projecao > 0 ? formatCentavos(s.projecao) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: '#1B2A4A' }}>
                  {s.recebido + s.projecao > 0 ? formatCentavos(s.recebido + s.projecao) : '—'}
                </td>
              </tr>
            ))}
            <tr className="border-t border-gray-200 font-bold">
              <td className="px-4 py-3 text-xs" style={{ color: '#1B2A4A' }}>Total</td>
              <td className="px-4 py-3 text-right" style={{ color: '#16A34A' }}>{formatCentavos(totalMes)}</td>
              <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatCentavos(projecaoMes)}</td>
              <td className="px-4 py-3 text-right" style={{ color: '#1B2A4A' }}>{formatCentavos(totalMes + projecaoMes)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
