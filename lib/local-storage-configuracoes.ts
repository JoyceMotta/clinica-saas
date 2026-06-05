// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Conselho {
  id: string;
  sigla: string;
  nome: string;
}

export interface Especialidade {
  id: string;
  nome: string;
  conselhoId: string | null;
  cor: string;
  ativo: boolean;
  createdAt: string;
}

export interface Profissional {
  id: string;
  nome: string;
  tituloProfissional?: string;
  especialidadeId: string;
  numeroConselho: string;
  ufConselho: string;
  servicoIds: string[];
  /**
   * Duração personalizada por serviço (em minutos).
   * Chave = servicoId. Se não existir para um serviço, usa duracaoMediaMin do ItemCatalogo.
   * Ex.: { 's_toxina': 30, 's_peeling': 50 }
   */
  duracoesPorServico: Record<string, number>;
  ativo: boolean;
  createdAt: string;
}

export type CategoriaDocumento = 'tcle' | 'anamnese' | 'contrato' | 'termo' | 'aviso' | 'outro';

export const CATEGORIA_LABELS: Record<CategoriaDocumento, string> = {
  tcle:     'TCLE — Consentimento',
  anamnese: 'Ficha de Anamnese',
  contrato: 'Contrato / Política',
  termo:    'Termo de Responsabilidade',
  aviso:    'Aviso Pós-Procedimento',
  outro:    'Outro',
};

export const CATEGORIA_CORES: Record<CategoriaDocumento, { bg: string; text: string }> = {
  tcle:     { bg: '#EFF6FF', text: '#1D4ED8' },
  anamnese: { bg: '#F0FDF4', text: '#16A34A' },
  contrato: { bg: '#FEF3C7', text: '#D97706' },
  termo:    { bg: '#FDF4FF', text: '#9333EA' },
  aviso:    { bg: '#FFF7ED', text: '#EA580C' },
  outro:    { bg: '#F9FAFB', text: '#6B7280' },
};

export interface DocumentoTemplate {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaDocumento;
  ativo: boolean;
  createdAt: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  especialidadeId: string | null;
  ativo: boolean;
  createdAt: string;
}

export interface ServicoDocumento {
  id: string;
  servicoId: string;
  documentoTemplateId: string;
  obrigatorio: boolean;
}

// ─── Conselhos predefinidos ───────────────────────────────────────────────────

export const CONSELHOS_PREDEFINIDOS: Conselho[] = [
  { id: 'c_crm',     sigla: 'CRM',     nome: 'Conselho Regional de Medicina' },
  { id: 'c_cro',     sigla: 'CRO',     nome: 'Conselho Regional de Odontologia' },
  { id: 'c_crefito', sigla: 'CREFITO', nome: 'Conselho Regional de Fisioterapia e Terapia Ocupacional' },
  { id: 'c_cfbio',   sigla: 'CFBio',   nome: 'Conselho Federal de Biomedicina' },
  { id: 'c_coren',   sigla: 'COREN',   nome: 'Conselho Regional de Enfermagem' },
  { id: 'c_crn',     sigla: 'CRN',     nome: 'Conselho Regional de Nutrição' },
  { id: 'c_crp',     sigla: 'CRP',     nome: 'Conselho Regional de Psicologia' },
];

export const UF_LIST = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
];

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_ESP   = 'clinica_especialidades_v1';
const KEY_PROF  = 'clinica_profissionais_v1';
const KEY_SERV  = 'clinica_servicos_v1';
const KEY_DOCT  = 'clinica_doc_templates_v1';
const KEY_SVDOC = 'clinica_servico_docs_v1';

// ─── Seed data ────────────────────────────────────────────────────────────────

