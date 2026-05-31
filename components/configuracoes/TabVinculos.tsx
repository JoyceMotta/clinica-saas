'use client';

import { useState, useEffect } from 'react';
import {
  listarServicos,
  listarDocumentoTemplates,
  listarDocsDeServico,
  vincularDocumentoAoServico,
  desvincularDocumentoDoServico,
  CATEGORIA_LABELS,
  CATEGORIA_CORES,
  type Servico,
  type DocumentoTemplate,
  type ServicoDocumento,
  type CategoriaDocumento,
} from '@/lib/local-storage-configuracoes';

// ─── Linha de documento com toggle vínculo e obrigatoriedade ─────────────────

function DocVinculoRow({
  template,
  vinculo,
  servicoId,
  onChange,
}: {
  template: DocumentoTemplate;
  vinculo: ServicoDocumento | undefined;
  servicoId: string;
  onChange: () => void;
}) {
  const cores = CATEGORIA_CORES[template.categoria];
  const vinculado = Boolean(vinculo);

  function handleToggleVinculo() {
    if (vinculado) {
      desvincularDocumentoDoServico(servicoId, template.id);
    } else {
      vincularDocumentoAoServico(servicoId, template.id, true);
    }
    onChange();
  }

  function handleToggleObrig() {
    if (!vinculo) return;
    vincularDocumentoAoServico(servicoId, template.id, !vinculo.obrigatorio);
    onChange();
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors border-b border-gray-50 last:border-0"
      style={{ backgroundColor: vinculado ? 'rgba(27,42,74,0.02)' : 'white' }}
    >
      {/* Checkbox vínculo */}
      <input
        type="checkbox"
        checked={vinculado}
        onChange={handleToggleVinculo}
        className="w-4 h-4 flex-shrink-0 cursor-pointer rounded"
        style={{ accentColor: '#1B2A4A' }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: cores.bg, color: cores.text }}
          >
            {CATEGORIA_LABELS[template.categoria]}
          </span>
          <p
            className="text-sm font-medium truncate"
            style={{ color: vinculado ? '#1B2A4A' : '#9CA3AF' }}
          >
            {template.titulo}
          </p>
        </div>
        {template.descricao && (
          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{template.descricao}</p>
        )}
      </div>

      {/* Toggle obrigatório/opcional */}
      {vinculado && (
        <button
          onClick={handleToggleObrig}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all"
          style={
            vinculo!.obrigatorio
              ? { backgroundColor: '#1B2A4A', color: 'white', borderColor: '#1B2A4A' }
              : { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#FDE68A' }
          }
          title="Clique para alternar obrigatório / opcional"
        >
          {vinculo!.obrigatorio ? '★ Obrigatório' : '☆ Opcional'}
        </button>
      )}
    </div>
  );
}

// ─── TabVinculos ──────────────────────────────────────────────────────────────

