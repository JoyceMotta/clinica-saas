'use client';

import { useState } from 'react';
import {
  listarServicos,
  listarEspecialidades,
  criarServico,
  atualizarServico,
  deletarServico,
  type Servico,
  type Especialidade,
} from '@/lib/local-storage-configuracoes';

// ─── Modal criar / editar ─────────────────────────────────────────────────────

function ServicoModal({
  inicial,
  especialidades,
  onSave,
  onClose,
}: {
  inicial?: Servico;
  especialidades: Especialidade[];
  onSave: (data: Omit<Servico, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [nome, setNome]               = useState(inicial?.nome ?? '');
  const [descricao, setDescricao]     = useState(inicial?.descricao ?? '');
  const [especialidadeId, setEsp]     = useState<string | null>(inicial?.especialidadeId ?? null);
  const [ativo, setAtivo]             = useState(inicial?.ativo ?? true);
  const [erro, setErro]               = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return; }
    onSave({ nome: nome.trim(), descricao: descricao.trim(), especialidadeId, ativo });
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
            {inicial ? 'Editar Serviço' : 'Novo Serviço'}
          </h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Toxina Botulínica, Clareamento Dental…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              autoFocus
            />
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              placeholder="Breve descrição do serviço…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              Especialidade vinculada
            </label>
            <select
              value={especialidadeId ?? ''}
              onChange={(e) => setEsp(e.target.value || null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="">— Multi-especialidade / sem vínculo —</option>
              {especialidades.filter((e) => e.ativo).map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Deixe em branco se o serviço pode ser realizado por múltiplas especialidades.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-600">Serviço ativo</span>
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

// ─── TabServicos ──────────────────────────────────────────────────────────────

export default function TabServicos() {
  const [servicos, setServicos]         = useState(() => listarServicos());
  const [especialidades]                = useState(() => listarEspecialidades());
  const [modal, setModal]               = useState<{ tipo: 'criar' | 'editar'; item?: Servico } | null>(null);
  const [filtroEsp, setFiltroEsp]       = useState<string>('');
  const [mostrarInativos, setMostrar]   = useState(false);

  function refresh() { setServicos(listarServicos()); }

  function handleSave(data: Omit<Servico, 'id' | 'createdAt'>) {
    if (modal?.tipo === 'editar' && modal.item) {
      atualizarServico(modal.item.id, data);
    } else {
      criarServico(data);
    }
    refresh();
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o serviço "${nome}"? Os vínculos com documentos também serão removidos.`)) return;
    deletarServico(id);
    refresh();
  }

  function handleToggleAtivo(id: string, ativo: boolean) {
    atualizarServico(id, { ativo: !ativo });
    refresh();
  }

  const getEsp = (espId: string | null) => especialidades.find((e) => e.id === espId);

  const servicosFiltrados = servicos.filter((s) => {
    if (!mostrarInativos && !s.ativo) return false;
    if (filtroEsp && s.especialidadeId !== filtroEsp) return false;
    return true;
  });

  const ativos   = servicos.filter((s) => s.ativo).length;
  const inativos = servicos.filter((s) => !s.ativo).length;

  return (
    <div className="space-y-5">

      {/* Header + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
            {ativos} serviço{ativos !== 1 ? 's' : ''} ativo{ativos !== 1 ? 's' : ''}
          </span>
          {inativos > 0 && (
            <button
              onClick={() => setMostrar((v) => !v)}
              className="text-xs text-gray-400 underline underline-offset-2"
            >
              {mostrarInativos ? 'Ocultar' : `+ ${inativos} inativos`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroEsp}
            onChange={(e) => setFiltroEsp(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value="">Todas as especialidades</option>
            {especialidades.filter((e) => e.ativo).map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            + Novo serviço
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {servicosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {filtroEsp ? 'Nenhum serviço para esta especialidade.' : 'Nenhum serviço cadastrado.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {servicosFiltrados.map((s) => {
              const esp = getEsp(s.especialidadeId);
              return (
                <div key={s.id} className="px-5 py-3.5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: s.ativo ? '#1B2A4A' : '#9CA3AF' }}>
                        {s.nome}
                      </p>
                      {!s.ativo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Inativo</span>
                      )}
                      {esp && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: esp.cor }}
                        >
                          {esp.nome}
                        </span>
                      )}
                      {!esp && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Multi-esp.
                        </span>
                      )}
                    </div>
                    {s.descricao && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{s.descricao}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleAtivo(s.id, s.ativo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={s.ativo
                        ? { borderColor: '#E5E7EB', color: '#6B7280' }
                        : { borderColor: '#10B981', color: '#10B981' }
                      }
                    >
                      {s.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'editar', item: s })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.nome)}
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
        <ServicoModal
          inicial={modal.item}
          especialidades={especialidades}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
