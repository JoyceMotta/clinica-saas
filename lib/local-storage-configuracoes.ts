// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Conselho {
  id: string;
  sigla: string;   // 'CRM', 'CRO'
  nome: string;    // 'Conselho Regional de Medicina'
}

export interface Especialidade {
  id: string;
  nome: string;
  conselhoId: string;
  cor: string;       // hex para badge na UI
  ativo: boolean;
  createdAt: string;
}

export interface Profissional {
  id: string;
  nome: string;
  especialidadeId: string;
  numeroConselho: string;   // apenas os dígitos, ex: '12345'
  ufConselho: string;       // 'SP', 'RJ', etc.
  servicoIds: string[];     // IDs dos serviços que este profissional realiza
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
  especialidadeId: string | null;   // null = multi-especialidade
  ativo: boolean;
  createdAt: string;
}

export interface ServicoDocumento {
  id: string;
  servicoId: string;
  documentoTemplateId: string;
  obrigatorio: boolean;   // true = obrigatório, false = opcional
}

// ─── Conselhos predefinidos (não editáveis) ───────────────────────────────────

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

// ─── Storage keys ────────────────────────────────────────────────────────────

const KEY_ESP   = 'clinica_especialidades_v1';
const KEY_PROF  = 'clinica_profissionais_v1';
const KEY_SERV  = 'clinica_servicos_v1';
const KEY_DOCT  = 'clinica_doc_templates_v1';
const KEY_SVDOC = 'clinica_servico_docs_v1';

// ─── Seed data ────────────────────────────────────────────────────────────────

