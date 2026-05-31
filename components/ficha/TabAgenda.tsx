'use client';

import { useEffect, useState } from 'react';
import {
  listarAgendamentosCliente,
  criarAgendamento,
  atualizarAgendamento,
  deletarAgendamento,
  STATUS_LABELS,
  STATUS_COLORS,
  type Agendamento,
  type AgendamentoInput,
  type StatusAgendamento,
} from '@/lib/local-storage-agendamentos';

// ─── Formulário de novo agendamento ──────────────────────────────────────────

const FORM_VAZIO: Omit<AgendamentoInput, 'clienteId'> = {
  data: '',
  hora: '',
  procedimento: '',
  profissional: '',
  status: 'agendado',
  observacoes: '',
};

function FormAgendamento({
  clienteId,
  onSave,
  onCancel,
}: {
  clienteId: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(FORM_VAZIO);
  const [err, setErr] = useState<string | null>(null);

  function field(k: keyof typeof FORM_VAZIO, val: string) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.data) return setErr('Informe a data.');
    if (!v.hora) return setErr('Informe o horário.');
    if (!v.procedimento.trim()) return setErr('Informe o procedimento.');
    if (!v.profissional.trim()) return setErr('Informe o profissional.');
    setErr(null);
    criarAgendamento({ ...v, clienteId });
    onSave();
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h4 className="font-bold text-sm" style={{ color: '#1B2A4A' }}>Novo Agendamento</h4>

      {err && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Data *</label>
          <input
            type="date"
            value={v.data}
            onChange={(e) => field('data', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#1B2A4A' } as React.CSSProperties}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Horário *</label>
          <input
            type="time"
            value={v.hora}
            onChange={(e) => field('hora', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Procedimento *</label>
        <input
          type="text"
          value={v.procedimento}
          onChange={(e) => field('procedimento', e.target.value)}
          placeholder="Ex: Limpeza de pele, Botox, Preenchimento…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Profissional *</label>
        <input
          type="text"
          value={v.profissional}
          onChange={(e) => field('profissional', e.target.value)}
          placeholder="Nome do profissional responsável"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
        <select
          value={v.status}
          onChange={(e) => field('status', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
        >
          {(Object.keys(STATUS_LABELS) as StatusAgendamento[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Observações</label>
        <textarea
          value={v.observacoes}
          onChange={(e) => field('observacoes', e.target.value)}
          rows={2}
          placeholder="Informações adicionais (opcional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none"
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

// ─── Linha de agendamento ─────────────────────────────────────────────────────

function AgendamentoRow({
  ag,
  onStatusChange,
  onDelete,
}: {
  ag: Agendamento;
  onStatusChange: (id: string, s: StatusAgendamento) => void;
  onDelete: (id: string) => void;
}) {
  const cores = STATUS_COLORS[ag.status];
  const dataFmt = new Date(`${ag.data}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold" style={{ color: '#1B2A4A' }}>
            {ag.procedimento}
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: cores.bg, color: cores.text }}
          >
            {STATUS_LABELS[ag.status]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-gray-500">
          <span>📅 {dataFmt} às {ag.hora}</span>
          <span>👤 {ag.profissional}</span>
        </div>
        {ag.observacoes && (
          <p className="mt-1 text-xs text-gray-400 italic">{ag.observacoes}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <select
          value={ag.status}
          onChange={(e) => onStatusChange(ag.id, e.target.value as StatusAgendamento)}
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1"
        >
          {(Object.keys(STATUS_LABELS) as StatusAgendamento[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={() => onDelete(ag.id)}
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
          title="Excluir agendamento"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Aba Agenda ───────────────────────────────────────────────────────────────

export default function TabAgenda({ clienteId }: { clienteId: string }) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [novoAberto, setNovoAberto] = useState(false);

  function refresh() {
    setAgendamentos(listarAgendamentosCliente(clienteId));
  }

  useEffect(() => { refresh(); }, [clienteId]);

  function handleSave() {
    refresh();
    setNovoAberto(false);
  }

  function handleStatusChange(id: string, status: StatusAgendamento) {
    atualizarAgendamento(id, { status });
    refresh();
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este agendamento?')) return;
    deletarAgendamento(id);
    refresh();
  }

  const futuros  = agendamentos.filter((a) => a.data >= new Date().toISOString().slice(0, 10) && a.status !== 'cancelado');
  const passados = agendamentos.filter((a) => a.data < new Date().toISOString().slice(0, 10) || a.status === 'realizado' || a.status === 'faltou' || a.status === 'cancelado');

  return (
    <div className="space-y-5">

      {/* Botão + formulário */}
      {!novoAberto ? (
        <button
          onClick={() => setNovoAberto(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo Agendamento
        </button>
      ) : (
        <FormAgendamento clienteId={clienteId} onSave={handleSave} onCancel={() => setNovoAberto(false)} />
      )}

      {/* Próximos */}
      {futuros.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Próximos / Confirmados
            </h3>
          </div>
          {futuros.map((ag) => (
            <AgendamentoRow
              key={ag.id}
              ag={ag}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Histórico */}
      {passados.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Histórico de Agendamentos
            </h3>
          </div>
          {passados.map((ag) => (
            <AgendamentoRow
              key={ag.id}
              ag={ag}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {agendamentos.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-sm font-semibold text-gray-500">Nenhum agendamento registrado</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Novo Agendamento" para começar.</p>
        </div>
      )}

    </div>
  );
}
