'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listarAuditoria,
  listarUsuariosDoLog,
  verificarIntegridade,
  exportarCSV,
  exportarJSON,
  setUsuarioAtual,
  getUsuarioAtual,
  ACAO_LABELS,
  ACAO_CORES,
  ENTIDADE_LABELS,
  PERFIL_LABELS,
  USUARIOS_DEMO,
  formatarDataHora,
  type AcaoAuditoria,
  type EntidadeAuditoria,
  type RegistroAuditoria,
  type ResultadoIntegridade,
  type UsuarioSession,
} from '@/lib/local-storage-auditoria';

// ─── Linha de log ─────────────────────────────────────────────────────────────

function LinhaLog({ log, expandida, onToggle }: {
  log: RegistroAuditoria;
  expandida: boolean;
  onToggle: () => void;
}) {
  const cfg = ACAO_CORES[log.acao];
  const temDetalhe = !!(log.campoAlterado || log.valorAnterior || log.valorNovo);

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${temDetalhe ? 'cursor-pointer' : ''}`}
        onClick={() => temDetalhe && onToggle()}
      >
        {/* Data/hora */}
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
          {formatarDataHora(log.dataHora)}
        </td>

        {/* Usuário */}
        <td className="px-4 py-3">
          <div className="text-xs font-semibold text-navy">{log.usuarioNome}</div>
          <div className="text-[10px] text-gray-400">{PERFIL_LABELS[log.usuarioPerfil]}</div>
        </td>

        {/* Ação */}
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
            style={{ backgroundColor: cfg.bg, color: cfg.text }}
          >
            {cfg.icon} {ACAO_LABELS[log.acao]}
          </span>
        </td>

        {/* Entidade */}
        <td className="px-4 py-3">
          <span className="text-xs text-gray-600">{ENTIDADE_LABELS[log.entidade]}</span>
        </td>

        {/* Descrição */}
        <td className="px-4 py-3 max-w-xs">
          <p className="text-xs text-gray-700 leading-snug truncate">{log.descricao}</p>
          {temDetalhe && (
            <span className="text-[10px] text-blue-400">{expandida ? '▲ ocultar' : '▼ ver alteração'}</span>
          )}
        </td>

        {/* Dispositivo */}
        <td className="px-4 py-3 hidden xl:table-cell">
          <span className="text-[10px] text-gray-400">{log.dispositivo}</span>
        </td>

        {/* Hash */}
        <td className="px-4 py-3 hidden lg:table-cell">
          <span
            className="font-mono text-[10px] text-gray-300 cursor-help"
            title={`Hash completo: ${log.hash}\nAnterior: ${log.hashAnterior}`}
          >
            #{log.hash.slice(0, 8)}
          </span>
        </td>
      </tr>

      {/* Linha de detalhe expansível */}
      {expandida && temDetalhe && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={7} className="px-8 py-3">
            <div className="flex flex-wrap gap-6 text-xs">
              {log.campoAlterado && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wide text-[10px] font-bold block mb-1">Campo</span>
                  <span className="font-semibold text-navy">{log.campoAlterado}</span>
                </div>
              )}
              {log.valorAnterior !== undefined && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wide text-[10px] font-bold block mb-1">Valor anterior</span>
                  <span
                    className="px-2 py-0.5 rounded text-red-700 font-mono"
                    style={{ backgroundColor: '#FEF2F2' }}
                  >
                    {log.valorAnterior || '(vazio)'}
                  </span>
                </div>
              )}
              {log.valorNovo !== undefined && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wide text-[10px] font-bold block mb-1">Valor novo</span>
                  <span
                    className="px-2 py-0.5 rounded text-green-700 font-mono"
                    style={{ backgroundColor: '#F0FDF4' }}
                  >
                    {log.valorNovo || '(vazio)'}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-400 uppercase tracking-wide text-[10px] font-bold block mb-1">ID do registro</span>
                <span className="font-mono text-gray-500">{log.entidadeId}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Painel de integridade ────────────────────────────────────────────────────

function PainelIntegridade() {
  const [resultado, setResultado] = useState<ResultadoIntegridade | null>(null);
  const [verificando, setVerificando] = useState(false);

  function verificar() {
    setVerificando(true);
    setTimeout(() => {
      setResultado(verificarIntegridade());
      setVerificando(false);
    }, 300);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span>🔗</span>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Verificação de Integridade da Cadeia
          </h3>
        </div>
        <button
          onClick={verificar}
          disabled={verificando}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          {verificando ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Verificando…
            </>
          ) : '🔍 Verificar integridade'}
        </button>
      </div>

      <div className="p-5">
        {!resultado ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Clique em "Verificar integridade" para confirmar que nenhum registro foi adulterado.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Status geral */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                resultado.integro
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <span className="text-2xl">{resultado.integro ? '✅' : '⚠️'}</span>
              <div>
                <p className="font-bold">
                  {resultado.integro
                    ? 'Log íntegro — nenhuma adulteração detectada'
                    : `${resultado.entradasCorrompidas} entrada(s) com problema de integridade`}
                </p>
                <p className="text-xs font-normal opacity-70 mt-0.5">
                  {resultado.totalEntradas} entradas verificadas
                </p>
              </div>
            </div>

            {/* Detalhes de entradas corrompidas */}
            {!resultado.integro && resultado.detalhes.length > 0 && (
              <div className="space-y-2">
                {resultado.detalhes.map((d) => (
                  <div key={d.id} className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <span className="font-mono font-bold">{d.id.slice(0, 20)}…</span>
                    <span className="ml-2">{d.problema}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Explicação técnica */}
            <div
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs text-gray-500"
              style={{ backgroundColor: 'rgba(27,42,74,0.04)' }}
            >
              <span className="flex-shrink-0 mt-0.5">ℹ️</span>
              <span>
                Cada entrada encadeia o hash da anterior (estrutura em cadeia). Se qualquer
                registro for modificado diretamente no localStorage, o hash deixará de bater
                e será detectado aqui. Ao migrar para Supabase, a verificação usará
                funções de hash nativas do PostgreSQL.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Seletor de sessão (simulado) ─────────────────────────────────────────────

function SeletorSessao() {
  const [sessaoAtual, setSessaoAtual] = useState<UsuarioSession>(getUsuarioAtual);

  function trocarUsuario(u: UsuarioSession) {
    setUsuarioAtual(u);
    setSessaoAtual(u);
  }

  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            🔐 Sessão ativa (simulada — sem autenticação real)
          </p>
          <p className="text-sm font-semibold text-navy">
            {sessaoAtual.nome}
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({PERFIL_LABELS[sessaoAtual.perfil]})
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          {USUARIOS_DEMO.map((u) => (
            <button
              key={u.id}
              onClick={() => trocarUsuario(u)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              style={
                sessaoAtual.id === u.id
                  ? { backgroundColor: '#1B2A4A', color: 'white', borderColor: '#1B2A4A' }
                  : { backgroundColor: 'white', color: '#6B7280', borderColor: '#E5E7EB' }
              }
            >
              {u.nome}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        A sessão selecionada é usada em todos os registros de auditoria. Ao integrar Supabase Auth,
        o usuário será capturado automaticamente via JWT.
      </p>
    </div>
  );
}

// ─── TabAuditoria principal ───────────────────────────────────────────────────

export default function TabAuditoria() {
  const [logs, setLogs] = useState<RegistroAuditoria[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  // Filtros
  const [filtroAcao, setFiltroAcao] = useState<AcaoAuditoria | ''>('');
  const [filtroEntidade, setFiltroEntidade] = useState<EntidadeAuditoria | ''>('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const POR_PAGINA = 50;

  useEffect(() => {
    setLogs(listarAuditoria());
    setUsuarios(listarUsuariosDoLog());
  }, []);

  // ── Aplicar filtros ──────────────────────────────────────────────────────────
  const logsFiltrados = useMemo(() => {
    let r = logs;
    if (filtroAcao)      r = r.filter((l) => l.acao      === filtroAcao);
    if (filtroEntidade)  r = r.filter((l) => l.entidade  === filtroEntidade);
    if (filtroUsuario)   r = r.filter((l) => l.usuarioId === filtroUsuario);
    if (filtroBusca) {
      const q = filtroBusca.toLowerCase();
      r = r.filter((l) => l.descricao.toLowerCase().includes(q));
    }
    if (filtroDataInicio) r = r.filter((l) => l.dataHora.slice(0, 10) >= filtroDataInicio);
    if (filtroDataFim)    r = r.filter((l) => l.dataHora.slice(0, 10) <= filtroDataFim);
    return r;
  }, [logs, filtroAcao, filtroEntidade, filtroUsuario, filtroBusca, filtroDataInicio, filtroDataFim]);

  const totalPaginas  = Math.max(1, Math.ceil(logsFiltrados.length / POR_PAGINA));
  const logsPagina    = logsFiltrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function limparFiltros() {
    setFiltroAcao('');
    setFiltroEntidade('');
    setFiltroUsuario('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroBusca('');
    setPaginaAtual(1);
  }

  // ── Exportação ───────────────────────────────────────────────────────────────
  function baixarCSV() {
    const csv  = exportarCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `auditoria_clinica_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function baixarJSON() {
    const json = exportarJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `auditoria_clinica_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const temFiltro = !!(filtroAcao || filtroEntidade || filtroUsuario || filtroBusca || filtroDataInicio || filtroDataFim);

  return (
    <div className="space-y-6">

      {/* ── Aviso de acesso restrito ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
        style={{ backgroundColor: '#1B2A4A', color: '#C9A84C' }}
      >
        <span className="text-xl flex-shrink-0">🔒</span>
        <div>
          <span className="font-bold">Área restrita — Somente Administrador</span>
          <span className="ml-2 text-xs font-normal opacity-70">
            Log de auditoria imutável. Nenhum registro pode ser editado ou excluído.
          </span>
        </div>
      </div>

      {/* ── Sessão ativa ── */}
      <SeletorSessao />

      {/* ── Verificação de integridade ── */}
      <PainelIntegridade />

      {/* ── Painel principal ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Cabeçalho + exportação */}
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-navy">
              Log Completo de Auditoria
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {logsFiltrados.length} de {logs.length} registros
              {temFiltro && ' (filtrado)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={baixarCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Exportar para Excel/CSV"
            >
              📊 Exportar CSV
            </button>
            <button
              onClick={baixarJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              title="Exportar JSON (uso judicial)"
            >
              📄 Exportar JSON
            </button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 space-y-3">
          {/* Linha 1: busca + datas */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="🔍 Buscar na descrição…"
              value={filtroBusca}
              onChange={(e) => { setFiltroBusca(e.target.value); setPaginaAtual(1); }}
              className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => { setFiltroDataInicio(e.target.value); setPaginaAtual(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              title="Data inicial"
            />
            <span className="self-center text-gray-400 text-sm">até</span>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => { setFiltroDataFim(e.target.value); setPaginaAtual(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              title="Data final"
            />
          </div>

          {/* Linha 2: selects */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filtroAcao}
              onChange={(e) => { setFiltroAcao(e.target.value as AcaoAuditoria | ''); setPaginaAtual(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="">Todas as ações</option>
              {(Object.keys(ACAO_LABELS) as AcaoAuditoria[]).map((a) => (
                <option key={a} value={a}>{ACAO_LABELS[a]}</option>
              ))}
            </select>

            <select
              value={filtroEntidade}
              onChange={(e) => { setFiltroEntidade(e.target.value as EntidadeAuditoria | ''); setPaginaAtual(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="">Todas as entidades</option>
              {(Object.keys(ENTIDADE_LABELS) as EntidadeAuditoria[]).map((e) => (
                <option key={e} value={e}>{ENTIDADE_LABELS[e]}</option>
              ))}
            </select>

            <select
              value={filtroUsuario}
              onChange={(e) => { setFiltroUsuario(e.target.value); setPaginaAtual(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
            >
              <option value="">Todos os usuários</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>

            {temFiltro && (
              <button
                onClick={limparFiltros}
                className="px-3 py-2 rounded-lg text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
              >
                ✕ Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* ── Tabela ── */}
        {logsPagina.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">{logs.length === 0 ? '📋' : '🔍'}</p>
            <p className="text-sm font-semibold text-gray-500">
              {logs.length === 0
                ? 'Nenhuma ação registrada ainda'
                : 'Nenhum resultado para os filtros selecionados'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {logs.length === 0
                ? 'Os registros aparecerão conforme você usa o sistema.'
                : 'Ajuste os filtros ou clique em "Limpar filtros".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'Descrição', 'Dispositivo', 'Hash'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${
                        h === 'Dispositivo' ? 'hidden xl:table-cell' :
                        h === 'Hash'        ? 'hidden lg:table-cell' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logsPagina.map((log) => (
                  <LinhaLog
                    key={log.id}
                    log={log}
                    expandida={expandidoId === log.id}
                    onToggle={() => setExpandidoId((v) => v === log.id ? null : log.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginação ── */}
        {totalPaginas > 1 && (
          <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-400">
              Página {paginaAtual} de {totalPaginas} · {logsFiltrados.length} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                const pg = Math.max(1, Math.min(paginaAtual - 2 + i, totalPaginas - 4 + i));
                return (
                  <button
                    key={pg}
                    onClick={() => setPaginaAtual(pg)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
                    style={
                      pg === paginaAtual
                        ? { backgroundColor: '#1B2A4A', color: 'white' }
                        : { color: '#6B7280' }
                    }
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Rodapé legal ── */}
      <div
        className="flex items-start gap-3 px-5 py-4 rounded-xl text-xs text-gray-500"
        style={{ backgroundColor: 'rgba(27,42,74,0.04)' }}
      >
        <span className="text-lg flex-shrink-0 mt-0.5">⚖️</span>
        <div className="space-y-1">
          <p className="font-semibold text-navy">Uso em processos judiciais</p>
          <p>
            Este log pode ser exportado em <strong>CSV</strong> (compatível com Excel) ou{' '}
            <strong>JSON</strong> (formato técnico com hashes de integridade) para apresentação
            em processos administrativos ou judiciais. Cada entrada contém: data/hora, usuário,
            ação realizada, valor anterior e novo, dispositivo utilizado e hash de integridade
            encadeado para detecção de adulteração.
          </p>
          <p className="text-gray-400">
            Ao migrar para Supabase: os logs serão armazenados com Row Level Security (RLS),
            o IP real será capturado via edge functions e a cadeia de hashes usará SHA-256 nativo.
          </p>
        </div>
      </div>
    </div>
  );
}
