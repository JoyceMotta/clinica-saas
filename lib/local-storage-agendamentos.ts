import { registrarAuditoria } from './local-storage-auditoria';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusAgendamento =
  | 'agendado'
  | 'confirmado'
  | 'realizado'
  | 'cancelado'
  | 'faltou';

export interface Agendamento {
  id: string;
  clienteId: string;
  data: string;       // YYYY-MM-DD
  hora: string;       // HH:MM
  procedimento: string;
  profissional: string;
  duracaoMin?: number; // duração em minutos (default visual: 30)
  status: StatusAgendamento;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AgendamentoInput = Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt'>;

export const STATUS_LABELS: Record<StatusAgendamento, string> = {
  agendado:   'Agendado',
  confirmado: 'Confirmado',
  realizado:  'Realizado',
  cancelado:  'Cancelado',
  faltou:     'Faltou',
};

export const STATUS_COLORS: Record<StatusAgendamento, { bg: string; text: string }> = {
  agendado:   { bg: '#EFF6FF', text: '#1D4ED8' },
  confirmado: { bg: '#F0FDF4', text: '#16A34A' },
  realizado:  { bg: '#F3F4F6', text: '#374151' },
  cancelado:  { bg: '#FEF2F2', text: '#DC2626' },
  faltou:     { bg: '#FFF7ED', text: '#C2410C' },
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'clinica_agendamentos_v1';

function todos(): Agendamento[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function salvar(items: Agendamento[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function gerar(): string {
  return `ag_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function listarTodosAgendamentos(): Agendamento[] {
  return todos().sort((a, b) => {
    const da = `${a.data}T${a.hora}`;
    const db = `${b.data}T${b.hora}`;
    return da.localeCompare(db);
  });
}

export function listarAgendamentosCliente(clienteId: string): Agendamento[] {
  return todos()
    .filter((a) => a.clienteId === clienteId)
    .sort((a, b) => {
      const da = `${a.data}T${a.hora}`;
      const db = `${b.data}T${b.hora}`;
      return db.localeCompare(da); // mais recente primeiro
    });
}

export function criarAgendamento(input: AgendamentoInput): Agendamento {
  const agora = new Date().toISOString();
  const novo: Agendamento = { ...input, id: gerar(), createdAt: agora, updatedAt: agora };
  const all = todos();
  all.push(novo);
  salvar(all);

  // ── Auditoria ──
  if (typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'CRIOU',
      entidade:  'agendamento',
      entidadeId: novo.id,
      clienteId: input.clienteId,
      descricao: `Agendou "${input.procedimento}" em ${formatarDataBr(input.data)} às ${input.hora} com ${input.profissional}`,
    });
  }

  return novo;
}

export function atualizarAgendamento(
  id: string,
  patch: Partial<Omit<Agendamento, 'id' | 'clienteId' | 'createdAt'>>,
): Agendamento | null {
  const all = todos();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const antes   = all[idx];
  const updated = { ...antes, ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  salvar(all);

  // ── Auditoria — registrar campos alterados ──
  if (typeof window !== 'undefined') {
    if (patch.status && patch.status !== antes.status) {
      registrarAuditoria({
        acao:          'EDITOU',
        entidade:      'agendamento',
        entidadeId:    id,
        clienteId:     antes.clienteId,
        descricao:     `Alterou status do agendamento "${antes.procedimento}" de "${STATUS_LABELS[antes.status]}" para "${STATUS_LABELS[patch.status]}"`,
        campoAlterado: 'Status',
        valorAnterior: STATUS_LABELS[antes.status],
        valorNovo:     STATUS_LABELS[patch.status],
      });
    }

    if (patch.data && patch.data !== antes.data) {
      registrarAuditoria({
        acao:          'EDITOU',
        entidade:      'agendamento',
        entidadeId:    id,
        clienteId:     antes.clienteId,
        descricao:     `Remarcou "${antes.procedimento}" de ${formatarDataBr(antes.data)} para ${formatarDataBr(patch.data)}`,
        campoAlterado: 'Data',
        valorAnterior: formatarDataBr(antes.data),
        valorNovo:     formatarDataBr(patch.data),
      });
    }

    if (patch.hora && patch.hora !== antes.hora) {
      registrarAuditoria({
        acao:          'EDITOU',
        entidade:      'agendamento',
        entidadeId:    id,
        clienteId:     antes.clienteId,
        descricao:     `Alterou horário de "${antes.procedimento}" de ${antes.hora} para ${patch.hora}`,
        campoAlterado: 'Horário',
        valorAnterior: antes.hora,
        valorNovo:     patch.hora,
      });
    }
  }

  return updated;
}

export function deletarAgendamento(id: string): void {
  const ag = todos().find((a) => a.id === id);
  salvar(todos().filter((a) => a.id !== id));

  // ── Auditoria ──
  if (typeof window !== 'undefined' && ag) {
    registrarAuditoria({
      acao:      'EXCLUIU',
      entidade:  'agendamento',
      entidadeId: id,
      clienteId: ag.clienteId,
      descricao: `Excluiu agendamento de "${ag.procedimento}" em ${formatarDataBr(ag.data)} às ${ag.hora}`,
    });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatarDataBr(iso: string): string {
  // YYYY-MM-DD → DD/MM/YYYY
  if (!iso || iso.length < 10) return iso;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}
