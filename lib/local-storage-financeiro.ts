import { registrarAuditoria } from './local-storage-auditoria';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'outro';

export type StatusPagamento = 'pago' | 'parcial' | 'pendente' | 'cancelado';

export interface LancamentoFinanceiro {
  id: string;
  clienteId: string;
  data: string;           // YYYY-MM-DD
  descricao: string;      // procedimento / serviço
  valor: number;          // em centavos
  valorPago: number;      // em centavos
  formaPagamento: FormaPagamento;
  parcelas?: number;      // total de parcelas (1 = à vista)
  parcelaAtual?: number;  // parcela corrente
  status: StatusPagamento;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LancamentoInput = Omit<LancamentoFinanceiro, 'id' | 'createdAt' | 'updatedAt'>;

export const FORMA_LABELS: Record<FormaPagamento, string> = {
  dinheiro:       'Dinheiro',
  pix:            'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito:  'Cartão de Débito',
  boleto:         'Boleto',
  outro:          'Outro',
};

export const STATUS_PAG_LABELS: Record<StatusPagamento, string> = {
  pago:      'Pago',
  parcial:   'Parcial',
  pendente:  'Pendente',
  cancelado: 'Cancelado',
};

export const STATUS_PAG_COLORS: Record<StatusPagamento, { bg: string; text: string }> = {
  pago:      { bg: '#F0FDF4', text: '#16A34A' },
  parcial:   { bg: '#FFFBEB', text: '#D97706' },
  pendente:  { bg: '#FEF2F2', text: '#DC2626' },
  cancelado: { bg: '#F3F4F6', text: '#6B7280' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'clinica_financeiro_v1';

function todos(): LancamentoFinanceiro[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function salvar(items: LancamentoFinanceiro[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function gerar(): string {
  return `fin_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function listarLancamentosCliente(clienteId: string): LancamentoFinanceiro[] {
  return todos()
    .filter((l) => l.clienteId === clienteId)
    .sort((a, b) => b.data.localeCompare(a.data)); // mais recente primeiro
}

export function totalGastoCliente(clienteId: string): number {
  return listarLancamentosCliente(clienteId)
    .filter((l) => l.status !== 'cancelado')
    .reduce((acc, l) => acc + l.valorPago, 0);
}

export function criarLancamento(input: LancamentoInput): LancamentoFinanceiro {
  const agora = new Date().toISOString();
  const novo: LancamentoFinanceiro = { ...input, id: gerar(), createdAt: agora, updatedAt: agora };
  const all = todos();
  all.push(novo);
  salvar(all);

  // ── Auditoria ──
  if (typeof window !== 'undefined') {
    const parcInfo = (input.parcelas ?? 1) > 1
      ? ` (parcela ${input.parcelaAtual}/${input.parcelas})`
      : '';
    registrarAuditoria({
      acao:      'CRIOU',
      entidade:  'financeiro',
      entidadeId: novo.id,
      clienteId: input.clienteId,
      descricao: `Registrou lançamento de ${formatarMoeda(input.valor)} — ${input.descricao}${parcInfo} via ${FORMA_LABELS[input.formaPagamento]} (${STATUS_PAG_LABELS[input.status]})`,
    });
  }

  return novo;
}

export function atualizarLancamento(
  id: string,
  patch: Partial<Omit<LancamentoFinanceiro, 'id' | 'clienteId' | 'createdAt'>>,
): LancamentoFinanceiro | null {
  const all = todos();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const antes   = all[idx];
  const updated = { ...antes, ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  salvar(all);

  // ── Auditoria ──
  if (typeof window !== 'undefined') {
    if (patch.status && patch.status !== antes.status) {
      registrarAuditoria({
        acao:          'EDITOU',
        entidade:      'financeiro',
        entidadeId:    id,
        clienteId:     antes.clienteId,
        descricao:     `Alterou status do lançamento "${antes.descricao}" de "${STATUS_PAG_LABELS[antes.status]}" para "${STATUS_PAG_LABELS[patch.status]}"`,
        campoAlterado: 'Status pagamento',
        valorAnterior: STATUS_PAG_LABELS[antes.status],
        valorNovo:     STATUS_PAG_LABELS[patch.status],
      });
    }

    if (patch.valorPago !== undefined && patch.valorPago !== antes.valorPago) {
      registrarAuditoria({
        acao:          'EDITOU',
        entidade:      'financeiro',
        entidadeId:    id,
        clienteId:     antes.clienteId,
        descricao:     `Alterou valor pago de "${antes.descricao}" de ${formatarMoeda(antes.valorPago)} para ${formatarMoeda(patch.valorPago)}`,
        campoAlterado: 'Valor pago',
        valorAnterior: formatarMoeda(antes.valorPago),
        valorNovo:     formatarMoeda(patch.valorPago),
      });
    }
  }

  return updated;
}

export function deletarLancamento(id: string): void {
  const lan = todos().find((l) => l.id === id);
  salvar(todos().filter((l) => l.id !== id));

  // ── Auditoria ──
  if (typeof window !== 'undefined' && lan) {
    registrarAuditoria({
      acao:      'EXCLUIU',
      entidade:  'financeiro',
      entidadeId: id,
      clienteId: lan.clienteId,
      descricao: `Excluiu lançamento de ${formatarMoeda(lan.valor)} — ${lan.descricao}`,
      valorAnterior: formatarMoeda(lan.valor),
    });
  }
}
