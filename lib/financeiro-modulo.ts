// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FormaPagamentoFin =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'transferencia'
  | 'outro';

export type StatusParcela = 'pendente' | 'pago' | 'atrasado';
export type StatusVenda   = 'pago' | 'parcial' | 'atrasado' | 'pendente';

export interface Venda {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteWhatsapp: string;
  profissionalId: string;
  profissionalNome: string;
  procedimento: string;
  valorTotal: number;        // centavos
  formaPagamento: FormaPagamentoFin;
  numeroParcelas: number;
  dataEmissao: string;       // YYYY-MM-DD
  observacoes: string;
  createdAt: string;
}

export interface Parcela {
  id: string;
  vendaId: string;
  numero: number;
  totalParcelas: number;
  valor: number;             // centavos
  dataVencimento: string;    // YYYY-MM-DD
  dataPagamento: string | null;
  clienteId: string;
  clienteNome: string;
  clienteWhatsapp: string;
  profissionalId: string;
  profissionalNome: string;
  procedimento: string;
  formaPagamento: FormaPagamentoFin;
}

export interface NovaVendaInput {
  clienteId: string;
  clienteNome: string;
  clienteWhatsapp: string;
  profissionalId: string;
  profissionalNome: string;
  procedimento: string;
  valorTotal: number;
  formaPagamento: FormaPagamentoFin;
  numeroParcelas: number;
  primeiroVencimento: string;
  observacoes: string;
}

// ─── Labels e cores ────────────────────────────────────────────────────────────

export const FORMA_LABELS_FIN: Record<FormaPagamentoFin, string> = {
  dinheiro:       'Dinheiro',
  pix:            'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito:  'Cartão de Débito',
  boleto:         'Boleto',
  transferencia:  'Transferência',
  outro:          'Outro',
};

export const STATUS_VENDA_META: Record<StatusVenda, { label: string; bg: string; text: string }> = {
  pago:     { label: 'Pago',     bg: '#F0FDF4', text: '#16A34A' },
  parcial:  { label: 'Parcial',  bg: '#FFFBEB', text: '#D97706' },
  atrasado: { label: 'Atrasado', bg: '#FEF2F2', text: '#DC2626' },
  pendente: { label: 'Pendente', bg: '#F3F4F6', text: '#6B7280' },
};