export default function TabVinculos() {
  const [servicos]          = useState(() => listarServicos().filter((s) => s.ativo));
  const [templates]         = useState(() => listarDocumentoTemplates().filter((t) => t.ativo));
  const [servicoId, setServicoId] = useState<string>(servicos[0]?.id ?? '');
  const [vinculos, setVinculos]   = useState<ServicoDocumento[]>([]);
  const [filtroCategoria, setFiltro] = useState<CategoriaDocumento | 'todas'>('todas');

  useEffect(() => {
    if (servicoId) setVinculos(listarDocsDeServico(servicoId));
  }, [servicoId]);

  function refresh() {
    setVinculos(listarDocsDeServico(servicoId));
  }

  // Agrupar templates por categoria
  const templatesFiltrados = templates.filter(
    (t) => filtroCategoria === 'todas' || t.categoria === filtroCategoria,
  );

  const porCategoria: Partial<Record<CategoriaDocumento, DocumentoTemplate[]>> = {};
  for (const t of templatesFiltrados) {
    if (!porCategoria[t.categoria]) porCategoria[t.categoria] = [];
    porCategoria[t.categoria]!.push(t);
  }

  const servicoAtual = servicos.find((s) => s.id === servicoId);
  const totalVinculados = vinculos.length;
  const totalObrig = vinculos.filter((v) => v.obrigatorio).length;
  const totalOpcional = vinculos.filter((v) => !v.obrigatorio).length;

  if (servicos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center space-y-2">
        <p className="text-3xl">🔧</p>
        <p className="text-sm font-semibold text-gray-500">Nenhum serviço ativo cadastrado.</p>
        <p className="text-xs text-gray-400">Cadastre serviços na aba Serviços primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Aviso sobre o fluxo */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs text-gray-600"
        style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}
      >
        <span className="flex-shrink-0 mt-0.5">💡</span>
        <span>
          Selecione um <strong>serviço</strong> e marque quais <strong>documentos</strong> ele exige.
          Use <strong>★ Obrigatório</strong> para documentos essenciais (sempre gerados) e{' '}
          <strong>☆ Opcional</strong> para documentos complementares (o profissional decide).
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ── Coluna esquerda: seleção de serviço ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Serviços</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[60vh] overflow-y-auto">
            {servicos.map((s) => {
              const docsServico = listarDocsDeServico(s.id);
              const active = s.id === servicoId;
              return (
                <button
                  key={s.id}
                  onClick={() => setServicoId(s.id)}
                  className="w-full text-left px-4 py-3 transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: active ? 'rgba(27,42,74,0.06)' : 'transparent',
                    borderLeft: active ? '3px solid #1B2A4A' : '3px solid transparent',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: active ? '#1B2A4A' : '#374151' }}>
                      {s.nome}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {docsServico.length === 0
                        ? 'Sem documentos'
                        : `${docsServico.filter((d) => d.obrigatorio).length} obrig. · ${docsServico.filter((d) => !d.obrigatorio).length} opcion.`
                      }
                    </p>
                  </div>
                  {docsServico.length > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#1B2A4A', color: 'white' }}
                    >
                      {docsServico.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Coluna direita: documentos do serviço selecionado ── */}
        <div className="md:col-span-2 space-y-3">

          {/* Header do painel de documentos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-3" style={{ backgroundColor: 'rgba(27,42,74,0.04)' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: '#1B2A4A' }}>
                  {servicoAtual?.nome ?? '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {totalVinculados === 0
                    ? 'Nenhum documento vinculado'
                    : `${totalObrig} obrigatório${totalObrig !== 1 ? 's' : ''} · ${totalOpcional} opcional${totalOpcional !== 1 ? 'is' : ''}`
                  }
                </p>
              </div>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltro(e.target.value as CategoriaDocumento | 'todas')}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
              >
                <option value="todas">Todas as categorias</option>
                {(Object.entries(CATEGORIA_LABELS) as [CategoriaDocumento, string][]).map(([cat, label]) => (
                  <option key={cat} value={cat}>{label}</option>
                ))}
              </select>
            </div>

            {/* Lista de documentos agrupados */}
            {templatesFiltrados.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Nenhum template para esta categoria.</div>
            ) : (
              <div>
                {(Object.entries(porCategoria) as [CategoriaDocumento, DocumentoTemplate[]][]).map(([cat, items]) => {
                  const cores = CATEGORIA_CORES[cat];
                  return (
                    <div key={cat}>
                      <div
                        className="px-4 py-1.5 flex items-center gap-1.5"
                        style={{ backgroundColor: cores.bg }}
                      >
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: cores.text, color: 'white' }}
                        >
                          {CATEGORIA_LABELS[cat]}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {items.filter((t) => vinculos.some((v) => v.documentoTemplateId === t.id)).length}/{items.length} vinculados
                        </span>
                      </div>
                      {items.map((t) => {
                        const vinculo = vinculos.find((v) => v.documentoTemplateId === t.id);
                        return (
                          <DocVinculoRow
                            key={t.id}
                            template={t}
                            vinculo={vinculo}
                            servicoId={servicoId}
                            onChange={refresh}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legenda */}
          <div
            className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl text-xs text-gray-500"
            style={{ backgroundColor: 'rgba(27,42,74,0.04)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-gray-300 inline-block" />
              Não vinculado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 inline-block" style={{ borderColor: '#1B2A4A', backgroundColor: 'rgba(27,42,74,0.15)' }} />
              Vinculado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: '#1B2A4A' }}>★ Obrig.</span>
              Sempre gerado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>☆ Opcion.</span>
              O profissional decide
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
