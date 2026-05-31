import { registrarAuditoria } from './local-storage-auditoria';

// ─── Tipos (sistema legado — documentos fixos) ────────────────────────────────

export type StatusDocumento = 'nao_gerado' | 'pendente' | 'assinado';

export type TipoDocumento =
  | 'contrato_prestacao'
  | 'ficha_anamnese'
  | 'plano_tratamento'
  | 'tcle'
  | 'termo_imagem'
  | 'politica_agendamento'
  | 'aviso_pos_procedimento'
  | 'termo_conclusao';

export interface DocumentoCliente {
  id: string;
  clienteId: string;
  tipo: TipoDocumento;
  status: StatusDocumento;
  dataGeracao?: string;
  dataAssinatura?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export const TIPOS_DOCUMENTO: Record<TipoDocumento, string> = {
  contrato_prestacao:       'Contrato de Prestação de Serviço',
  ficha_anamnese:           'Ficha de Anamnese',
  plano_tratamento:         'Plano de Tratamento',
  tcle:                     'TCLE — Termo de Consentimento Livre e Esclarecido',
  termo_imagem:             'Termo de Autorização de Uso de Voz e Imagem',
  politica_agendamento:     'Política de Agendamento',
  aviso_pos_procedimento:   'Aviso de Pós-Procedimento',
  termo_conclusao:          'Termo de Conclusão e Satisfação',
};

export const ORDEM_DOCUMENTOS: TipoDocumento[] = [
  'contrato_prestacao',
  'ficha_anamnese',
  'plano_tratamento',
  'tcle',
  'termo_imagem',
  'politica_agendamento',
  'aviso_pos_procedimento',
  'termo_conclusao',
];

// ─── Tipos (sistema contextual — documentos por serviço) ──────────────────────

export interface DocumentoContextual {
  id: string;
  clienteId: string;
  documentoTemplateId: string;
  status: StatusDocumento;
  dataGeracao?: string;
  dataAssinatura?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY      = 'clinica_documentos_v1';
const STORAGE_KEY_CTX  = 'clinica_documentos_ctx_v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todos(): DocumentoCliente[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function salvar(docs: DocumentoCliente[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function todosCtx(): DocumentoContextual[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CTX) ?? '[]');
  } catch { return []; }
}

function salvarCtx(docs: DocumentoContextual[]) {
  localStorage.setItem(STORAGE_KEY_CTX, JSON.stringify(docs));
}

function gerar(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── CRUD legado ──────────────────────────────────────────────────────────────

export function listarDocumentosCliente(clienteId: string): DocumentoCliente[] {
  const existentes = todos().filter((d) => d.clienteId === clienteId);
  const existentesTipos = new Set(existentes.map((d) => d.tipo));
  const agora = new Date().toISOString();

  const faltantes: DocumentoCliente[] = ORDEM_DOCUMENTOS.filter(
    (t) => !existentesTipos.has(t),
  ).map((tipo) => ({
    id: gerar(),
    clienteId,
    tipo,
    status: 'nao_gerado',
    createdAt: agora,
    updatedAt: agora,
  }));

  if (faltantes.length > 0) {
    const all = todos();
    all.push(...faltantes);
    salvar(all);
  }

  const mapa = new Map<TipoDocumento, DocumentoCliente>();
  for (const d of [...existentes, ...faltantes]) mapa.set(d.tipo, d);
  return ORDEM_DOCUMENTOS.map((t) => mapa.get(t)!);
}

export function atualizarDocumento(
  id: string,
  patch: Partial<Omit<DocumentoCliente, 'id' | 'clienteId' | 'createdAt'>>,
): DocumentoCliente | null {
  const all = todos();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  salvar(all);
  return updated;
}

export function gerarDocumento(id: string): DocumentoCliente | null {
  const result = atualizarDocumento(id, { status: 'pendente', dataGeracao: new Date().toISOString() });
  if (result && typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'GEROU',
      entidade:  'documento',
      entidadeId: id,
      clienteId: result.clienteId,
      descricao: `Gerou o documento "${TIPOS_DOCUMENTO[result.tipo]}"`,
      valorNovo: 'Pendente de assinatura',
    });
  }
  return result;
}