export const STATUS_PARCELA_META: Record<StatusParcela, { label: string; dot: string; text: string; border: string }> = {
  pago:     { label: 'Pago',     dot: '#16A34A', text: '#15803D', border: '#BBF7D0' },
  pendente: { label: 'A vencer', dot: '#16A34A', text: '#15803D', border: '#BBF7D0' },
  atrasado: { label: 'Atrasado', dot: '#DC2626', text: '#DC2626', border: '#FECACA' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatCentavos(c: number): string {
  return (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseMoney(raw: string): number {
  const clean = raw.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

export function formatMoneyInput(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDataBR(iso: string): string {
  return iso.split('-').reverse().join('/');
}

function addMonths(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetMonth = m - 1 + n;
  const targetYear  = y + Math.floor(targetMonth / 12);
  const targetMon   = ((targetMonth % 12) + 12) % 12;
  const maxDay      = new Date(targetYear, targetMon + 1, 0).getDate();
  const day         = Math.min(d, maxDay);
  return `${targetYear}-${String(targetMon + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function gerarId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY_VENDAS   = 'fin_vendas_v1';
const KEY_PARCELAS = 'fin_parcelas_v1';

function readVendas(): Venda[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY_VENDAS) ?? '[]'); } catch { return []; }
}

function writeVendas(v: Venda[]) { localStorage.setItem(KEY_VENDAS, JSON.stringify(v)); }

function readParcelas(): Parcela[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY_PARCELAS) ?? '[]'); } catch { return []; }
}

function writeParcelas(p: Parcela[]) { localStorage.setItem(KEY_PARCELAS, JSON.stringify(p)); }

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function criarVenda(input: NovaVendaInput): { venda: Venda; parcelas: Parcela[] } {
  const venda: Venda = {
    id: gerarId(),
    ...input,
    dataEmissao: today(),
    createdAt: new Date().toISOString(),
  };

  const base  = Math.floor(input.valorTotal / input.numeroParcelas);
  const resto = input.valorTotal - base * input.numeroParcelas;

  const parcelas: Parcela[] = Array.from({ length: input.numeroParcelas }, (_, i) => ({
    id:             gerarId(),
    vendaId:        venda.id,
    numero:         i + 1,
    totalParcelas:  input.numeroParcelas,
    valor:          i === input.numeroParcelas - 1 ? base + resto : base,
    dataVencimento: addMonths(input.primeiroVencimento, i),
    dataPagamento:  null,
    clienteId:      input.clienteId,
    clienteNome:    input.clienteNome,
    clienteWhatsapp:input.clienteWhatsapp,
    profissionalId: input.profissionalId,
    profissionalNome:input.profissionalNome,
    procedimento:   input.procedimento,
    formaPagamento: input.formaPagamento,
  }));

  writeVendas([...readVendas(), venda]);
  writeParcelas([...readParcelas(), ...parcelas]);
  return { venda, parcelas };
}

export function listarVendas(): Venda[] {
  return readVendas().sort((a, b) => b.dataEmissao.localeCompare(a.dataEmissao));
}

export function listarParcelas(): Parcela[] {
  return readParcelas();
}

export function getParcelasDeVenda(vendaId: string): Parcela[] {
  return readParcelas().filter((p) => p.vendaId === vendaId);
}

export function marcarPago(parcelaId: string): void {
  writeParcelas(readParcelas().map((p) => p.id === parcelaId ? { ...p, dataPagamento: today() } : p));
}

export function deletarVenda(vendaId: string): void {
  writeVendas(readVendas().filter((v) => v.id !== vendaId));
  writeParcelas(readParcelas().filter((p) => p.vendaId !== vendaId));
}

// ─── Computações ──────────────────────────────────────────────────────────────

export function computeStatusParcela(p: Parcela): StatusParcela {
  if (p.dataPagamento) return 'pago';
  if (p.dataVencimento < today()) return 'atrasado';
  return 'pendente';
}

export function computeStatusVenda(vendaId: string): StatusVenda {
  const parcelas = getParcelasDeVenda(vendaId);
  if (!parcelas.length) return 'pendente';
  const todayStr = today();
  if (parcelas.every((p) => p.dataPagamento)) return 'pago';
  if (parcelas.some((p) => !p.dataPagamento && p.dataVencimento < todayStr)) return 'atrasado';
  if (parcelas.some((p) => p.dataPagamento)) return 'parcial';
  return 'pendente';
}

export interface DashboardMetrics {
  faturamentoMes: number;
  contasReceber: number;
  recebidoHoje: number;
  inadimplencia: number;
}

export function computeDashboard(): DashboardMetrics {
  const parcelas = readParcelas();
  const mesAtual = today().slice(0, 7);
  const todayStr = today();

  let faturamentoMes = 0, contasReceber = 0, recebidoHoje = 0, inadimplencia = 0;

  for (const p of parcelas) {
    if (p.dataPagamento) {
      if (p.dataPagamento.slice(0, 7) === mesAtual) faturamentoMes += p.valor;
      if (p.dataPagamento === todayStr) recebidoHoje += p.valor;
    } else {
      contasReceber += p.valor;
      if (p.dataVencimento < todayStr) inadimplencia += p.valor;
    }
  }

  return { faturamentoMes, contasReceber, recebidoHoje, inadimplencia };
}

export interface SemanaFluxo {
  label: string;
  inicio: string;
  fim: string;
  recebido: number;
  projecao: number;
}

export function computeFluxoCaixa(year: number, month: number): SemanaFluxo[] {
  const parcelas  = readParcelas();
  const lastDay   = new Date(year, month, 0).getDate();
  const todayStr  = today();
  const semanas: SemanaFluxo[] = [];

  let dia = 1;
  while (dia <= lastDay) {
    const fim = Math.min(dia + 6, lastDay);
    const inicio = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const fimStr = `${year}-${String(month).padStart(2, '0')}-${String(fim).padStart(2, '0')}`;

    let recebido = 0, projecao = 0;
    for (const p of parcelas) {
      if (p.dataPagamento && p.dataPagamento >= inicio && p.dataPagamento <= fimStr) recebido += p.valor;
      if (!p.dataPagamento && p.dataVencimento >= inicio && p.dataVencimento <= fimStr && p.dataVencimento >= todayStr) projecao += p.valor;
    }

    semanas.push({ label: `${dia}–${fim}/${String(month).padStart(2, '0')}`, inicio, fim: fimStr, recebido, projecao });
    dia += 7;
  }

  return semanas;
}

export interface ItemRelatorio { label: string; total: number; count: number }

export function computeRelatorioProfissional(inicio: string, fim: string): ItemRelatorio[] {
  const parcelas = readParcelas().filter(
    (p) => p.dataPagamento && p.dataPagamento >= inicio && p.dataPagamento <= fim,
  );
  const map = new Map<string, ItemRelatorio>();
  for (const p of parcelas) {
    const key = p.profissionalNome || 'Sem profissional';
    const cur = map.get(key) ?? { label: key, total: 0, count: 0 };
    map.set(key, { label: key, total: cur.total + p.valor, count: cur.count + 1 });
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function computeRelatorioProcedimento(inicio: string, fim: string): ItemRelatorio[] {
  const parcelas = readParcelas().filter(
    (p) => p.dataPagamento && p.dataPagamento >= inicio && p.dataPagamento <= fim,
  );
  const map = new Map<string, ItemRelatorio>();
  for (const p of parcelas) {
    const key = p.procedimento;
    const cur = map.get(key) ?? { label: key, total: 0, count: 0 };
    map.set(key, { label: key, total: cur.total + p.valor, count: cur.count + 1 });
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
