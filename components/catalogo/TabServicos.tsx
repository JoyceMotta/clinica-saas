'use client';

import { useEffect, useState } from 'react';
import {
  listarItens,
  atualizarItem,
  deletarItem,
  formatReais,
  type ItemCatalogo,
  type CategoriaItem,
  CATEGORIA_LABELS,
  FORMA_LABELS,
} from '@/lib/local-storage-catalogo';
import ModalNovoItem from './ModalNovoItem';

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const CATEGORIA_CORES: Record<CategoriaItem, { bg: string; text: string }> = {
  consulta:       { bg: '#EFF6FF', text: '#1D4ED8' },
  procedimento:   { bg: '#FDF4FF', text: '#9333EA' },
  produto_fisico: { bg: '#F0FDF4', text: '#16A34A' },
  pacote_sessoes: { bg: '#FEF3C7', text: '#D97706' },
};

const CATEGORIAS_FILTRO: { value: '' | CategoriaItem; label: string }[] = [
  { value: '',               label: 'Todas as categorias' },
  { value: 'consulta',       label: 'Consulta' },
  { value: 'procedimento',   label: 'Procedimento Estético' },
  { value: 'produto_fisico', label: 'Produto Físico' },
  { value: 'pacote_sessoes', label: 'Pacote de Sessões' },
];

// ─── TabServicos ──────────────────────────────────────────────────────────────

export default function TabServicos({
  refreshKey,
  onRefresh,
}: {
  refreshKey: number;
  onRefresh: () => void;
}) {
  const [itens, setItens]               = useState<ItemCatalogo[]>([]);
  const [filtroCategoria, setFiltro]    = useState<'' | CategoriaItem>('');
  const [mostrarInativos, setMostrar]   = useState(false);
  const [modal, setModal]               = useState<{ tipo: 'criar' | 'editar'; item?: ItemCatalogo } | null>(null);

  useEffect(() => {
    setItens(listarItens());
  }, [refreshKey]);

  function refresh() {
    setItens(listarItens());
    onRefresh();
  }

  function handleToggleAtivo(id: string, ativo: boolean) {
    atualizarItem(id, { ativo: !ativo });
    refresh();
  }

  function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}" do catálogo?`)) return;
    deletarItem(id);
    refresh();
  }

  const itensFiltrados = itens.filter((item) => {
    if (!mostrarInativos && !item.ativo) return false;
    if (filtroCategoria && item.categoria !== filtroCategoria) return false;
    return true;
  });

  const ativos   = itens.filter((i) => i.ativo).length;
  const inativos = itens.filter((i) => !i.ativo).length;

  return (
    <div className="space-y-5">

      {/* Barra de controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
            {ativos} item{ativos !== 1 ? 'ns' : ''} ativo{ativos !== 1 ? 's' : ''}
          </span>
          {inativos > 0 && (
            <button
              onClick={() => setMostrar((v) => !v)}
              className="text-xs text-gray-400 underline underline-offset-2"
            >
              {mostrarInativos ? 'Ocultar inativos' : `+ ${inativos} inativo${inativos !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltro(e.target.value as '' | CategoriaItem)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
          >
            {CATEGORIAS_FILTRO.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 shadow-sm transition-opacity"
            style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
          >
            <span className="text-base leading-none">+</span>
            Novo Item
          </button>
        </div>
      </div>

      {/* Lista de itens */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {itensFiltrados.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            {filtroCategoria
              ? 'Nenhum item nesta categoria.'
              : 'Nenhum item no catálogo. Clique em "+ Novo Item" para começar.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {itensFiltrados.map((item) => {
              const cores = CATEGORIA_CORES[item.categoria];
              return (
                <div key={item.id} className="px-5 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">

                    {/* Nome + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: item.ativo ? '#1B2A4A' : '#9CA3AF' }}
                      >
                        {item.nome}
                      </p>
                      {!item.ativo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          Inativo
                        </span>
                      )}
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: cores.bg, color: cores.text }}
                      >
                        {CATEGORIA_LABELS[item.categoria]}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {item.tipoFiscal === 'servico' ? 'NFS-e' : 'NF-e'}
                      </span>
                    </div>

                    {/* Valores */}
                    <div className="flex items-center flex-wrap gap-3 mt-1.5 text-xs">
                      <span className="font-bold text-sm" style={{ color: '#1B2A4A' }}>
                        {formatReais(item.valorUnitario)}
                      </span>
                      {item.valorPacote && (
                        <span className="text-gray-400">
                          Pacote:{' '}
                          <span className="font-semibold text-purple-700">
                            {formatReais(item.valorPacote)}
                          </span>
                        </span>
                      )}
                      {item.descontoPix != null && item.descontoPix > 0 && (
                        <span className="font-medium text-green-600">PIX -{item.descontoPix}%</span>
                      )}
                      {item.intervaloRecompra && (
                        <span className="text-gray-400">♻️ {item.intervaloRecompra}d</span>
                      )}
                    </div>

                    {/* Formas de pagamento */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.formasPagamento.map((f) => (
                        <span
                          key={f}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 text-gray-500"
                        >
                          {FORMA_LABELS[f]}
                          {item.parcelamentoMaximo[f] ? ` ${item.parcelamentoMaximo[f]}x` : ''}
                        </span>
                      ))}
                    </div>

                    {/* Insumos */}
                    {item.insumos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.insumos.map((ins, idx) => (
                          <span key={idx} className="text-[10px] text-gray-400 italic">
                            {ins.nome} ({ins.quantidade} {ins.unidade})
                            {idx < item.insumos.length - 1 ? ' ·' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => handleToggleAtivo(item.id, item.ativo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={
                        item.ativo
                          ? { borderColor: '#E5E7EB', color: '#6B7280' }
                          : { borderColor: '#10B981', color: '#10B981' }
                      }
                    >
                      {item.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'editar', item })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.nome)}
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
        <ModalNovoItem
          inicial={modal.item}
          onClose={() => setModal(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
