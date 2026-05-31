'use client';

import { useEffect, useState, useMemo } from 'react';
import type { ClienteLocal } from '@/lib/local-storage-clientes';
import {
  listarAuditoriaCliente,
  ACAO_CORES,
  ACAO_LABELS,
  ENTIDADE_LABELS,
  formatarDataHoraCompacta,
  type AcaoAuditoria,
  type RegistroAuditoria,
} from '@/lib/local-storage-auditoria';

// ─── Tipos de filtro ──────────────────────────────────────────────────────────

type FiltroTipo = AcaoAuditoria | 'todos';

const FILTROS: { id: FiltroTipo; label: string }[] = [
  { id: 'todos',      label: 'Todos' },
  { id: 'CRIOU',      label: 'Criações' },
  { id: 'EDITOU',     label: 'Edições' },
  { id: 'VISUALIZOU', label: 'Acessos' },
  { id: 'EXCLUIU',    label: 'Exclusões' },
  { id: 'ASSINOU',    label: 'Assinaturas' },
  { id: 'GEROU',      label: 'Documentos gerados' },
  { id: 'UPLOAD',     label: 'Uploads' },
];

// ─── Card de um evento de auditoria ──────────────────────────────────────────

function EventoCard({ log }: { log: RegistroAuditoria }) {
  const cfg = ACAO_CORES[log.acao];
  const [expandido, setExpandido] = useState(false);

  const temDetalhe = !!(log.campoAlterado || log.valorAnterior || log.valorNovo);

  return (
    <div className="flex items-start gap-3">
      {/* Ícone da ação */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm shadow-sm"
        style={{ backgroundColor: cfg.bg, border: `1.5px solid ${cfg.text}22` }}
      >
        <span className="text-base leading-none">{cfg.icon}</span>
      </div>

      {/* Conteúdo */}
      <div
        className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 min-w-0 cursor-pointer hover:border-gray-200 transition-colors"
        onClick={() => temDetalhe && setExpandido((v) => !v)}
      >
        {/* Linha principal */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            {/* Badge de ação + entidade */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: cfg.bg, color: cfg.text }}
              >
                {cfg.icon} {ACAO_LABELS[log.acao]}
              </span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                {ENTIDADE_LABELS[log.entidade]}
              </span>
            </div>

            {/* Descrição */}
            <p className="text-sm font-medium text-navy leading-snug">{log.descricao}</p>

            {/* Quem fez */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-400">
              <span className="font-semibold" style={{ color: '#1B2A4A' }}>
                {log.usuarioNome}
              </span>
              <span>·</span>
              <span>{log.usuarioPerfil === 'admin' ? 'Administrador' : log.usuarioPerfil === 'profissional' ? 'Profissional' : 'Recepção'}</span>
              <span>·</span>
              <span>{formatarDataHoraCompacta(log.dataHora)}</span>
              <span>·</span>
              <span className="font-mono text-[10px] text-gray-300" title={`Hash: ${log.hash}`}>
                #{log.hash.slice(0, 6)}
              </span>
            </div>
          </div>

          {/* Indicador de detalhe expansível */}
          {temDetalhe && (
            <button
              className="flex-shrink-0 text-xs text-gray-400 hover:text-navy transition-colors mt-0.5"
              title="Ver detalhes da alteração"
            >
              {expandido ? '▲' : '▼'}
            </button>
          )}
        </div>

        {/* Detalhe da alteração (expandível) */}
        {expandido && temDetalhe && (
          <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
            {log.campoAlterado && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-20 flex-shrink-0">Campo:</span>
                <span className="font-semibold text-navy">{log.campoAlterado}</span>
              </div>
            )}
            {log.valorAnterior !== undefined && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 w-20 flex-shrink-0 pt-0.5">Antes:</span>
                <span
                  className="px-2 py-0.5 rounded text-red-700 font-mono break-all"
                  style={{ backgroundColor: '#FEF2F2' }}
                >
                  {log.valorAnterior || '(vazio)'}
                </span>
              </div>
            )}
            {log.valorNovo !== undefined && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 w-20 flex-shrink-0 pt-0.5">Depois:</span>
                <span
                  className="px-2 py-0.5 rounded text-green-700 font-mono break-all"
                  style={{ backgroundColor: '#F0FDF4' }}
                >
                  {log.valorNovo || '(vazio)'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Aba Linha do Tempo ───────────────────────────────────────────────────────

export default function TabTimeline({ cliente }: { cliente: ClienteLocal }) {
  const [logs, setLogs] = useState<RegistroAuditoria[]>([]);
  const [filtroAcao, setFiltroAcao] = useState<FiltroTipo>('todos');
  const [filtroData, setFiltroData] = useState('');

  useEffect(() => {
    setLogs(listarAuditoriaCliente(cliente.id));
  }, [cliente.id]);

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const logsFiltrados = useMemo(() => {
    let r = logs;
    if (filtroAcao !== 'todos') r = r.filter((l) => l.acao === filtroAcao);
    if (filtroData) r = r.filter((l) => l.dataHora.startsWith(filtroData));
    return r;
  }, [logs, filtroAcao, filtroData]);

  // ── Agrupar por data ──────────────────────────────────────────────────────────
  const porData = useMemo(() => {
    const map = new Map<string, RegistroAuditoria[]>();
    for (const l of logsFiltrados) {
      const key = l.dataHora.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return map;
  }, [logsFiltrados]);

  const datas = Array.from(porData.keys()).sort((a, b) => b.localeCompare(a));

  function formatarData(iso: string) {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  // ── Estatísticas rápidas ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     logs.length,
    edicoes:   logs.filter((l) => l.acao === 'EDITOU').length,
    acessos:   logs.filter((l) => l.acao === 'VISUALIZOU').length,
    exclusoes: logs.filter((l) => l.acao === 'EXCLUIU').length,
  }), [logs]);

  return (
    <div className="space-y-5">

      {/* ── Estatísticas ── */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Eventos totais', value: stats.total,     color: '#1B2A4A' },
            { label: 'Edições',        value: stats.edicoes,   color: '#1D4ED8' },
            { label: 'Acessos',        value: stats.acessos,   color: '#6B7280' },
            { label: 'Exclusões',      value: stats.exclusoes, color: '#DC2626' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filtro por tipo de ação */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {FILTROS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFiltroAcao(id)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={
                filtroAcao === id
                  ? { backgroundColor: '#1B2A4A', color: 'white' }
                  : { backgroundColor: '#F3F4F6', color: '#6B7280' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtro por data */}
        <input
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-navy focus:outline-none focus:ring-2 flex-shrink-0"
          title="Filtrar por data"
        />
        {filtroData && (
          <button
            onClick={() => setFiltroData('')}
            className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0"
          >
            Limpar data
          </button>
        )}
      </div>

      {/* ── Linha do tempo ── */}
      {datas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center space-y-3">
          <p className="text-4xl">{logs.length === 0 ? '📜' : '🔍'}</p>
          <p className="text-sm font-semibold text-gray-600">
            {logs.length === 0
              ? 'Nenhum evento registrado ainda'
              : 'Nenhum evento corresponde ao filtro selecionado'}
          </p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {logs.length === 0
              ? 'Os eventos aparecem aqui conforme você usa o sistema (cadastros, edições, uploads, documentos…).'
              : 'Tente outro filtro ou limpe a data selecionada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {datas.map((data) => {
            const eventsDia = porData.get(data)!;
            return (
              <div key={data} className="relative">
                {/* Cabeçalho do dia */}
                <div className="sticky top-0 z-10 mb-3 pt-1">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold capitalize shadow-sm"
                    style={{ backgroundColor: '#1B2A4A', color: 'white' }}
                  >
                    {formatarData(data)}
                    <span className="ml-2 opacity-60 font-normal">
                      {eventsDia.length} evento{eventsDia.length !== 1 ? 's' : ''}
                    </span>
                  </span>
                </div>

                {/* Eventos do dia */}
                <div className="ml-2 space-y-2 pb-5 border-l-2 border-gray-100 pl-4">
                  {eventsDia.map((log) => (
                    <EventoCard key={log.id} log={log} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rodapé de integridade ── */}
      {logs.length > 0 && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs text-gray-500"
          style={{ backgroundColor: 'rgba(27,42,74,0.04)' }}
        >
          <span className="flex-shrink-0">🔒</span>
          <span>
            Log de auditoria <strong>imutável</strong> — registros encadeados com hash de integridade.
            Nenhum usuário pode apagar o histórico.
            Veja o log completo da clínica em <strong>Configurações → Auditoria</strong>.
          </span>
        </div>
      )}
    </div>
  );
}
