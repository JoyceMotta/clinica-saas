// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULO DE AUDITORIA — Rastreamento imutável de todas as ações do sistema
//  Estrutura preparada para migração ao Supabase (tabela audit_log).
//
//  IMUTABILIDADE: nenhuma função pública permite editar ou excluir entradas.
//  INTEGRIDADE:   cada entrada encadeia o hash da anterior (blockchain leve).
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AcaoAuditoria =
  | 'CRIOU'
  | 'EDITOU'
  | 'VISUALIZOU'
  | 'EXCLUIU'
  | 'ASSINOU'
  | 'ENVIOU'
  | 'GEROU'
  | 'RESETOU'
  | 'UPLOAD'
  | 'LOGIN'
  | 'LOGOUT';

export type EntidadeAuditoria =
  | 'cliente'
  | 'documento'
  | 'agendamento'
  | 'financeiro'
  | 'prontuario'
  | 'estoque'
  | 'configuracao'
  | 'sistema';

export type PerfilUsuario = 'admin' | 'profissional' | 'recepcao';

export interface RegistroAuditoria {
  id: string;
  dataHora: string;             // ISO 8601
  usuarioId: string;
  usuarioNome: string;
  usuarioPerfil: PerfilUsuario;
  acao: AcaoAuditoria;
  entidade: EntidadeAuditoria;
  entidadeId: string;           // ID do registro afetado
  clienteId?: string;           // para escopo na linha do tempo
  descricao: string;            // texto legível: "Dra. Joyce editou telefone de …"
  campoAlterado?: string;       // ex: "whatsapp"
  valorAnterior?: string;       // ex: "(11) 99999-0000"
  valorNovo?: string;           // ex: "(11) 98888-1111"
  ipAddress: string;            // "local" — Supabase capturará o IP real
  dispositivo: string;          // "Chrome / Windows 11"
  hash: string;                 // hash de integridade desta entrada
  hashAnterior: string;         // hash da entrada anterior (cadeia)
}

export interface UsuarioSession {
  id: string;
  nome: string;
  perfil: PerfilUsuario;
}

export interface FiltroAuditoria {
  acao?: AcaoAuditoria;
  entidade?: EntidadeAuditoria;
  clienteId?: string;
  usuarioId?: string;
  dataInicio?: string;   // YYYY-MM-DD
  dataFim?: string;      // YYYY-MM-DD
  busca?: string;        // texto livre em descricao
}

// ─── Labels e cores ────────────────────────────────────────────────────────────

export const ACAO_LABELS: Record<AcaoAuditoria, string> = {
  CRIOU:      'Criou',
  EDITOU:     'Editou',
  VISUALIZOU: 'Visualizou',
  EXCLUIU:    'Excluiu',
  ASSINOU:    'Assinou',
  ENVIOU:     'Enviou',
  GEROU:      'Gerou',
  RESETOU:    'Resetou',
  UPLOAD:     'Upload de arquivo',
  LOGIN:      'Login',
  LOGOUT:     'Logout',
};

export const ACAO_CORES: Record<AcaoAuditoria, { bg: string; text: string; icon: string }> = {
  CRIOU:      { bg: '#F0FDF4', text: '#16A34A', icon: '➕' },
  EDITOU:     { bg: '#EFF6FF', text: '#1D4ED8', icon: '✏️' },
  VISUALIZOU: { bg: '#F9FAFB', text: '#6B7280', icon: '👁️' },
  EXCLUIU:    { bg: '#FEF2F2', text: '#DC2626', icon: '🗑️' },
  ASSINOU:    { bg: '#F0FDF4', text: '#16A34A', icon: '✅' },
  ENVIOU:     { bg: '#EFF6FF', text: '#2563EB', icon: '📤' },
  GEROU:      { bg: '#FFFBF0', text: '#D97706', icon: '📄' },
  RESETOU:    { bg: '#FFF7ED', text: '#C2410C', icon: '↩️' },
  UPLOAD:     { bg: '#F5F3FF', text: '#7C3AED', icon: '📁' },
  LOGIN:      { bg: '#F0FDF4', text: '#16A34A', icon: '🔐' },
  LOGOUT:     { bg: '#F9FAFB', text: '#6B7280', icon: '🚪' },
};

export const ENTIDADE_LABELS: Record<EntidadeAuditoria, string> = {
  cliente:      'Cliente',
  documento:    'Documento',
  agendamento:  'Agendamento',
  financeiro:   'Financeiro',
  prontuario:   'Prontuário',
  estoque:      'Estoque',
  configuracao: 'Configuração',
  sistema:      'Sistema',
};

export const PERFIL_LABELS: Record<PerfilUsuario, string> = {
  admin:        'Administrador',
  profissional: 'Profissional',
  recepcao:     'Recepção',
};

// ─── Storage keys ──────────────────────────────────────────────────────────────