export function marcarAssinado(id: string): DocumentoCliente | null {
  const result = atualizarDocumento(id, { status: 'assinado', dataAssinatura: new Date().toISOString() });
  if (result && typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'ASSINOU',
      entidade:  'documento',
      entidadeId: id,
      clienteId: result.clienteId,
      descricao: `Assinou o documento "${TIPOS_DOCUMENTO[result.tipo]}"`,
      valorAnterior: 'Pendente',
      valorNovo:     'Assinado',
    });
  }
  return result;
}

export function resetarDocumento(id: string): DocumentoCliente | null {
  const antes = todos().find((d) => d.id === id);
  const result = atualizarDocumento(id, {
    status: 'nao_gerado',
    dataGeracao:    undefined,
    dataAssinatura: undefined,
    url:            undefined,
  });
  if (result && antes && typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'RESETOU',
      entidade:  'documento',
      entidadeId: id,
      clienteId: result.clienteId,
      descricao: `Resetou o documento "${TIPOS_DOCUMENTO[result.tipo]}" para "Não gerado"`,
      valorAnterior: antes.status === 'assinado' ? 'Assinado' : 'Pendente',
      valorNovo:     'Não gerado',
    });
  }
  return result;
}

// ─── CRUD contextual ──────────────────────────────────────────────────────────

export function obterOuCriarDocContextual(
  clienteId: string,
  documentoTemplateId: string,
): DocumentoContextual {
  const all = todosCtx();
  const existente = all.find(
    (d) => d.clienteId === clienteId && d.documentoTemplateId === documentoTemplateId,
  );
  if (existente) return existente;

  const agora = new Date().toISOString();
  const novo: DocumentoContextual = {
    id: gerar(),
    clienteId,
    documentoTemplateId,
    status: 'nao_gerado',
    createdAt: agora,
    updatedAt: agora,
  };
  salvarCtx([...all, novo]);
  return novo;
}

export function listarDocumentosContextuais(
  clienteId: string,
  templateIds: string[],
): DocumentoContextual[] {
  return templateIds.map((tId) => obterOuCriarDocContextual(clienteId, tId));
}

export function atualizarDocContextual(
  id: string,
  patch: Partial<Omit<DocumentoContextual, 'id' | 'clienteId' | 'createdAt'>>,
): DocumentoContextual | null {
  const all = todosCtx();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  salvarCtx(all);
  return updated;
}

export function gerarDocContextual(id: string): DocumentoContextual | null {
  const result = atualizarDocContextual(id, { status: 'pendente', dataGeracao: new Date().toISOString() });
  if (result && typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'GEROU',
      entidade:  'documento',
      entidadeId: id,
      clienteId: result.clienteId,
      descricao: `Gerou documento contextual (template: ${result.documentoTemplateId})`,
      valorNovo: 'Pendente de assinatura',
    });
  }
  return result;
}

export function marcarAssinadoContextual(id: string): DocumentoContextual | null {
  const result = atualizarDocContextual(id, { status: 'assinado', dataAssinatura: new Date().toISOString() });
  if (result && typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'ASSINOU',
      entidade:  'documento',
      entidadeId: id,
      clienteId: result.clienteId,
      descricao: `Assinou documento contextual (template: ${result.documentoTemplateId})`,
      valorAnterior: 'Pendente',
      valorNovo:     'Assinado',
    });
  }
  return result;
}

export function resetarDocContextual(id: string): DocumentoContextual | null {
  const antes = todosCtx().find((d) => d.id === id);
  const result = atualizarDocContextual(id, {
    status: 'nao_gerado',
    dataGeracao:    undefined,
    dataAssinatura: undefined,
  });
  if (result && antes && typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'RESETOU',
      entidade:  'documento',
      entidadeId: id,
      clienteId: result.clienteId,
      descricao: `Resetou documento contextual para "Não gerado" (template: ${result.documentoTemplateId})`,
      valorAnterior: antes.status === 'assinado' ? 'Assinado' : 'Pendente',
      valorNovo:     'Não gerado',
    });
  }
  return result;
}
