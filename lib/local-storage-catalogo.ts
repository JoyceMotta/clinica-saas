// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CategoriaItem = 'consulta' | 'procedimento' | 'produto_fisico' | 'pacote_sessoes';
export type TipoFiscal    = 'servico' | 'produto';
export type FormaPagamento = 'pix' | 'credito' | 'debito' | 'boleto' | 'dinheiro';

export const CATEGORIA_LABELS: Record<CategoriaItem, string> = {
  consulta:       'Consulta',
  procedimento:   'Procedimento Estético',
  produto_fisico: 'Produto Físico',
  pacote_sessoes: 'Pacote de Sessões',
};

export const FORMA_LABELS: Record<FormaPagamento, string> = {
  pix:      'PIX',
  credito:  'Cartão Crédito',
  debito:   'Cartão Débito',
  boleto:   'Boleto',
  dinheiro: 'Dinheiro',
};

export interface InsumoVinculado {
  nome: string;
  quantidade: number;
  unidade: string;
}

export interface ItemCatalogo {
  id: string;
  nome: string;
  categoria: CategoriaItem;
  tipoFiscal: TipoFiscal;
  valorUnitario: number;       // centavos
  valorPacote: number | null;  // centavos
  formasPagamento: FormaPagamento[];
  parcelamentoMaximo: Partial<Record<FormaPagamento, number>>;
  descontoPix: number | null;  // percentual 0–100
  insumos: InsumoVinculado[];
  documentosIds: string[];
  intervaloRecompra: number | null;  // dias
  ativo: boolean;
  createdAt: string;
}

