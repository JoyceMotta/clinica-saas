'use client';

import { useState } from 'react';
import {
  listarDocumentoTemplates,
  criarDocumentoTemplate,
  atualizarDocumentoTemplate,
  deletarDocumentoTemplate,
  CATEGORIA_LABELS,
  CATEGORIA_CORES,
  type DocumentoTemplate,
  type CategoriaDocumento,
} from '@/lib/local-storage-configuracoes';

// ─── Modal criar / editar ─────────────────────────────────────────────────────

function DocModal({
  inicial,
  onSave,
  onClose,
}: {
  inicial?: DocumentoTemplate;
  onSave: (data: Omit<DocumentoTemplate, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [titulo, setTitulo]         = useState(inicial?.titulo ?? '');
  const [descricao, setDescricao]   = useState(inicial?.descricao ?? '');
  const [categoria, setCategoria]   = useState<CategoriaDocumento>(inicial?.categoria ?? 'tcle');
  const [ativo, setAtivo]           = useState(inicial?.ativo ?? true);
  const [erro, setErro]             = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) { setErro('Título é obrigatório.'); return; }
    onSave({ titulo: titulo.trim(), descricao: descricao.trim(), categoria, ativo });
    onClose();
  }

  const categorias = Object.entries(CATEGORIA_LABELS) as [CategoriaDocumento, string][];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1B2A4A' }}>
          <h3 className="font-bold text-white text-sm">
            {inicial ? 'Editar Template' : 'Novo Template de Documento'}
          </h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: TCLE — Toxina Botulínica"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              autoFocus
            />
            {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {categorias.map(([cat, label]) => {
                const cores = CATEGORIA_CORES[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all text-left"
                    style={{
                      borderColor: categoria === cat ? cores.text : '#E5E7EB',
                      backgroundColor: categoria === cat ? cores.bg : 'white',
                      color: cores.text,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cores.text }}
                    />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              placeholder="Para que serve este documento…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-gray-600">Template ativo</span>
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

// ─── TabDocumentosConfig ──────────────────────────────────────────────────────

export default function TabDocumentosConfig() {
  const [templates, setTemplates]       = useState(() => listarDocumentoTemplates());
  const [modal, setModal]               = useState<{ tipo: 'criar' | 'editar'; item?: DocumentoTemplate } | null>(null);
  const [filtroCategoria, setFiltro]    = useState<CategoriaDocumento | 'todas'>('todas');
  const [mostrarInativos, setMostrar]   = useState(false);

  function refresh() { setTemplates(listarDocumentoTemplates()); }

  function handleSave(data: Omit<DocumentoTemplate, 'id' | 'createdAt'>) {
    if (modal?.tipo === 'editar' && modal.item) {
      atualizarDocumentoTemplate(modal.item.id, data);
    } else {
      criarDocumentoTemplate(data);
    }
    refresh();
  }

  function handleDelete(id: string, titulo: string) {
    if (!confirm(`Excluir o template "${titulo}"? Os vínculos com serviços serão removidos.`)) return;
    deletarDocumentoTemplate(id);
    refresh();
  }

  function handleToggle(id: string, ativo: boolean) {
    atualizarDocumentoTemplate(id, { ativo: !ativo });
    refresh();
  }

  const categorias = Object.entries(CATEGORIA_LABELS) as [CategoriaDocumento, string][];

  const filtrados = templates.filter((t) => {
    if (!mostrarInativos && !t.ativo) return false;
    if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false;
    return true;
  });

  // Agrupar por categoria
  const porCategoria: Partial<Record<CategoriaDocumento, DocumentoTemplate[]>> = {};
  for (const t of filtrados) {
    if (!porCategoria[t.categoria]) porCategoria[t.categoria] = [];
    porCategoria[t.categoria]!.push(t);
  }

  const ativos   = templates.filter((t) => t.ativo).length;
  const inativos = templates.filter((t) => !t.ativo).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
            {ativos} template{ativos !== 1 ? 's' : ''} ativo{ativos !== 1 ? 's' : ''}
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
            value={filtroCategoria}
            onChange={(e) => setFiltro(e.target.value as CategoriaDocumento | 'todas')}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map(([cat, label]) => (
              <option key={cat} value={cat}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => setModal({ tipo: 'criar' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            + Novo template
          </button>
        </div>
      </div>

      {/* Lista agrupada por categoria */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          Nenhum template encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.entries(porCategoria) as [CategoriaDocumento, DocumentoTemplate[]][]).map(([cat, items]) => {
            const cores = CATEGORIA_CORES[cat];
            return (
              <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="px-5 py-2.5 flex items-center gap-2"
                  style={{ backgroundColor: cores.bg, borderBottom: `1px solid ${cores.bg}` }}
                >
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cores.text, color: 'white' }}
                  >
                    {CATEGORIA_LABELS[cat]}
                  </span>
                  <span className="text-xs text-gray-500">{items.length} template{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((t) => (
                    <div key={t.id} className="px-5 py-3.5 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: t.ativo ? '#1B2A4A' : '#9CA3AF' }}>
                            {t.titulo}
                          </p>
                          {!t.ativo && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Inativo</span>
                          )}
                        </div>
                        {t.descricao && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.descricao}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(t.id, t.ativo)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                          style={t.ativo
                            ? { borderColor: '#E5E7EB', color: '#6B7280' }
                            : { borderColor: '#10B981', color: '#10B981' }
                          }
                        >
                          {t.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => setModal({ tipo: 'editar', item: t })}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.titulo)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <DocModal
          inicial={modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