const ESPECIALIDADES_SEED: Especialidade[] = [
  { id: 'e_med_est', nome: 'Medicina Estética',                conselhoId: 'c_crm',     cor: '#1B2A4A', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_derm',    nome: 'Dermatologia',                     conselhoId: 'c_crm',     cor: '#3B82F6', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_odonto',  nome: 'Odontologia Estética',             conselhoId: 'c_cro',     cor: '#10B981', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_hof',     nome: 'Harmonização Orofacial',           conselhoId: 'c_cro',     cor: '#6366F1', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_fisio',   nome: 'Fisioterapia Dermato-Funcional',   conselhoId: 'c_crefito', cor: '#F59E0B', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_bio',     nome: 'Biomedicina Estética',             conselhoId: 'c_cfbio',   cor: '#EC4899', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_enf',     nome: 'Enfermagem Estética',              conselhoId: 'c_coren',   cor: '#8B5CF6', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'e_nut',     nome: 'Nutrição Estética',                conselhoId: 'c_crn',     cor: '#14B8A6', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
];

const DOC_TEMPLATES_SEED: DocumentoTemplate[] = [
  { id: 'dt_contrato',     titulo: 'Contrato de Prestação de Serviços',                      descricao: 'Contrato geral para todos os serviços da clínica.',                          categoria: 'contrato', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_anamnese_g',   titulo: 'Ficha de Anamnese Geral',                                descricao: 'Histórico de saúde, alergias e medicamentos em uso.',                       categoria: 'anamnese', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_anamnese_o',   titulo: 'Ficha de Anamnese Odontológica',                         descricao: 'Histórico odontológico e condições bucais do paciente.',                    categoria: 'anamnese', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_imagem',       titulo: 'Termo de Autorização de Uso de Imagem e Voz',             descricao: 'Autoriza a clínica a usar fotos/vídeos do cliente para fins educativos.',   categoria: 'termo',    ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_politica',     titulo: 'Política de Agendamento e Cancelamento',                  descricao: 'Regras de agendamento, reagendamento e taxa de cancelamento.',              categoria: 'contrato', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_toxina',  titulo: 'TCLE — Toxina Botulínica',                               descricao: 'Consentimento específico para aplicação de toxina botulínica.',             categoria: 'tcle',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_preench', titulo: 'TCLE — Preenchimento Labial e Facial',                   descricao: 'Consentimento para preenchimentos com ácido hialurônico.',                  categoria: 'tcle',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_bio',     titulo: 'TCLE — Bioestimulador de Colágeno',                      descricao: 'Consentimento para Sculptra, Radiesse e similares.',                        categoria: 'tcle',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_pdo',     titulo: 'TCLE — Fio de PDO',                                     descricao: 'Consentimento para lifting com fio de polidioxanona.',                      categoria: 'tcle',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_peeling', titulo: 'TCLE — Peeling Químico e Luz Pulsada',                  descricao: 'Consentimento para peelings e tratamentos de fototerapia.',                 categoria: 'tcle',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_clear',   titulo: 'TCLE — Clareamento Dental',                              descricao: 'Consentimento para clareamento dental com peróxido.',                       categoria: 'tcle',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_tcle_hof',     titulo: 'TCLE — Harmonização Orofacial',                          descricao: 'Consentimento completo para HOF com preenchimento e toxina.',               categoria: 'tcle',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_termo_inv',    titulo: 'Termo de Responsabilidade — Procedimento Invasivo',       descricao: 'Declaração de ciência sobre riscos de procedimentos invasivos.',            categoria: 'termo',    ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_aviso_inj',    titulo: 'Aviso de Cuidados Pós-Procedimento Injetável',           descricao: 'Instruções de cuidados após injetáveis (toxina, preenchimento, bio).',      categoria: 'aviso',    ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'dt_conclusao',    titulo: 'Termo de Conclusão e Satisfação',                        descricao: 'Declaração de satisfação ao término do protocolo de tratamento.',           categoria: 'termo',    ativo: true, createdAt: '2024-01-01T00:00:00Z' },
];

const SERVICOS_SEED: Servico[] = [
  { id: 's_toxina',      nome: 'Toxina Botulínica',               descricao: 'Aplicação de toxina botulínica para rugas e hiperidrose.',              especialidadeId: 'e_med_est', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_preench_lab', nome: 'Preenchimento Labial',            descricao: 'Preenchimento dos lábios com ácido hialurônico.',                       especialidadeId: 'e_med_est', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_preench_sul', nome: 'Preenchimento de Sulcos e Mento', descricao: 'Preenchimento de sulcos nasogeniano, mento e bigode chinês.',           especialidadeId: 'e_med_est', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_bio',         nome: 'Bioestimulador de Colágeno',      descricao: 'Sculptra, Radiesse ou similares para estimulação de colágeno.',         especialidadeId: 'e_med_est', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_pdo',         nome: 'Fio de PDO',                      descricao: 'Lifting facial com fio de polidioxanona.',                              especialidadeId: 'e_med_est', ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_peeling',     nome: 'Peeling Químico',                 descricao: 'Esfoliação química superficial, média ou profunda.',                    especialidadeId: null,        ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_ipl',         nome: 'Luz Pulsada Intensa (IPL)',       descricao: 'Fototerapia para manchas, vasinhos e rejuvenescimento.',                especialidadeId: 'e_derm',    ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_limpeza',     nome: 'Limpeza de Pele Profissional',    descricao: 'Extração de comedões e higienização profunda.',                         especialidadeId: null,        ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_clear',       nome: 'Clareamento Dental',              descricao: 'Clareamento com peróxido de hidrogênio ou carbamida.',                  especialidadeId: 'e_odonto',  ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_facetas',     nome: 'Facetas / Lentes de Contato',     descricao: 'Facetas de porcelana ou resina composta.',                              especialidadeId: 'e_odonto',  ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_hof',         nome: 'Harmonização Orofacial',          descricao: 'Protocolo completo de HOF com toxina, preenchimento e outras técnicas.',especialidadeId: 'e_hof',     ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_drenagem',    nome: 'Drenagem Linfática',              descricao: 'Drenagem linfática manual para detox e pós-operatório.',                especialidadeId: 'e_fisio',   ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_massagem',    nome: 'Massagem Modeladora',             descricao: 'Massagem para contorno corporal e celulite.',                           especialidadeId: 'e_fisio',   ativo: true, createdAt: '2024-01-01T00:00:00Z' },
  { id: 's_ultrassom',   nome: 'Ultrassom Terapêutico',           descricao: 'Ultrassom focalizado para gordura localizada e fibrose.',               especialidadeId: 'e_fisio',   ativo: true, createdAt: '2024-01-01T00:00:00Z' },
];

function svdId(sId: string, dtId: string) {
  return `svd_${sId}_${dtId}`;
}

const SERVICO_DOCS_SEED: ServicoDocumento[] = [
  // Toxina Botulínica
  { id: svdId('s_toxina','dt_tcle_toxina'),  servicoId:'s_toxina',      documentoTemplateId:'dt_tcle_toxina',  obrigatorio: true  },
  { id: svdId('s_toxina','dt_anamnese_g'),   servicoId:'s_toxina',      documentoTemplateId:'dt_anamnese_g',   obrigatorio: true  },
  { id: svdId('s_toxina','dt_termo_inv'),    servicoId:'s_toxina',      documentoTemplateId:'dt_termo_inv',    obrigatorio: true  },
  { id: svdId('s_toxina','dt_aviso_inj'),    servicoId:'s_toxina',      documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },
  { id: svdId('s_toxina','dt_imagem'),       servicoId:'s_toxina',      documentoTemplateId:'dt_imagem',       obrigatorio: false },
  { id: svdId('s_toxina','dt_contrato'),     servicoId:'s_toxina',      documentoTemplateId:'dt_contrato',     obrigatorio: false },

  // Preenchimento Labial
  { id: svdId('s_preench_lab','dt_tcle_preench'), servicoId:'s_preench_lab', documentoTemplateId:'dt_tcle_preench', obrigatorio: true  },
  { id: svdId('s_preench_lab','dt_anamnese_g'),   servicoId:'s_preench_lab', documentoTemplateId:'dt_anamnese_g',   obrigatorio: true  },
  { id: svdId('s_preench_lab','dt_termo_inv'),    servicoId:'s_preench_lab', documentoTemplateId:'dt_termo_inv',    obrigatorio: true  },
  { id: svdId('s_preench_lab','dt_aviso_inj'),    servicoId:'s_preench_lab', documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },
  { id: svdId('s_preench_lab','dt_imagem'),       servicoId:'s_preench_lab', documentoTemplateId:'dt_imagem',       obrigatorio: false },

  // Preenchimento de Sulcos
  { id: svdId('s_preench_sul','dt_tcle_preench'), servicoId:'s_preench_sul', documentoTemplateId:'dt_tcle_preench', obrigatorio: true  },
  { id: svdId('s_preench_sul','dt_anamnese_g'),   servicoId:'s_preench_sul', documentoTemplateId:'dt_anamnese_g',   obrigatorio: true  },
  { id: svdId('s_preench_sul','dt_termo_inv'),    servicoId:'s_preench_sul', documentoTemplateId:'dt_termo_inv',    obrigatorio: true  },
  { id: svdId('s_preench_sul','dt_aviso_inj'),    servicoId:'s_preench_sul', documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },
  { id: svdId('s_preench_sul','dt_imagem'),       servicoId:'s_preench_sul', documentoTemplateId:'dt_imagem',       obrigatorio: false },

  // Bioestimulador
  { id: svdId('s_bio','dt_tcle_bio'),    servicoId:'s_bio', documentoTemplateId:'dt_tcle_bio',    obrigatorio: true  },
  { id: svdId('s_bio','dt_anamnese_g'), servicoId:'s_bio', documentoTemplateId:'dt_anamnese_g',   obrigatorio: true  },
  { id: svdId('s_bio','dt_termo_inv'),  servicoId:'s_bio', documentoTemplateId:'dt_termo_inv',    obrigatorio: true  },
  { id: svdId('s_bio','dt_aviso_inj'), servicoId:'s_bio', documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },
  { id: svdId('s_bio','dt_imagem'),    servicoId:'s_bio', documentoTemplateId:'dt_imagem',       obrigatorio: false },

  // Fio de PDO
  { id: svdId('s_pdo','dt_tcle_pdo'),    servicoId:'s_pdo', documentoTemplateId:'dt_tcle_pdo',    obrigatorio: true  },
  { id: svdId('s_pdo','dt_anamnese_g'), servicoId:'s_pdo', documentoTemplateId:'dt_anamnese_g',   obrigatorio: true  },
  { id: svdId('s_pdo','dt_termo_inv'),  servicoId:'s_pdo', documentoTemplateId:'dt_termo_inv',    obrigatorio: true  },
  { id: svdId('s_pdo','dt_aviso_inj'), servicoId:'s_pdo', documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },

  // Peeling Químico
  { id: svdId('s_peeling','dt_tcle_peeling'), servicoId:'s_peeling', documentoTemplateId:'dt_tcle_peeling', obrigatorio: true  },
  { id: svdId('s_peeling','dt_anamnese_g'),   servicoId:'s_peeling', documentoTemplateId:'dt_anamnese_g',   obrigatorio: true  },
  { id: svdId('s_peeling','dt_aviso_inj'),    servicoId:'s_peeling', documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },
  { id: svdId('s_peeling','dt_imagem'),       servicoId:'s_peeling', documentoTemplateId:'dt_imagem',       obrigatorio: false },

  // IPL
  { id: svdId('s_ipl','dt_tcle_peeling'), servicoId:'s_ipl', documentoTemplateId:'dt_tcle_peeling', obrigatorio: true  },
  { id: svdId('s_ipl','dt_anamnese_g'),   servicoId:'s_ipl', documentoTemplateId:'dt_anamnese_g',   obrigatorio: true  },
  { id: svdId('s_ipl','dt_aviso_inj'),    servicoId:'s_ipl', documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },

  // Limpeza de Pele
  { id: svdId('s_limpeza','dt_anamnese_g'), servicoId:'s_limpeza', documentoTemplateId:'dt_anamnese_g', obrigatorio: true  },
  { id: svdId('s_limpeza','dt_aviso_inj'),  servicoId:'s_limpeza', documentoTemplateId:'dt_aviso_inj',  obrigatorio: false },

  // Clareamento Dental
  { id: svdId('s_clear','dt_tcle_clear'),   servicoId:'s_clear', documentoTemplateId:'dt_tcle_clear',   obrigatorio: true  },
  { id: svdId('s_clear','dt_anamnese_o'),   servicoId:'s_clear', documentoTemplateId:'dt_anamnese_o',   obrigatorio: true  },
  { id: svdId('s_clear','dt_aviso_inj'),    servicoId:'s_clear', documentoTemplateId:'dt_aviso_inj',    obrigatorio: false },

  // Facetas
  { id: svdId('s_facetas','dt_anamnese_o'), servicoId:'s_facetas', documentoTemplateId:'dt_anamnese_o', obrigatorio: true  },
  { id: svdId('s_facetas','dt_contrato'),   servicoId:'s_facetas', documentoTemplateId:'dt_contrato',   obrigatorio: true  },
  { id: svdId('s_facetas','dt_conclusao'),  servicoId:'s_facetas', documentoTemplateId:'dt_conclusao',  obrigatorio: false },

  // Harmonização Orofacial
  { id: svdId('s_hof','dt_tcle_hof'),     servicoId:'s_hof', documentoTemplateId:'dt_tcle_hof',     obrigatorio: true  },
  { id: svdId('s_hof','dt_tcle_preench'), servicoId:'s_hof', documentoTemplateId:'dt_tcle_preench', obrigatorio: true  },
  { id: svdId('s_hof','dt_tcle_toxina'),  servicoId:'s_hof', documentoTemplateId:'dt_tcle_toxina',  obrigatorio: true  },
  { id: svdId('s_hof','dt_anamnese_o'),   servicoId:'s_hof', documentoTemplateId:'dt_anamnese_o',   obrigatorio: true  },
  { id: svdId('s_hof','dt_termo_inv'),    servicoId:'s_hof', documentoTemplateId:'dt_termo_inv',    obrigatorio: true  },
  { id: svdId('s_hof','dt_aviso_inj'),    servicoId:'s_hof', documentoTemplateId:'dt_aviso_inj',    obrigatorio: true  },
  { id: svdId('s_hof','dt_imagem'),       servicoId:'s_hof', documentoTemplateId:'dt_imagem',       obrigatorio: false },

  // Drenagem Linfática
  { id: svdId('s_drenagem','dt_anamnese_g'), servicoId:'s_drenagem', documentoTemplateId:'dt_anamnese_g', obrigatorio: true  },

  // Massagem Modeladora
  { id: svdId('s_massagem','dt_anamnese_g'), servicoId:'s_massagem', documentoTemplateId:'dt_anamnese_g', obrigatorio: true  },

  // Ultrassom
  { id: svdId('s_ultrassom','dt_anamnese_g'), servicoId:'s_ultrassom', documentoTemplateId:'dt_anamnese_g', obrigatorio: true  },
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
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Especialidades ───────────────────────────────────────────────────────────

export function listarEspecialidades(): Especialidade[] {
  return get(KEY_ESP, ESPECIALIDADES_SEED);
}

export function criarEspecialidade(data: Omit<Especialidade, 'id' | 'createdAt'>): Especialidade {
  const esp: Especialidade = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_ESP, [...listarEspecialidades(), esp]);
  return esp;
}

export function atualizarEspecialidade(id: string, patch: Partial<Especialidade>): void {
  set(KEY_ESP, listarEspecialidades().map((e) => e.id === id ? { ...e, ...patch } : e));
}

export function deletarEspecialidade(id: string): void {
  set(KEY_ESP, listarEspecialidades().filter((e) => e.id !== id));
}

// ─── Profissionais ────────────────────────────────────────────────────────────

export function listarProfissionais(): Profissional[] {
  return get(KEY_PROF, []);
}

export function criarProfissional(data: Omit<Profissional, 'id' | 'createdAt'>): Profissional {
  const p: Profissional = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_PROF, [...listarProfissionais(), p]);
  return p;
}

export function atualizarProfissional(id: string, patch: Partial<Profissional>): void {
  set(KEY_PROF, listarProfissionais().map((p) => p.id === id ? { ...p, ...patch } : p));
}

export function deletarProfissional(id: string): void {
  set(KEY_PROF, listarProfissionais().filter((p) => p.id !== id));
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

export function listarServicos(): Servico[] {
  return get(KEY_SERV, SERVICOS_SEED);
}

export function criarServico(data: Omit<Servico, 'id' | 'createdAt'>): Servico {
  const s: Servico = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_SERV, [...listarServicos(), s]);
  return s;
}

export function atualizarServico(id: string, patch: Partial<Servico>): void {
  set(KEY_SERV, listarServicos().map((s) => s.id === id ? { ...s, ...patch } : s));
}

export function deletarServico(id: string): void {
  set(KEY_SERV, listarServicos().filter((s) => s.id !== id));
  // Limpa vínculos
  set(KEY_SVDOC, listarServicoDocumentos().filter((sv) => sv.servicoId !== id));
}

// ─── Documento Templates ──────────────────────────────────────────────────────

export function listarDocumentoTemplates(): DocumentoTemplate[] {
  return get(KEY_DOCT, DOC_TEMPLATES_SEED);
}

export function criarDocumentoTemplate(data: Omit<DocumentoTemplate, 'id' | 'createdAt'>): DocumentoTemplate {
  const dt: DocumentoTemplate = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_DOCT, [...listarDocumentoTemplates(), dt]);
  return dt;
}

