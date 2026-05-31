'use client';

import { useEffect, useState } from 'react';
import {
  listarLancamentosCliente,
  criarLancamento,
  atualizarLancamento,
  deletarLancamento,
  totalGastoCliente,
  formatarMoeda,
  FORMA_LABELS,
  STATUS_PAG_LABELS,
  STATUS_PAG_COLORS,
  type LancamentoFinanceiro,
  type LancamentoInput,
  type FormaPagamento,
  type StatusPagamento,
} from '@/lib/local-storage-financeiro';

// ─── Formulário de novo lançamento ────────────────────────────────────────────

const FORM_VAZIO: Omit<LancamentoInput, 'clienteId'> = {
  data: new Date().toISOString().slice(0, 10),
  descricao: '',
  valor: 0,
  valorPago: 0,
  formaPagamento: 'pix',
  parcelas: 1,
  parcelaAtual: 1,
  status: 'pago',
  observacoes: '',
};

function FormLancamento({
  clienteId,
  onSave,
  onCancel,
}: {
  clienteId: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(FORM_VAZIO);
  const [valorStr, setValorStr] = useState('');
  const [valorPagoStr, setValorPagoStr] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function field(k: keyof typeof FORM_VAZIO, val: string | number) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  function parseMoeda(s: string): number {
    return Math.round(parseFloat(s.replace(',', '.').replace(/[^\d.]/g, '') || '0') * 100);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.descricao.trim()) return setErr('Informe o procedimento/serviço.');
    if (!v.data) return setErr('Informe a data.');
    const valor = parseMoeda(valorStr);
    const valorPago = parseMoeda(valorPagoStr);
    if (valor <= 0) return setErr('Informe o valor total (maior que zero).');
    setErr(null);
    criarLancamento({ ...v, clienteId, valor, valorPago });
    onSave();
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h4 className="font-bold text-sm" style={{ color: '#1B2A4A' }}>Novo Lançamento</h4>

      {err && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Data *</label>
          <input
            type="date"
            value={v.data}
            onChange={(e) => field('data', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Status *</label>
          <select
            value={v.status}
            onChange={(e) => field('status', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
          >
            {(Object.keys(STATUS_PAG_LABELS) as StatusPagamento[]).map((s) => (
              <option key={s} value={s}>{STATUS_PAG_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Procedimento / Serviço *</label>
        <input
          type="text"
          value={v.descricao}
          onChange={(e) => field('descricao', e.target.value)}
          placeholder="Ex: Limpeza de pele, Botox 20 unidades…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Valor Total (R$) *</label>
          <input
            type="text"
            inputMode="decimal"
            value={valorStr}
            onChange={(e) => setValorStr(e.target.value)}
            placeholder="0,00"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Valor Pago (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={valorPagoStr}
            onChange={(e) => setValorPagoStr(e.target.value)}
            placeholder="0,00"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Forma de Pagamento</label>
          <select
            value={v.formaPagamento}
            onChange={(e) => field('formaPagamento', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2"
          >
            {(Object.keys(FORMA_LABELS) as FormaPagamento[]).map((f) => (
              <option key={f} value={f}>{FORMA_LABELS[f]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Parcelas</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={24}
              value={v.parcelaAtual}
              onChange={(e) => field('parcelaAtual', parseInt(e.target.value) || 1)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="atual"
            />
            <span className="self-center text-gray-400 text-sm">/</span>
            <input
              type="number"
              min={1}
              max={24}
              value={v.parcelas}
              onChange={(e) => field('parcelas', parseInt(e.target.value) || 1)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="total"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Observações</label>
        <textarea
          value={v.observacoes}
          onChange={(e) => field('observacoes', e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
          placeholder="Opcional"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Linha de lançamento ──────────────────────────────────────────────────────

function LancamentoRow({
  lan,
  onDelete,
}: {
  lan: LancamentoFinanceiro;
  onDelete: (id: string) => void;
}) {
  const cfg = STATUS_PAG_COLORS[lan.status];
  const dataFmt = new Date(`${lan.data}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
            {lan.descricao}
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.text }}
          >
            {STATUS_PAG_LABELS[lan.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-gray-500">
          <span>📅 {dataFmt}</span>
          <span>💳 {FORMA_LABELS[lan.formaPagamento]}</span>
          {lan.parcelas && lan.parcelas > 1 && (
            <span>📄 Parcela {lan.parcelaAtual}/{lan.parcelas}</span>
          )}
        </div>
        {lan.observacoes && (
          <p className="mt-1 text-xs text-gray-400 italic">{lan.observacoes}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-bold" style={{ color: '#1B2A4A' }}>
          {formatarMoeda(lan.valor)}
        </span>
        {lan.valorPago !== lan.valor && (
          <span className="text-xs text-gray-400">
            pago: {formatarMoeda(lan.valorPago)}
          </span>
        )}
        <button
          onClick={() => onDelete(lan.id)}
          className="mt-1 text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          excluir
        </button>
      </div>
    </div>
  );
}

// ─── Aba Financeiro ───────────────────────────────────────────────────────────

export default function TabFinanceiro({ clienteId }: { clienteId: string }) {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [novoAberto, setNovoAberto] = useState(false);

  function refresh() {
    setLancamentos(listarLancamentosCliente(clienteId));
  }

  useEffect(() => { refresh(); }, [clienteId]);

  function handleSave() {
    refresh();
    setNovoAberto(false);
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento?')) return;
    deletarLancamento(id);
    refresh();
  }

  const total = totalGastoCliente(clienteId);
  const pendente = lancamentos
    .filter((l) => l.status === 'pendente' || l.status === 'parcial')
    .reduce((acc, l) => acc + (l.valor - l.valorPago), 0);

  return (
    <div className="space-y-5">

      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Gasto</p>
          <p className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>{formatarMoeda(total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{lancamentos.filter(l => l.status !== 'cancelado').length} procedimento(s)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saldo Pendente</p>
          <p className="text-2xl font-bold" style={{ color: pendente > 0 ? '#DC2626' : '#16A34A' }}>
            {formatarMoeda(pendente)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {pendente > 0 ? 'valores em aberto' : 'tudo em dia ✅'}
          </p>
        </div>
      </div>

      {/* Botão + form */}
      {!novoAberto ? (
        <button
          onClick={() => setNovoAberto(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Lançamento
        </button>
      ) : (
        <FormLancamento clienteId={clienteId} onSave={handleSave} onCancel={() => setNovoAberto(false)} />
      )}

      {/* Histórico */}
      {lancamentos.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Histórico Financeiro
            </h3>
          </div>
          {lancamentos.map((l) => (
            <LancamentoRow key={l.id} lan={l} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-3xl mb-3">💰</p>
          <p className="text-sm font-semibold text-gray-500">Nenhum lançamento registrado</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Novo Lançamento" para registrar.</p>
        </div>
      )}

    </div>
  );
}