const STORAGE_KEY  = 'clinica_auditoria_v1';
const SESSION_KEY  = 'clinica_session_v1';
const GENESIS_HASH = '0000000000000000'; // bloco gênesis da cadeia

// ─── Sessão do usuário (simulada — será substituída por Supabase Auth) ─────────

export const DEFAULT_SESSION: UsuarioSession = {
  id:     'usr_admin_01',
  nome:   'Administrador',
  perfil: 'admin',
};

export function getUsuarioAtual(): UsuarioSession {
  if (typeof window === 'undefined') return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UsuarioSession) : DEFAULT_SESSION;
  } catch {
    return DEFAULT_SESSION;
  }
}

export function setUsuarioAtual(usuario: UsuarioSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

// ─── Lista de usuários simulados (demo) ────────────────────────────────────────

export const USUARIOS_DEMO: UsuarioSession[] = [
  { id: 'usr_admin_01',  nome: 'Administrador',   perfil: 'admin' },
  { id: 'usr_prof_01',   nome: 'Dra. Joyce',       perfil: 'profissional' },
  { id: 'usr_prof_02',   nome: 'Dr. Carlos',       perfil: 'profissional' },
  { id: 'usr_recep_01',  nome: 'Ana Recepção',     perfil: 'recepcao' },
];

// ─── Detecção de dispositivo ───────────────────────────────────────────────────

function detectarDispositivo(): string {
  if (typeof navigator === 'undefined') return 'Servidor';
  const ua = navigator.userAgent;

  let os = 'Desconhecido';
  if (/Windows NT 1[01]/.test(ua))  os = 'Windows 10/11';
  else if (/Windows NT/.test(ua))   os = 'Windows';
  else if (/Mac OS X/.test(ua))     os = 'macOS';
  else if (/iPhone/.test(ua))       os = 'iPhone';
  else if (/iPad/.test(ua))         os = 'iPad';
  else if (/Android/.test(ua))      os = 'Android';
  else if (/Linux/.test(ua))        os = 'Linux';

  let browser = 'Desconhecido';
  if (/Edg\//.test(ua))             browser = 'Edge';
  else if (/OPR\//.test(ua))        browser = 'Opera';
  else if (/Chrome\//.test(ua))     browser = 'Chrome';
  else if (/Firefox\//.test(ua))    browser = 'Firefox';
  else if (/Safari\//.test(ua))     browser = 'Safari';

  return `${browser} / ${os}`;
}

// ─── Hash de integridade (djb2-XOR) ───────────────────────────────────────────
//  Não é criptografia — serve para DETECTAR adulteração manual no localStorage.
//  Se alguém editar um registro pelo DevTools, o hash deixará de bater.

function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h | 0; // força inteiro 32-bit
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function calcularHash(semHash: Omit<RegistroAuditoria, 'hash'>): string {
  const payload = [
    semHash.id,
    semHash.dataHora,
    semHash.usuarioId,
    semHash.acao,
    semHash.entidade,
    semHash.entidadeId,
    semHash.descricao,
    semHash.campoAlterado  ?? '',
    semHash.valorAnterior  ?? '',
    semHash.valorNovo      ?? '',
    semHash.hashAnterior,
  ].join('║');
  return djb2(payload);
}

// ─── Leitura interna (nunca exposta diretamente para evitar adulteração) ───────

function lerTodos(): RegistroAuditoria[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as RegistroAuditoria[];
  } catch {
    return [];
  }
}

function hashUltimaEntrada(): string {
  const all = lerTodos();
  return all.length === 0 ? GENESIS_HASH : all[all.length - 1].hash;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  API PÚBLICA — SOMENTE LEITURA + APPEND
//  Nenhuma função exposta permite editar ou remover registros existentes.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Registra uma nova entrada de auditoria.
 * Append-only: nunca modifica registros anteriores.
 */
export function registrarAuditoria(
  params: {
    acao: AcaoAuditoria;
    entidade: EntidadeAuditoria;
    entidadeId: string;
    clienteId?: string;
    descricao: string;
    campoAlterado?: string;
    valorAnterior?: string;
    valorNovo?: string;
  },
  usuario?: UsuarioSession,
): RegistroAuditoria {
  const user     = usuario ?? getUsuarioAtual();
  const agora    = new Date().toISOString();
  const id       = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const anterior = hashUltimaEntrada();

  const semHash: Omit<RegistroAuditoria, 'hash'> = {
    id,
    dataHora:      agora,
    usuarioId:     user.id,
    usuarioNome:   user.nome,
    usuarioPerfil: user.perfil,
    acao:          params.acao,
    entidade:      params.entidade,
    entidadeId:    params.entidadeId,
    clienteId:     params.clienteId,
    descricao:     params.descricao,
    campoAlterado: params.campoAlterado,
    valorAnterior: params.valorAnterior,
    valorNovo:     params.valorNovo,
    ipAddress:     'local',          // Supabase capturará o IP real
    dispositivo:   detectarDispositivo(),
    hashAnterior:  anterior,
  };

  const entry: RegistroAuditoria = {
    ...semHash,
    hash: calcularHash(semHash),
  };

  // Append-only — nunca sobrescreve entradas anteriores
  const all = lerTodos();
  all.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  return entry;
}

/** Lista todas as entradas (painel de administração). Mais recente primeiro. */
export function listarAuditoria(filtro?: FiltroAuditoria): RegistroAuditoria[] {
  let all = lerTodos().slice().reverse();

  if (!filtro) return all;

  if (filtro.acao)      all = all.filter((r) => r.acao === filtro.acao);
  if (filtro.entidade)  all = all.filter((r) => r.entidade === filtro.entidade);
  if (filtro.clienteId) all = all.filter((r) => r.clienteId === filtro.clienteId);
  if (filtro.usuarioId) all = all.filter((r) => r.usuarioId === filtro.usuarioId);
  if (filtro.busca) {
    const q = filtro.busca.toLowerCase();
    all = all.filter((r) => r.descricao.toLowerCase().includes(q));
  }
  if (filtro.dataInicio) {
    all = all.filter((r) => r.dataHora.slice(0, 10) >= filtro.dataInicio!);
  }
  if (filtro.dataFim) {
    all = all.filter((r) => r.dataHora.slice(0, 10) <= filtro.dataFim!);
  }

  return all;
}

/** Lista entradas de um cliente específico (linha do tempo). */
export function listarAuditoriaCliente(clienteId: string): RegistroAuditoria[] {
  return lerTodos().filter((r) => r.clienteId === clienteId).reverse();
}

/** Retorna os usuários distintos que aparecem no log. */
export function listarUsuariosDoLog(): { id: string; nome: string; perfil: PerfilUsuario }[] {
  const map = new Map<string, { id: string; nome: string; perfil: PerfilUsuario }>();
  for (const r of lerTodos()) {
    if (!map.has(r.usuarioId)) {
      map.set(r.usuarioId, { id: r.usuarioId, nome: r.usuarioNome, perfil: r.usuarioPerfil });
    }
  }
  return Array.from(map.values());
}

// ─── Verificação de integridade ────────────────────────────────────────────────

export interface ResultadoIntegridade {
  integro: boolean;
  totalEntradas: number;
  entradasCorrompidas: number;
  detalhes: { id: string; problema: string }[];
}

export function verificarIntegridade(): ResultadoIntegridade {
  const all = lerTodos();
  const detalhes: { id: string; problema: string }[] = [];
  let hashEsperado = GENESIS_HASH;

  for (const entry of all) {
    // 1. Cadeia: hashAnterior deve bater com o hash computado da entrada anterior
    if (entry.hashAnterior !== hashEsperado) {
      detalhes.push({
        id: entry.id,
        problema: `Cadeia quebrada — hashAnterior inválido (esperado: ${hashEsperado})`,
      });
    }

    // 2. Conteúdo: hash deve bater com os campos da própria entrada
    const { hash, ...semHash } = entry;
    if (hash !== calcularHash(semHash)) {
      detalhes.push({
        id: entry.id,
        problema: 'Conteúdo adulterado — hash da entrada não confere',
      });
    }

    hashEsperado = entry.hash;
  }

  return {
    integro:             detalhes.length === 0,
    totalEntradas:       all.length,
    entradasCorrompidas: detalhes.length,
    detalhes,
  };
}

// ─── Exportação ────────────────────────────────────────────────────────────────

/** Exporta log completo como JSON (para uso judicial). */
export function exportarJSON(): string {
  return JSON.stringify(lerTodos(), null, 2);
}

/** Exporta log como CSV compatível com Excel. */
export function exportarCSV(): string {
  const all = lerTodos();
  const headers = [
    'ID', 'Data/Hora', 'Usuário', 'Perfil', 'Ação',
    'Entidade', 'ID Entidade', 'ID Cliente', 'Descrição',
    'Campo Alterado', 'Valor Anterior', 'Valor Novo',
    'IP', 'Dispositivo', 'Hash Integridade', 'Hash Anterior',
  ];

  const rows = all.map((r) =>
    [
      r.id, r.dataHora, r.usuarioNome,
      PERFIL_LABELS[r.usuarioPerfil],
      ACAO_LABELS[r.acao],
      ENTIDADE_LABELS[r.entidade],
      r.entidadeId, r.clienteId ?? '',
      r.descricao,
      r.campoAlterado  ?? '',
      r.valorAnterior  ?? '',
      r.valorNovo      ?? '',
      r.ipAddress, r.dispositivo,
      r.hash, r.hashAnterior,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','),
  );

  // BOM para Excel reconhecer UTF-8
  return '﻿' + [headers.join(','), ...rows].join('\r\n');
}

/** Formata data/hora completa para exibição. */
export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** Formata data/hora compacta (sem segundos). */
export function formatarDataHoraCompacta(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