export function atualizarDocumentoTemplate(id: string, patch: Partial<DocumentoTemplate>): void {
  set(KEY_DOCT, listarDocumentoTemplates().map((dt) => dt.id === id ? { ...dt, ...patch } : dt));
}

export function deletarDocumentoTemplate(id: string): void {
  set(KEY_DOCT, listarDocumentoTemplates().filter((dt) => dt.id !== id));
  set(KEY_SVDOC, listarServicoDocumentos().filter((sv) => sv.documentoTemplateId !== id));
}

// ─── Vínculo Serviço ↔ DocumentoTemplate ─────────────────────────────────────

export function listarServicoDocumentos(): ServicoDocumento[] {
  return get(KEY_SVDOC, SERVICO_DOCS_SEED);
}

export function listarDocsDeServico(servicoId: string): ServicoDocumento[] {
  return listarServicoDocumentos().filter((sv) => sv.servicoId === servicoId);
}

export function vincularDocumentoAoServico(
  servicoId: string,
  documentoTemplateId: string,
  obrigatorio: boolean,
): ServicoDocumento {
  const all = listarServicoDocumentos();
  const existente = all.find((sv) => sv.servicoId === servicoId && sv.documentoTemplateId === documentoTemplateId);
  if (existente) {
    const atualizado = { ...existente, obrigatorio };
    set(KEY_SVDOC, all.map((sv) => sv.id === existente.id ? atualizado : sv));
    return atualizado;
  }
  const novo: ServicoDocumento = {
    id:                  gerarId(),
    servicoId,
    documentoTemplateId,
    obrigatorio,
  };
  set(KEY_SVDOC, [...all, novo]);
  return novo;
}

export function desvincularDocumentoDoServico(servicoId: string, documentoTemplateId: string): void {
  set(KEY_SVDOC, listarServicoDocumentos().filter(
    (sv) => !(sv.servicoId === servicoId && sv.documentoTemplateId === documentoTemplateId),
  ));
}

// ─── Helper: match de procedimento → serviços ─────────────────────────────────
// Usado pela TabDocumentos para filtrar documentos relevantes ao cliente.

export function matchServicosPorProcedimento(procedimentos: string[]): Servico[] {
  const servicos = listarServicos().filter((s) => s.ativo);
  if (!procedimentos.length) return [];
  return servicos.filter((s) =>
    procedimentos.some((p) => {
      const pLow = p.toLowerCase().trim();
      const sLow = s.nome.toLowerCase().trim();
      return pLow.includes(sLow) || sLow.includes(pLow);
    }),
  );
}
