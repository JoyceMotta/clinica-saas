'use client';

import { useEffect, useState } from 'react';
import {
  listarDocumentosContextuais,
  gerarDocContextual,
  marcarAssinadoContextual,
  resetarDocContextual,
  type DocumentoContextual,
  type StatusDocumento,
} from '@/lib/local-storage-documentos';
import {
  matchServicosPorProcedimento,
  listarDocsDeServico,
  listarDocumentoTemplates,
  CATEGORIA_CORES,
  CATEGORIA_LABELS,
  type Servico,
  type DocumentoTemplate,
  type ServicoDocumento,
} from '@/lib/local-storage-configuracoes';
import { listarAgendamentosCliente } from '@/lib/local-storage-agendamentos';

// ─── Helpers de status ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusDocumento, { label: string; icon: string; bg: string; text: string }> = {
  nao_gerado: { label: 'Não gerado',  icon: '➕', bg: '#F3F4F6', text: '#6B7280' },
  pendente:   { label: 'Pendente',    icon: '⏳', bg: '#FFFBEB', text: '#D97706' },
  assinado:   { label: 'Assinado',    icon: '✅', bg: '#F0FDF4', text: '#16A34A' },
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Linha de documento contextual ───────────────────────────────────────────

function DocContextualRow({
  doc,
  template,
  vinculo,
  onGerar,
  onAssinar,
  onReset,
}: {
  doc: DocumentoContextual;
  template: DocumentoTemplate;
  vinculo: ServicoDocumento;
  onGerar: (id: string) => void;
  onAssinar: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const cfg   = STATUS_CONFIG[doc.status];
  const cores = CATEGORIA_CORES[template.categoria];

  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-50 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge obrigatório / opcional */}
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={vinculo.obrigatorio
              ? { backgroundColor: '#1B2A4A', color: 'white' }
              : { backgroundColor: '#FEF3C7', color: '#D97706' }
            }
          >
            {vinculo.obrigatorio ? '★ Obrig.' : '☆ Opcion.'}
          </span>

          {/* Categoria */}
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: cores.bg, color: cores.text }}
          >
            {CATEGORIA_LABELS[template.categoria]}
          </span>

          {/* Título */}
          <span className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
            {template.titulo}
          </span>

          {/* Status */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.text }}
          >
            {cfg.icon} {cfg.label}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
          {template.descricao && <span className="italic">{template.descricao}</span>}
          {doc.dataGeracao    && <span>Gerado: {formatDateTime(doc.dataGeracao)}</span>}
          {doc.dataAssinatura && <span>Assinado: {formatDateTime(doc.dataAssinatura)}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        {doc.status !== 'nao_gerado' && (
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={() => alert('Visualização PDF em breve.')}
          >
            Visualizar
          </button>
        )}
        {doc.status === 'nao_gerado' && (
          <button
            onClick={() => onGerar(doc.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            ➕ Gerar
          </button>
        )}
        {doc.status === 'pendente' && (
          <>
            <button
              onClick={() => onAssinar(doc.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: '#16A34A' }}
            >
              ✅ Marcar assinado
            </button>
            <button
              onClick={() => onGerar(doc.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:opacity-90"
              style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
            >
              ↩ Reenviar
            </button>
          </>
        )}
        {doc.status === 'assinado' && (
          <>
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => alert('Download PDF em breve.')}
            >
              ⬇ PDF
            </button>
            <button
              onClick={() => onReset(doc.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50"
            >
              Resetar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Estrutura derivada por serviço ──────────────────────────────────────────

interface ServicoComDocs {
  servico: Servico;
  vinculos: {
    vinculo: ServicoDocumento;
    template: DocumentoTemplate;
    doc: DocumentoContextual;
  }[];
}

// ─── TabDocumentos ────────────────────────────────────────────────────────────

export default function TabDocumentos({ clienteId }: { clienteId: string }) {
  const [servicosDocs, setServicoDocs] = useState<ServicoComDocs[]>([]);
  const [procedimentos, setProcedimentos] = useState<string[]>([]);
  const [semVinculo, setSemVinculo] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // 1. Pegar procedimentos dos agendamentos
    const ags = listarAgendamentosCliente(clienteId);
    const procs = [...new Set(ags.map((a: { procedimento: string }) => a.procedimento).filter(Boolean))];
    setProcedimentos(procs);

    if (procs.length === 0) { setSemVinculo(false); return; }

    // 2. Encontrar serviços compatíveis
    const servicos = matchServicosPorProcedimento(procs);
    if (servicos.length === 0) { setSemVinculo(true); return; }
    setSemVinculo(false);

    // 3. Para cada serviço, montar estrutura com templates + docs
    const templates = listarDocumentoTemplates();
    const resultado: ServicoComDocs[] = servicos.map((s) => {
      const vinculos = listarDocsDeServico(s.id);
      // Garantir que o template existe e está ativo
      const vincCompletos = vinculos
        .map((v) => {
          const template = templates.find((t) => t.id === v.documentoTemplateId && t.ativo);
          return template ? { vinculo: v, template } : null;
        })
        .filter((x): x is { vinculo: ServicoDocumento; template: DocumentoTemplate } => x !== null);

      // Criar/obter DocumentoContextual para cada
      const templateIds = vincCompletos.map((v) => v.template.id);
      const docs = listarDocumentosContextuais(clienteId, templateIds);

      const vinculos2 = vincCompletos.map((v) => {
        const doc = docs.find((d) => d.documentoTemplateId === v.template.id)!;
        return { vinculo: v.vinculo, template: v.template, doc };
      });

      // Ordenar: obrigatórios primeiro, depois opcionais
      vinculos2.sort((a, b) => {
        if (a.vinculo.obrigatorio && !b.vinculo.obrigatorio) return -1;
        if (!a.vinculo.obrigatorio && b.vinculo.obrigatorio)  return 1;
        return a.template.titulo.localeCompare(b.template.titulo);
      });

      return { servico: s, vinculos: vinculos2 };
    });

    setServicoDocs(resultado.filter((r) => r.vinculos.length > 0));

    // Inicializa todas as seções abertas
    const estadoInicial: Record<string, boolean> = {};
    for (const r of resultado) estadoInicial[r.servico.id] = true;
    setSecaoAberta(estadoInicial);
  }, [clienteId]);

  function refresh() {
    // Re-executar derivação
    const ags = listarAgendamentosCliente(clienteId);
    const procs = [...new Set(ags.map((a: { procedimento: string }) => a.procedimento).filter(Boolean))];
    const servicos = matchServicosPorProcedimento(procs);
    const templates = listarDocumentoTemplates();

    setServicoDocs(servicos.map((s) => {
      const vinculos = listarDocsDeServico(s.id);
      const vincCompletos = vinculos
        .map((v) => {
          const template = templates.find((t) => t.id === v.documentoTemplateId && t.ativo);
          return template ? { vinculo: v, template } : null;
        })
        .filter((x): x is { vinculo: ServicoDocumento; template: DocumentoTemplate } => x !== null);

      const templateIds = vincCompletos.map((v) => v.template.id);
      const docs = listarDocumentosContextuais(clienteId, templateIds);

      const vinculos2 = vincCompletos.map((v) => {
        const doc = docs.find((d) => d.documentoTemplateId === v.template.id)!;
        return { vinculo: v.vinculo, template: v.template, doc };
      });
      vinculos2.sort((a, b) => {
        if (a.vinculo.obrigatorio && !b.vinculo.obrigatorio) return -1;
        if (!a.vinculo.obrigatorio && b.vinculo.obrigatorio)  return 1;
        return a.template.titulo.localeCompare(b.template.titulo);
      });

      return { servico: s, vinculos: vinculos2 };
    }).filter((r) => r.vinculos.length > 0));
  }

  function handleGerar(id: string) {
    gerarDocContextual(id);
    refresh();
  }

  function handleAssinar(id: string) {
    marcarAssinadoContextual(id);
    refresh();
  }

  function handleReset(id: string) {
    if (!confirm('Resetar este documento para "Não gerado"?')) return;
    resetarDocContextual(id);
    refresh();
  }

  // Resumo global
  const todosDocs = servicosDocs.flatMap((s) => s.vinculos.map((v) => v.doc));
  // Deduplica por id (um template pode aparecer em múltiplos serviços)
  const docsUnicos = [...new Map(todosDocs.map((d) => [d.id, d])).values()];
  const totalAssinados = docsUnicos.filter((d) => d.status === 'assinado').length;
  const totalPendentes = docsUnicos.filter((d) => d.status === 'pendente').length;
  const totalObrig = servicosDocs.flatMap((s) => s.vinculos).filter((v) => v.vinculo.obrigatorio).length;

  // ── Sem agendamentos ──────────────────────────────────────────────────────────
  if (procedimentos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center space-y-3">
          <p className="text-4xl">📋</p>
          <p className="text-sm font-semibold text-gray-600">Sem atendimentos registrados</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Adicione atendimentos na aba <strong>Agenda</strong> com o procedimento realizado.
            Os documentos necessários serão filtrados automaticamente.
          </p>
        </div>

        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs text-gray-500"
          style={{ backgroundColor: 'rgba(27,42,74,0.04)' }}
        >
          <span className="flex-shrink-0 mt-0.5">ℹ️</span>
          <span>
            O sistema de documentos é <strong>contextual</strong>: cada serviço tem seus
            próprios TCLEs e termos obrigatórios configurados em{' '}
            <strong>Configurações → Vínculos</strong>.
          </span>
        </div>
      </div>
    );
  }

  // ── Sem serviços correspondentes ─────────────────────────────────────────────
  if (semVinculo || servicosDocs.length === 0) {
    return (
      <div className="space-y-4">
        {/* Procedimentos detectados */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Procedimentos realizados
            </h3>
          </div>
          <div className="px-5 py-4 flex flex-wrap gap-2">
            {procedimentos.map((p) => (
              <span
                key={p}
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(27,42,74,0.08)', color: '#1B2A4A' }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-8 text-center space-y-2" style={{ backgroundColor: '#FFFBF0' }}>
          <p className="text-3xl">⚠️</p>
          <p className="text-sm font-semibold text-amber-800">Serviços não configurados</p>
          <p className="text-xs text-amber-700 max-w-sm mx-auto">
            Os procedimentos acima não correspondem a nenhum serviço cadastrado.
            Configure os serviços em <strong>Configurações → Serviços</strong> e vincule
            documentos em <strong>Configurações → Vínculos</strong>.
          </p>
        </div>
      </div>
    );
  }

  // ── Documentos contextuais ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Procedimentos detectados */}
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
        style={{ backgroundColor: 'rgba(27,42,74,0.05)' }}
      >
        <span className="text-gray-500">📋 Baseado em:</span>
        {procedimentos.map((p) => (
          <span
            key={p}
            className="font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#1B2A4A', color: 'white' }}
          >
            {p}
          </span>
        ))}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Obrigatórios',  value: totalObrig,    color: '#1B2A4A' },
          { label: 'Assinados',     value: totalAssinados, color: '#16A34A' },
          { label: 'Pendentes',     value: totalPendentes, color: '#D97706' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Seção por serviço */}
      {servicosDocs.map(({ servico, vinculos }) => {
        const aberto = secaoAberta[servico.id] ?? true;
        const assinados = vinculos.filter((v) => v.doc.status === 'assinado').length;
        const pendentes = vinculos.filter((v) => v.doc.status === 'pendente').length;
        const obrig     = vinculos.filter((v) => v.vinculo.obrigatorio);
        const opcionais = vinculos.filter((v) => !v.vinculo.obrigatorio);

        return (
          <div key={servico.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header da seção */}
            <button
              className="w-full px-5 py-3.5 flex items-center justify-between gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              onClick={() => setSecaoAberta((prev) => ({ ...prev, [servico.id]: !aberto }))}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-bold" style={{ color: '#1B2A4A' }}>
                  {servico.nome}
                </span>
                <span className="text-xs text-gray-400">
                  {obrig.length} obrigatório{obrig.length !== 1 ? 's' : ''} · {opcionais.length} opcional{opcionais.length !== 1 ? 'is' : ''}
                </span>
                {assinados > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                    ✅ {assinados} assinado{assinados !== 1 ? 's' : ''}
                  </span>
                )}
                {pendentes > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    ⏳ {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span className="text-gray-400 text-sm flex-shrink-0">{aberto ? '▲' : '▼'}</span>
            </button>

            {/* Documentos */}
            {aberto && (
              <div>
                {vinculos.map(({ vinculo, template, doc }) => (
                  <DocContextualRow
                    key={`${servico.id}-${doc.id}`}
                    doc={doc}
                    template={template}
                    vinculo={vinculo}
                    onGerar={handleGerar}
                    onAssinar={handleAssinar}
                    onReset={handleReset}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Rodapé */}
      <p className="text-xs text-gray-400 text-center">
        Geração e assinatura digital de documentos via integração PDF — em breve. ·{' '}
        Configure documentos por serviço em{' '}
        <strong className="font-medium">Configurações → Vínculos</strong>.
      </p>
    </div>
  );
}
