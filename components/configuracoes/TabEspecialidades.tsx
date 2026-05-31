'use client';

import { useState } from 'react';
import {
  CONSELHOS_PREDEFINIDOS,
  listarEspecialidades,
  criarEspecialidade,
  atualizarEspecialidade,
  deletarEspecialidade,
  type Especialidade,
} from '@/lib/local-storage-configuracoes';

// ─── Paleta de cores disponíveis ─────────────────────────────────────────────

const CORES = [
  '#1B2A4A','#3B82F6','#10B981','#6366F1','#F59E0B',
  '#EC4899','#8B5CF6','#14B8A6','#EF4444','#F97316',
];

// ─── Modal de criação / edição ────────────────────────────────────────────────

function EspModal({
  inicial,
  onSave,
  onClose,
}: {
  inicial?: Especialidade;
  onSave: (data: Omit<Especialidade, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [nome, setNome]               = useState(inicial?.nome ?? '');
  const [conselhoId, setConselhoId]   = useState(inicial?.conselhoId ?? CONSELHOS_PREDEFINIDOS[0].id);
  const [cor, setCor]                 = useState(inicial?.cor ?? '#1B2A4A');
  const [ativo, setAtivo]             = useState(inicial?.ativo ?? true);
  const [erro, setErro]               = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return; }
    onSave({ nome: nome.trim(), conselhoId, cor, ativo });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1B2A4A' }}>
          <h3 className="font-bold text-white text-sm">
            {inicial ? 'Editar Especialidade' : 'Nova Especialidade'}
          </h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Medicina Estética, Dermatologia…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              autoFocus
            />
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Conselho regulador *</label>
            <select
              value={conselhoId}
              onChange={(e) => setConselhoId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              {CONSELHOS_PREDEFINIDOS.map((c) => (
                <option key={c.id} value={c.id}>{c.sigla} — {c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Cor do badge</label>
            <div className="flex flex-wrap gap-2">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: cor === c ? '#C9A84C' : 'transparent' }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: cor }}
              >
                Prévia da badge
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-600">Especialidade ativa</span>
          </label>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
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

// ─── TabEspecialidades ────────────────────────────────────────────────────────

export default function TabEspecialidades() {
  const [especialidades, setEsp] = useState(() => listarEspecialidades());
  const [modal, setModal]        = useState<{ tipo: 'criar' | 'editar'; item?: Especialidade } | null>(null);

  function refresh() { setEsp(listarEspecialidades()); }

  function handleSave(data: Omit<Especialidade, 'id' | 'createdAt'>) {
    if (modal?.tipo === 'editar' && modal.item) {
      atualizarEspecialidade(modal.item.id, data);
    } else {
      criarEspecialidade(data);
    }
    refresh();
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir a especialidade "${nome}"? Profissionais e serviços vinculados precisarão ser reconfigurados.`)) return;
    deletarEspecialidade(id);
    refresh();
  }

  const getConselho = (conselhoId: string) =>
    CONSELHOS_PREDEFINIDOS.find((c) => c.id === conselhoId);

  return (
    <div className="space-y-6">

      {/* ── Conselhos (readonly) ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Conselhos Profissionais — predefinidos
          </h3>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CONSELHOS_PREDEFINIDOS.map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
                style={{ backgroundColor: '#1B2A4A' }}
              >
                {c.sigla}
              </span>
              <p className="text-xs text-gray-600 leading-tight">{c.nome}</p>
            </div>
          ))}
        </div>
        <p className="px-5 pb-4 text-[10px] text-gray-400">
          Os conselhos são predefinidos pelo sistema e não podem ser editados.
        </p>
      </div>

      {/* ── Especialidades ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Especialidades</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1B2A4A', color: 'white' }}>
              {especialidades.length}
            </span>
          </div>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            + Nova especialidade
          </button>
        </div>

        {especialidades.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Nenhuma especialidade cadastrada.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {especialidades.map((esp) => {
              const conselho = getConselho(esp.conselhoId);
              return (
                <div key={esp.id} className="px-5 py-3.5 flex items-center gap-4">
                  {/* Badge colorida */}
                  <div
                    className="w-2.5 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: esp.cor }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>{esp.nome}</p>
                      {!esp.ativo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Inativa
                        </span>
                      )}
                    </div>
                    {conselho && (
                      <p className="text-xs text-gray-400 mt-0.5">{conselho.sigla} — {conselho.nome}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setModal({ tipo: 'editar', item: esp })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(esp.id, esp.nome)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50"
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

      {/* Modal */}
      {modal && (
        <EspModal
          inicial={modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
