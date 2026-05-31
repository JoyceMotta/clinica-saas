'use client';

import { useState } from 'react';
import {
  listarProfissionais,
  listarEspecialidades,
  listarServicos,
  criarProfissional,
  atualizarProfissional,
  deletarProfissional,
  CONSELHOS_PREDEFINIDOS,
  UF_LIST,
  type Profissional,
  type Especialidade,
  type Servico,
} from '@/lib/local-storage-configuracoes';

// ─── Modal criar / editar ─────────────────────────────────────────────────────

function ProfModal({
  inicial,
  especialidades,
  servicos,
  onSave,
  onClose,
}: {
  inicial?: Profissional;
  especialidades: Especialidade[];
  servicos: Servico[];
  onSave: (data: Omit<Profissional, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [nome, setNome]                 = useState(inicial?.nome ?? '');
  const [especialidadeId, setEsp]       = useState(inicial?.especialidadeId ?? especialidades[0]?.id ?? '');
  const [numeroConselho, setNumero]     = useState(inicial?.numeroConselho ?? '');
  const [ufConselho, setUf]             = useState(inicial?.ufConselho ?? 'SP');
  const [servicoIds, setServicoIds]     = useState<string[]>(inicial?.servicoIds ?? []);
  const [ativo, setAtivo]               = useState(inicial?.ativo ?? true);
  const [erro, setErro]                 = useState('');

  const espAtual = especialidades.find((e) => e.id === especialidadeId);
  const conselho = espAtual ? CONSELHOS_PREDEFINIDOS.find((c) => c.id === espAtual.conselhoId) : undefined;

  // Filtra serviços: mostra multi-esp + os da especialidade selecionada
  const servicosFiltrados = servicos.filter(
    (s) => s.ativo && (s.especialidadeId === null || s.especialidadeId === especialidadeId),
  );

  function toggleServico(id: string) {
    setServicoIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return; }
    if (!especialidadeId) { setErro('Selecione a especialidade.'); return; }
    onSave({ nome: nome.trim(), especialidadeId, numeroConselho: numeroConselho.trim(), ufConselho, servicoIds, ativo });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
          <h3 className="font-bold text-white text-sm">
            {inicial ? 'Editar Profissional' : 'Novo Profissional'}
          </h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin">×</button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Nome */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nome completo *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Dr. Maria Silva"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              autoFocus
            />
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Especialidade *</label>
            <select
              value={especialidadeId}
              onChange={(e) => {
                setEsp(e.target.value);
                // Limpa serviços que não se aplicam à nova especialidade
                const novaEspId = e.target.value;
                setServicoIds((prev) =>
                  prev.filter((id) => {
                    const s = servicos.find((sv) => sv.id === id);
                    return s && (s.especialidadeId === null || s.especialidadeId === novaEspId);
                  }),
                );
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              {especialidades.filter((e) => e.ativo).map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </div>

          {/* Conselho + Número + UF */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Conselho</label>
              <div
                className="px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm font-semibold"
                style={{ color: '#1B2A4A' }}
              >
                {conselho?.sigla ?? '—'}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nº do registro</label>
              <input
                type="text"
                value={numeroConselho}
                onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">UF</label>
              <select
                value={ufConselho}
                onChange={(e) => setUf(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              >
                {UF_LIST.map((uf) => <option key={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {/* Preview da credencial */}
          {conselho && numeroConselho && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: 'rgba(27,42,74,0.05)', color: '#1B2A4A' }}
            >
              🪪 {conselho.sigla}-{ufConselho} {numeroConselho}
            </div>
          )}

          {/* Serviços */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
              Serviços realizados
            </label>
            {servicosFiltrados.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum serviço compatível com esta especialidade.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-3">
                {servicosFiltrados.map((s) => (
                  <label key={s.id} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={servicoIds.includes(s.id)}
                      onChange={() => toggleServico(s.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#1B2A4A' }}
                    />
                    <span className="text-sm text-gray-700">{s.nome}</span>
                    {s.especialidadeId === null && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                        Multi-esp.
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-600">Profissional ativo</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" className="px-5 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#1B2A4A' }}>
            {inicial ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── TabProfissionais ─────────────────────────────────────────────────────────

export default function TabProfissionais() {
  const [profissionais, setProfs]  = useState(() => listarProfissionais());
  const [especialidades]           = useState(() => listarEspecialidades());
  const [servicos]                 = useState(() => listarServicos());
  const [modal, setModal]          = useState<{ tipo: 'criar' | 'editar'; item?: Profissional } | null>(null);
  const [mostrarInativos, setMostrar] = useState(false);

  function refresh() { setProfs(listarProfissionais()); }

  function handleSave(data: Omit<Profissional, 'id' | 'createdAt'>) {
    if (modal?.tipo === 'editar' && modal.item) {
      atualizarProfissional(modal.item.id, data);
    } else {
      criarProfissional(data);
    }
    refresh();
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o profissional "${nome}"?`)) return;
    deletarProfissional(id);
    refresh();
  }

  function handleToggle(id: string, ativo: boolean) {
    atualizarProfissional(id, { ativo: !ativo });
    refresh();
  }

  const getEsp = (id: string) => especialidades.find((e) => e.id === id);
  const getConselho = (espId: string) => {
    const esp = getEsp(espId);
    return esp ? CONSELHOS_PREDEFINIDOS.find((c) => c.id === esp.conselhoId) : undefined;
  };

  const filtrados = profissionais.filter((p) => mostrarInativos || p.ativo);
  const ativos    = profissionais.filter((p) => p.ativo).length;
  const inativos  = profissionais.filter((p) => !p.ativo).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
            {ativos} profissional{ativos !== 1 ? 'is' : ''} ativo{ativos !== 1 ? 's' : ''}
          </span>
          {inativos > 0 && (
            <button onClick={() => setMostrar((v) => !v)} className="text-xs text-gray-400 underline underline-offset-2">
              {mostrarInativos ? 'Ocultar' : `+ ${inativos} inativos`}
            </button>
          )}
        </div>
        <button
          onClick={() => setModal({ tipo: 'criar' })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          + Novo profissional
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-4xl">👨‍⚕️</p>
            <p className="text-sm font-semibold text-gray-500">Nenhum profissional cadastrado</p>
            <p className="text-xs text-gray-400">
              Cadastre profissionais para vincular serviços e filtrar documentos automaticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtrados.map((p) => {
              const esp = getEsp(p.especialidadeId);
              const conselho = getConselho(p.especialidadeId);
              const nomeServicos = p.servicoIds
                .map((id) => servicos.find((s) => s.id === id)?.nome)
                .filter(Boolean) as string[];

              return (
                <div key={p.id} className="px-5 py-4 flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                    style={{ backgroundColor: esp?.cor ?? '#1B2A4A' }}
                  >
                    {p.nome.trim().split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: p.ativo ? '#1B2A4A' : '#9CA3AF' }}>
                        {p.nome}
                      </p>
                      {!p.ativo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Inativo</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {esp && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: esp.cor }}
                        >
                          {esp.nome}
                        </span>
                      )}
                      {conselho && p.numeroConselho && (
                        <span className="text-xs text-gray-400">
                          🪪 {conselho.sigla}-{p.ufConselho} {p.numeroConselho}
                        </span>
                      )}
                    </div>

                    {nomeServicos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {nomeServicos.map((n) => (
                          <span key={n} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(p.id, p.ativo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={p.ativo
                        ? { borderColor: '#E5E7EB', color: '#6B7280' }
                        : { borderColor: '#10B981', color: '#10B981' }
                      }
                    >
                      {p.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'editar', item: p })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.nome)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal && (
        <ProfModal
          inicial={modal.item}
          especialidades={especialidades}
          servicos={servicos}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
