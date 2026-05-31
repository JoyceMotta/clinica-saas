'use client';

import { useEffect, useState } from 'react';
import {
  listarPacotes,
  listarItens,
  criarPacote,
  atualizarPacote,
  deletarPacote,
  formatReais,
  type PacoteCatalogo,
  type ItemCatalogo,
} from '@/lib/local-storage-catalogo';

// ─── Modal Pacote ─────────────────────────────────────────────────────────────

function ModalPacote({
  inicial,
  itensDisponiveis,
  onClose,
  onSaved,
}: {
  inicial?: PacoteCatalogo;
  itensDisponiveis: ItemCatalogo[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome]           = useState(inicial?.nome ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [itensIds, setItensIds]   = useState<string[]>(inicial?.itensIds ?? []);
  const [vlPkt, setVlPkt]         = useState(
    inicial?.valorPacote ? (inicial.valorPacote / 100).toFixed(2).replace('.', ',') : '',
  );
  const [ativo, setAtivo]         = useState(inicial?.ativo ?? true);
  const [erro, setErro]           = useState('');

  function toggleItem(id: string) {
    setItensIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return; }
    if (itensIds.length === 0) { setErro('Selecione ao menos um item.'); return; }
    const s = vlPkt.trim();
    const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
    const n = parseFloat(normalized);
    if (isNaN(n) || n <= 0) { setErro('Informe o valor do pacote.'); return; }

    const data: Omit<PacoteCatalogo, 'id' | 'createdAt'> = {
      nome:         nome.trim(),
      descricao:    descricao.trim(),
      itensIds,
      valorPacote:  Math.round(n * 100),
      ativo,
    };

    if (inicial) {
      atualizarPacote(inicial.id, data);
    } else {
      criarPacote(data);
    }
    onSaved();
    onClose();
  }

  const itensSelecionados = itensDisponiveis.filter((i) => itensIds.includes(i.id));
  const somaUnitarios    = itensSelecionados.reduce((acc, i) => acc + i.valorUnitario, 0);
  const s2               = vlPkt.trim();
  const n2               = parseFloat(s2.includes(',') ? s2.replace(/\./g, '').replace(',', '.') : s2);
  const vlPktNum         = isNaN(n2) ? 0 : Math.round(n2 * 100);
  const economia         = somaUnitarios > 0 && vlPktNum > 0 ? somaUnitarios - vlPktNum : 0;
  const percentEcon      = somaUnitarios > 0 ? Math.round((economia / somaUnitarios) * 100) : 0;

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';
  const labelCls = 'block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          <h3 className="font-bold text-white text-sm">
            {inicial ? 'Editar Pacote' : 'Criar Pacote'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl font-thin leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          <div>
            <label className={labelCls}>Nome do pacote *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputCls}
              placeholder="Ex: Protocolo Harmonização Completa"
              autoFocus
            />
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>

          <div>
            <label className={labelCls}>Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className={inputCls + ' resize-none'}
              placeholder="Descreva o que está incluído no pacote..."
            />
          </div>

          {/* Seleção de itens */}
          <div>
            <label className={labelCls}>Itens incluídos *</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              {itensDisponiveis.filter((i) => i.ativo).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum item ativo no catálogo.</p>
              ) : (
                itensDisponiveis
                  .filter((i) => i.ativo)
                  .map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={itensIds.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="w-4 h-4 rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.nome}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-500 flex-shrink-0">
                        {formatReais(item.valorUnitario)}
                      </span>
                    </label>
                  ))
              )}
            </div>
          </div>

          {/* Resumo selecionados */}
          {itensSelecionados.length > 0 && (
            <div
              className="rounded-lg p-3 text-sm border"
              style={{ backgroundColor: '#F8F9FB', borderColor: 'rgba(27,42,74,0.1)' }}
            >
              <p className="text-xs text-gray-500 mb-1">
                {itensSelecionados.length} item{itensSelecionados.length !== 1 ? 'ns' : ''} selecionado{itensSelecionados.length !== 1 ? 's' : ''} — soma:
              </p>
              <p className="font-bold" style={{ color: '#1B2A4A' }}>
                {formatReais(somaUnitarios)}
              </p>
            </div>
          )}

          {/* Valor do pacote */}
          <div>
            <label className={labelCls}>Valor do pacote (R$) *</label>
            <input
              type="text"
              inputMode="decimal"
              value={vlPkt}
              onChange={(e) => setVlPkt(e.target.value)}
              className={inputCls}
              placeholder="Ex: 2.500,00"
            />
            {economia > 0 && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                Economia de {formatReais(economia)} ({percentEcon}%) em relação à soma dos itens.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-600">Pacote ativo</span>
          </label>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 justify-end border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            {inicial ? 'Salvar alterações' : 'Criar pacote'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── TabPacotes ───────────────────────────────────────────────────────────────

export default function TabPacotes({
  refreshKey,
  onRefresh,
}: {
  refreshKey: number;
  onRefresh: () => void;
}) {
  const [pacotes, setPacotes] = useState<PacoteCatalogo[]>([]);
  const [itens, setItens]     = useState<ItemCatalogo[]>([]);
  const [modal, setModal]     = useState<{ tipo: 'criar' | 'editar'; pacote?: PacoteCatalogo } | null>(null);

  useEffect(() => {
    setPacotes(listarPacotes());
    setItens(listarItens());
  }, [refreshKey]);

  function refresh() {
    setPacotes(listarPacotes());
    setItens(listarItens());
    onRefresh();
  }

  function handleToggleAtivo(id: string, ativo: boolean) {
    atualizarPacote(id, { ativo: !ativo });
    refresh();
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o pacote "${nome}"?`)) return;
    deletarPacote(id);
    refresh();
  }

  const ativos = pacotes.filter((p) => p.ativo).length;

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
          {ativos} pacote{ativos !== 1 ? 's' : ''} ativo{ativos !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setModal({ tipo: 'criar' })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 shadow-sm transition-opacity"
          style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
        >
          <span className="text-base leading-none">+</span>
          Criar Pacote
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {pacotes.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Nenhum pacote criado. Clique em "+ Criar Pacote" para começar.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pacotes.map((pkt) => {
              const itensDoPacote  = itens.filter((i) => pkt.itensIds.includes(i.id));
              const somaUnitarios  = itensDoPacote.reduce((acc, i) => acc + i.valorUnitario, 0);
              const economia       = somaUnitarios > 0 ? somaUnitarios - pkt.valorPacote : 0;
              const percentEcon    = somaUnitarios > 0 ? Math.round((economia / somaUnitarios) * 100) : 0;

              return (
                <div key={pkt.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">

                    {/* Nome */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: pkt.ativo ? '#1B2A4A' : '#9CA3AF' }}
                      >
                        {pkt.nome}
                      </p>
                      {!pkt.ativo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Descrição */}
                    {pkt.descricao && (
                      <p className="text-xs text-gray-400 mt-0.5">{pkt.descricao}</p>
                    )}

                    {/* Itens incluídos */}
                    {itensDoPacote.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {itensDoPacote.map((item) => (
                          <span
                            key={item.id}
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8' }}
                          >
                            {item.nome}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Valores */}
                    <div className="flex items-center flex-wrap gap-4 mt-2 text-xs">
                      {somaUnitarios > 0 && (
                        <span className="text-gray-400">
                          Soma:{' '}
                          <span className="line-through">{formatReais(somaUnitarios)}</span>
                        </span>
                      )}
                      <span className="font-bold text-sm" style={{ color: '#C9A84C' }}>
                        Pacote: {formatReais(pkt.valorPacote)}
                      </span>
                      {economia > 0 && (
                        <span className="font-semibold text-green-600">
                          Economia {formatReais(economia)} ({percentEcon}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => handleToggleAtivo(pkt.id, pkt.ativo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={
                        pkt.ativo
                          ? { borderColor: '#E5E7EB', color: '#6B7280' }
                          : { borderColor: '#10B981', color: '#10B981' }
                      }
                    >
                      {pkt.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'editar', pacote: pkt })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(pkt.id, pkt.nome)}
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
        <ModalPacote
          inicial={modal.pacote}
          itensDisponiveis={itens}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