const ESPECIALIDADES_SEED: Especialidade[] = [
  { id: 'e_med_est', nome: 'Medicina Estética',              conselhoId: 'c_crm',     cor: '#1B2A4A', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_derm',    nome: 'Dermatologia',                   conselhoId: 'c_crm',     cor: '#3B82F6', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_odonto',  nome: 'Odontologia Estética',           conselhoId: 'c_cro',     cor: '#10B981', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_hof',     nome: 'Harmonização Orofacial',         conselhoId: 'c_cro',     cor: '#6366F1', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_fisio',   nome: 'Fisioterapia Dermato-Funcional', conselhoId: 'c_crefito', cor: '#F59E0B', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_bio',     nome: 'Biomedicina Estética',           conselhoId: 'c_cfbio',   cor: '#EC4899', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_enf',     nome: 'Enfermagem Estética',            conselhoId: 'c_coren',   cor: '#8B5CF6', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_nut',     nome: 'Nutrição Estética',              conselhoId: 'c_crn',     cor: '#14B8A6', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_estetica', nome: 'Estética',                    conselhoId: null,        cor: '#F97316', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
];

const DOC_TEMPLATES_SEED: DocumentoTemplate[] = [
  { id: 'dt_contrato',     titulo: 'Contrato de Prestação de Serviços',                 categoria: 'contrato', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_anamnese_g',   titulo: 'Ficha de Anamnese Geral',                           categoria: 'anamnese', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_anamnese_o',   titulo: 'Ficha de Anamnese Odontológica',                    categoria: 'anamnese', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_imagem',       titulo: 'Termo de Autorização de Uso de Imagem e Voz',       categoria: 'termo',    ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_politica',     titulo: 'Política de Agendamento e Cancelamento',            categoria: 'contrato', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_toxina',  titulo: 'TCLE — Toxina Botulínica',                          categoria: 'tcle',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_preench', titulo: 'TCLE — Preenchimento Labial e Facial',              categoria: 'tcle',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_bio',     titulo: 'TCLE — Bioestimulador de Colágeno',                 categoria: 'tcle',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_pdo',     titulo: 'TCLE — Fio de PDO',                                 categoria: 'tcle',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_peeling', titulo: 'TCLE — Peeling Químico e Luz Pulsada',              categoria: 'tcle',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_clear',   titulo: 'TCLE — Clareamento Dental',                         categoria: 'tcle',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_hof',     titulo: 'TCLE — Harmonização Orofacial',                     categoria: 'tcle',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_termo_inv',    titulo: 'Termo de Responsabilidade — Procedimento Invasivo', categoria: 'termo',    ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_aviso_inj',    titulo: 'Aviso de Cuidados Pós-Procedimento Injetável',      categoria: 'aviso',    ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_conclusao',    titulo: 'Termo de Conclusão e Satisfação',                   categoria: 'termo',    ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
];

const SERVICOS_SEED: Servico[] = [
  { id: 's_toxina',      nome: 'Toxina Botulínica',               especialidadeId: 'e_med_est', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_preench_lab', nome: 'Preenchimento Labial',            especialidadeId: 'e_med_est', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_preench_sul', nome: 'Preenchimento de Sulcos e Mento', especialidadeId: 'e_med_est', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_bio',         nome: 'Bioestimulador de Colágeno',      especialidadeId: 'e_med_est', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_pdo',         nome: 'Fio de PDO',                      especialidadeId: 'e_med_est', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_peeling',     nome: 'Peeling Químico',                 especialidadeId: null,        ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_ipl',         nome: 'Luz Pulsada Intensa (IPL)',       especialidadeId: 'e_derm',    ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_limpeza',     nome: 'Limpeza de Pele Profissional',    especialidadeId: null,        ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_clear',       nome: 'Clareamento Dental',              especialidadeId: 'e_odonto',  ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_facetas',     nome: 'Facetas / Lentes de Contato',     especialidadeId: 'e_odonto',  ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_hof',         nome: 'Harmonização Orofacial',          especialidadeId: 'e_hof',     ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_drenagem',    nome: 'Drenagem Linfática',              especialidadeId: 'e_fisio',   ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_massagem',    nome: 'Massagem Modeladora',             especialidadeId: 'e_fisio',   ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_ultrassom',      nome: 'Ultrassom Terapêutico',      especialidadeId: 'e_fisio',    ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_estetica_fac',  nome: 'Estética Facial',            especialidadeId: 'e_estetica', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_estetica_corp', nome: 'Estética Corporal',          especialidadeId: 'e_estetica', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_limpeza_est',   nome: 'Limpeza de Pele (Esteticista)', especialidadeId: 'e_estetica', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_tecnica_est',   nome: 'Técnicas em Estética',       especialidadeId: 'e_estetica', ativo: true, descricao: '', createdAt: '2024-01-01T00:00:00Z' },
];

// ─── Helpers de storage ───────────────────────────────────────────────────────

function get<T>(key: string, seed: T[]): T[] {
  if (typeof window === 'undefined') return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) { localStorage.setItem(key, JSON.stringify(seed)); return seed; }
    return JSON.parse(raw) as T[];
  } catch { return seed; }
}

function set<T>(key: string, data: T[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function gerarId(): string {
  return `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── CRUD — Especialidades ────────────────────────────────────────────────────

export function listarEspecialidades(): Especialidade[] {
  return get(KEY_ESP, ESPECIALIDADES_SEED);
}
export function criarEspecialidade(data: Omit<Especialidade, 'id' | 'createdAt'>): Especialidade {
  const item: Especialidade = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_ESP, [...listarEspecialidades(), item]);
  return item;
}
export function atualizarEspecialidade(id: string, patch: Partial<Especialidade>): void {
  set(KEY_ESP, listarEspecialidades().map((e) => e.id === id ? { ...e, ...patch } : e));
}
export function deletarEspecialidade(id: string): void {
  set(KEY_ESP, listarEspecialidades().filter((e) => e.id !== id));
}

// ─── CRUD — Profissionais ─────────────────────────────────────────────────────

export function listarProfissionais(): Profissional[] {
  const items = get<Profissional>(KEY_PROF, []);
  // Migração: garante que profissionais antigos (sem duracoesPorServico) não quebram
  return items.map((p) => ({ ...p, duracoesPorServico: p.duracoesPorServico ?? {} }));
}
export function criarProfissional(data: Omit<Profissional, 'id' | 'createdAt'>): Profissional {
  const item: Profissional = {
    ...data,
    duracoesPorServico: data.duracoesPorServico ?? {},
    id: gerarId(),
    createdAt: new Date().toISOString(),
  };
  set(KEY_PROF, [...listarProfissionais(), item]);
  return item;
}
export function atualizarProfissional(id: string, patch: Partial<Profissional>): void {
  set(KEY_PROF, listarProfissionais().map((p) => p.id === id ? { ...p, ...patch } : p));
}
export function deletarProfissional(id: string): void {
  set(KEY_PROF, listarProfissionais().filter((p) => p.id !== id));
}

// ─── CRUD — Serviços ──────────────────────────────────────────────────────────

export function listarServicos(): Servico[] {
  return get(KEY_SERV, SERVICOS_SEED);
}
export function criarServico(data: Omit<Servico, 'id' | 'createdAt'>): Servico {
  const item: Servico = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_SERV, [...listarServicos(), item]);
  return item;
}
export function atualizarServico(id: string, patch: Partial<Servico>): void {
  set(KEY_SERV, listarServicos().map((s) => s.id === id ? { ...s, ...patch } : s));
}
export function deletarServico(id: string): void {
  set(KEY_SERV, listarServicos().filter((s) => s.id !== id));
  // Limpa vínculos órfãos
  set(KEY_SVDOC, listarServicoDocumentos().filter((sd) => sd.servicoId !== id));
}

// ─── CRUD — Documento Templates ───────────────────────────────────────────────

export function listarDocumentoTemplates(): DocumentoTemplate[] {
  return get(KEY_DOCT, DOC_TEMPLATES_SEED);
}
export function criarDocumentoTemplate(data: Omit<DocumentoTemplate, 'id' | 'createdAt'>): DocumentoTemplate {
  const item: DocumentoTemplate = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_DOCT, [...listarDocumentoTemplates(), item]);
  return item;
}
export function atualizarDocumentoTemplate(id: string, patch: Partial<DocumentoTemplate>): void {
  set(KEY_DOCT, listarDocumentoTemplates().map((d) => d.id === id ? { ...d, ...patch } : d));
}
export function deletarDocumentoTemplate(id: string): void {
  set(KEY_DOCT, listarDocumentoTemplates().filter((d) => d.id !== id));
  set(KEY_SVDOC, listarServicoDocumentos().filter((sd) => sd.documentoTemplateId !== id));
}

// ─── Vínculo Serviço ↔ Documento ─────────────────────────────────────────────

export function listarServicoDocumentos(): ServicoDocumento[] {
  return get<ServicoDocumento>(KEY_SVDOC, []);
}
export function listarDocsDeServico(servicoId: string): ServicoDocumento[] {
  return listarServicoDocumentos().filter((sd) => sd.servicoId === servicoId);
}
export function vincularDocumentoAoServico(
  servicoId: string,
  documentoTemplateId: string,
  obrigatorio: boolean,
): ServicoDocumento {
  const existing = listarServicoDocumentos().find(
    (sd) => sd.servicoId === servicoId && sd.documentoTemplateId === documentoTemplateId,
  );
  if (existing) {
    const updated = { ...existing, obrigatorio };
    set(KEY_SVDOC, listarServicoDocumentos().map((sd) => sd.id === existing.id ? updated : sd));
    return updated;
  }
  const item: ServicoDocumento = { id: gerarId(), servicoId, documentoTemplateId, obrigatorio };
  set(KEY_SVDOC, [...listarServicoDocumentos(), item]);
  return item;
}
export function desvincularDocumentoDoServico(servicoId: string, documentoTemplateId: string): void {
  set(
    KEY_SVDOC,
    listarServicoDocumentos().filter(
      (sd) => !(sd.servicoId === servicoId && sd.documentoTemplateId === documentoTemplateId),
    ),
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export function matchServicosPorProcedimento(procedimentos: string[]): Servico[] {
  const servicos = listarServicos();
  return servicos.filter((s) =>
    procedimentos.some((p) =>
      s.nome.toLowerCase().includes(p.toLowerCase()) ||
      p.toLowerCase().includes(s.nome.toLowerCase()),
    ),
  );
}

/**
 * Retorna a duração efetiva (em minutos) de um serviço para uma profissional.
 * Prioridade: duração personalizada da profissional > null (agenda usará duração do item do catálogo)
 */
export function duracaoEfetiva(profissional: Profissional, servicoId: string): number | null {
  return profissional.duracoesPorServico?.[servicoId] ?? null;
}