export interface PacoteCatalogo {
  id: string;
  nome: string;
  descricao: string;
  itensIds: string[];
  valorPacote: number;  // centavos
  ativo: boolean;
  createdAt: string;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_ITENS   = 'clinica_catalogo_itens_v1';
const KEY_PACOTES = 'clinica_catalogo_pacotes_v1';

// ─── Seed ─────────────────────────────────────────────────────────────────────

const ITENS_SEED: ItemCatalogo[] = [
  {
    id: 'cat_consulta',
    nome: 'Consulta Médica',
    categoria: 'consulta',
    tipoFiscal: 'servico',
    valorUnitario: 35000,
    valorPacote: null,
    formasPagamento: ['pix', 'credito', 'debito', 'dinheiro'],
    parcelamentoMaximo: {},
    descontoPix: null,
    insumos: [],
    documentosIds: ['dt_anamnese_g'],
    intervaloRecompra: 90,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_toxina',
    nome: 'Toxina Botulínica',
    categoria: 'procedimento',
    tipoFiscal: 'servico',
    valorUnitario: 80000,
    valorPacote: null,
    formasPagamento: ['pix', 'credito', 'debito', 'dinheiro'],
    parcelamentoMaximo: { credito: 6 },
    descontoPix: 5,
    insumos: [{ nome: 'Toxina Botulínica 100U', quantidade: 1, unidade: 'frasco' }],
    documentosIds: ['dt_tcle_toxina', 'dt_anamnese_g', 'dt_termo_inv', 'dt_aviso_inj'],
    intervaloRecompra: 180,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_preench_lab',
    nome: 'Preenchimento Labial',
    categoria: 'procedimento',
    tipoFiscal: 'servico',
    valorUnitario: 90000,
    valorPacote: null,
    formasPagamento: ['pix', 'credito', 'debito', 'dinheiro'],
    parcelamentoMaximo: { credito: 6 },
    descontoPix: 5,
    insumos: [{ nome: 'Ácido Hialurônico 1ml', quantidade: 1, unidade: 'seringa' }],
    documentosIds: ['dt_tcle_preench', 'dt_anamnese_g', 'dt_termo_inv', 'dt_aviso_inj'],
    intervaloRecompra: 365,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_bioestimulador',
    nome: 'Bioestimulador de Colágeno',
    categoria: 'procedimento',
    tipoFiscal: 'servico',
    valorUnitario: 150000,
    valorPacote: 270000,
    formasPagamento: ['pix', 'credito', 'boleto'],
    parcelamentoMaximo: { credito: 12, boleto: 3 },
    descontoPix: 8,
    insumos: [{ nome: 'Sculptra 1 frasco', quantidade: 1, unidade: 'frasco' }],
    documentosIds: ['dt_tcle_bio', 'dt_anamnese_g', 'dt_termo_inv', 'dt_aviso_inj'],
    intervaloRecompra: 365,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_peeling',
    nome: 'Peeling Químico',
    categoria: 'procedimento',
    tipoFiscal: 'servico',
    valorUnitario: 25000,
    valorPacote: 60000,
    formasPagamento: ['pix', 'credito', 'debito', 'dinheiro'],
    parcelamentoMaximo: { credito: 3 },
    descontoPix: 5,
    insumos: [{ nome: 'TCA 30%', quantidade: 5, unidade: 'ml' }],
    documentosIds: ['dt_tcle_peeling', 'dt_anamnese_g', 'dt_aviso_inj'],
    intervaloRecompra: 30,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_hof',
    nome: 'Harmonização Orofacial',
    categoria: 'procedimento',
    tipoFiscal: 'servico',
    valorUnitario: 200000,
    valorPacote: null,
    formasPagamento: ['pix', 'credito', 'boleto'],
    parcelamentoMaximo: { credito: 12, boleto: 3 },
    descontoPix: 5,
    insumos: [
      { nome: 'Ácido Hialurônico 1ml', quantidade: 2, unidade: 'seringa' },
      { nome: 'Toxina Botulínica 100U', quantidade: 1, unidade: 'frasco' },
    ],
    documentosIds: ['dt_tcle_hof', 'dt_tcle_preench', 'dt_tcle_toxina', 'dt_anamnese_o', 'dt_termo_inv'],
    intervaloRecompra: 180,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_pkt_peeling',
    nome: 'Pacote Peeling 3 Sessões',
    categoria: 'pacote_sessoes',
    tipoFiscal: 'servico',
    valorUnitario: 25000,
    valorPacote: 60000,
    formasPagamento: ['pix', 'credito', 'boleto'],
    parcelamentoMaximo: { credito: 6, boleto: 3 },
    descontoPix: 10,
    insumos: [],
    documentosIds: ['dt_tcle_peeling', 'dt_anamnese_g'],
    intervaloRecompra: null,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_prot_solar',
    nome: 'Protetor Solar FPS 70',
    categoria: 'produto_fisico',
    tipoFiscal: 'produto',
    valorUnitario: 8900,
    valorPacote: null,
    formasPagamento: ['pix', 'credito', 'debito', 'dinheiro'],
    parcelamentoMaximo: {},
    descontoPix: 10,
    insumos: [],
    documentosIds: [],
    intervaloRecompra: 60,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat_vitamina_c',
    nome: 'Sérum Vitamina C 30ml',
    categoria: 'produto_fisico',
    tipoFiscal: 'produto',
    valorUnitario: 12000,
    valorPacote: null,
    formasPagamento: ['pix', 'credito', 'debito', 'dinheiro'],
    parcelamentoMaximo: {},
    descontoPix: 10,
    insumos: [],
    documentosIds: [],
    intervaloRecompra: 45,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const PACOTES_SEED: PacoteCatalogo[] = [
  {
    id: 'pkt_harmonizacao',
    nome: 'Protocolo Harmonização Completa',
    descricao: 'Toxina Botulínica + Preenchimento Labial + Bioestimulador de Colágeno',
    itensIds: ['cat_toxina', 'cat_preench_lab', 'cat_bioestimulador'],
    valorPacote: 290000,
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Itens ────────────────────────────────────────────────────────────────────

export function listarItens(): ItemCatalogo[] {
  return get(KEY_ITENS, ITENS_SEED);
}

export function criarItem(data: Omit<ItemCatalogo, 'id' | 'createdAt'>): ItemCatalogo {
  const item: ItemCatalogo = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_ITENS, [...listarItens(), item]);
  return item;
}

export function atualizarItem(id: string, patch: Partial<ItemCatalogo>): void {
  set(KEY_ITENS, listarItens().map((i) => i.id === id ? { ...i, ...patch } : i));
}

export function deletarItem(id: string): void {
  set(KEY_ITENS, listarItens().filter((i) => i.id !== id));
}

// ─── Pacotes ──────────────────────────────────────────────────────────────────

export function listarPacotes(): PacoteCatalogo[] {
  return get(KEY_PACOTES, PACOTES_SEED);
}

export function criarPacote(data: Omit<PacoteCatalogo, 'id' | 'createdAt'>): PacoteCatalogo {
  const p: PacoteCatalogo = { ...data, id: gerarId(), createdAt: new Date().toISOString() };
  set(KEY_PACOTES, [...listarPacotes(), p]);
  return p;
}

export function atualizarPacote(id: string, patch: Partial<PacoteCatalogo>): void {
  set(KEY_PACOTES, listarPacotes().map((p) => p.id === id ? { ...p, ...patch } : p));
}

export function deletarPacote(id: string): void {
  set(KEY_PACOTES, listarPacotes().filter((p) => p.id !== id));
}
