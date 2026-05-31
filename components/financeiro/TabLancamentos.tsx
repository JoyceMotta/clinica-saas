'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listarVendas,
  getParcelasDeVenda,
  computeStatusVenda,
  deletarVenda,
  formatCentavos,
  formatDataBR,
  STATUS_VENDA_META,
  FORMA_LABELS_FIN,
  type Venda,
  type StatusVenda,
} from '@/lib/financeiro-modulo';

interface VendaComStatus extends Venda { status: StatusVenda }

interface Props { refreshKey: number; onRefresh: () => void }

const STATUS_OPTS: { value: string; label: string }[] = [
  { value: 'todos',    label: 'Todos' },
  { value: 'pago',     label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'parcial',  label: 'Parcial' },
];

export default function TabLancamentos({ refreshKey, onRefresh }: Props) {
  const [vendas, setVendas]           = useState<VendaComStatus[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroProf, setFiltroProf]   = useState('');
  const [filtroDe, setFiltroDe]       = useState('');
  const [filtroAte, setFiltroAte]     = useState('');
  const [parcelasAberta, setParcelasAberta] = useState<string | null>(null);

  useEffect(() => {
    const all = listarVendas().map((v) => ({ ...v, status: computeStatusVenda(v.id) }));
    setVendas(all);
  }, [refreshKey]);

  const profissionais = useMemo(() => {
    const set = new Set<string>();
    vendas.forEach((v) => { if (v.profissionalNome) set.add(v.profissionalNome); });
    return [...set].sort();
  }, [vendas]);

  const filtradas = useMemo(() => {
    return vendas.filter((v) => {
      if (filtroStatus !== 'todos' && v.status !== filtroStatus) return false;
      if (filtroProf && v.profissionalNome !== filtroProf) return false;
      if (filtroDe && v.dataEmissao < filtroDe) return false;
      if (filtroAte && v.dataEmissao > filtroAte) return false;
      return true;
    });
  }, [vendas, filtroStatus, filtroProf, filtroDe, filtroAte]);

  function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento e todas as parcelas?')) return;
    deletarVenda(id);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
          <input
            type="date"
            value={filtroDe}
            onChange={(e) => setFiltroDe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Até</label>
          <input
            type="date"
            value={filtroAte}
            onChange={(e) => setFiltroAte(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Profissional</label>
          <select
            value={filtroProf}
            onChange={(e) => setFiltroProf(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="">Todos</option>
            {profissionais.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {(filtroStatus !== 'todos' || filtroProf || filtroDe || filtroAte) && (
          <button
            onClick={() => { setFiltroStatus('todos'); setFiltroProf(''); setFiltroDe(''); setFiltroAte(''); }}
            className="text-xs text-gray-400 underline hover:text-gray-600 pb-2"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💸</p>
          <p className="font-medium">Nenhum lançamento encontrado</p>
          <p className="text-sm mt-1">Use o botão &quot;+ Novo Lançamento&quot; para registrar uma venda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Procedimento</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pgto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.map((v) => {
                const meta = STATUS_VENDA_META[v.status];
                const isOpen = parcelasAberta === v.id;
                const parcelas = isOpen ? getParcelasDeVenda(v.id) : [];
                return (
                  <>
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDataBR(v.dataEmissao)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#1B2A4A' }}>{v.clienteNome}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <span>{v.procedimento}</span>
                        {v.profissionalNome && (
                          <span className="ml-2 text-xs text-gray-400">{v.profissionalNome}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: '#1B2A4A' }}>
                        {formatCentavos(v.valorTotal)}
                        {v.numeroParcelas > 1 && (
                          <span className="text-xs text-gray-400 ml-1">/{v.numeroParcelas}×</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{FORMA_LABELS_FIN[v.formaPagamento]}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: meta.bg, color: meta.text }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {v.numeroParcelas > 1 && (
                            <button
                              onClick={() => setParcelasAberta(isOpen ? null : v.id)}
                              className="text-xs text-blue-500 hover:underline"
                            >
                              {isOpen ? 'Fechar' : 'Parcelas'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && parcelas.map((p) => (
                      <tr key={p.id} style={{ backgroundColor: '#FAFAFA' }}>
                        <td className="px-4 py-2 pl-8 text-xs text-gray-400">
                          {formatDataBR(p.dataVencimento)}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500" colSpan={2}>
                          Parcela {p.numero}/{p.totalParcelas}
                          {p.dataPagamento && (
                            <span className="ml-2 text-green-600">✓ Pago em {formatDataBR(p.dataPagamento)}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs font-medium">{formatCentavos(p.valor)}</td>
                        <td colSpan={3} />
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
            {filtradas.length} lançamento{filtradas.length !== 1 ? 's' : ''} · Total:{' '}
            <strong>{formatCentavos(filtradas.reduce((s, v) => s + v.valorTotal, 0))}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
