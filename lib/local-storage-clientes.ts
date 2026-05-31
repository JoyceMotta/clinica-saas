import type { ClienteInput } from './types';
import { registrarAuditoria } from './local-storage-auditoria';

export type ClienteLocal = ClienteInput & {
  id: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};

const STORAGE_KEY = 'clinica_clientes_v1';

// ─── Helpers internos ─────────────────────────────────────────────────────────

function readAll(): ClienteLocal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClienteLocal[]) : [];
  } catch {
    return [];
  }
}

function writeAll(clientes: ClienteLocal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

// ─── Labels dos campos para auditoria ─────────────────────────────────────────

const CAMPO_LABELS: Partial<Record<keyof ClienteInput, string>> = {
  nome:              'Nome completo',
  cpf:               'CPF',
  rg:                'RG',
  rgOrgaoEmissor:    'Órgão Emissor do RG',
  dataNascimento:    'Data de Nascimento',
  sexo:              'Sexo',
  estadoCivil:       'Estado Civil',
  profissao:         'Profissão',
  nacionalidade:     'Nacionalidade',
  whatsapp:          'WhatsApp',
  telefoneFix:       'Telefone Fixo',
  email:             'Email',
  cep:               'CEP',
  rua:               'Rua',
  numero:            'Número',
  complemento:       'Complemento',
  bairro:            'Bairro',
  cidade:            'Cidade',
  uf:                'UF',
  nomeEmergencia:    'Contato de Emergência',
  telefoneEmergencia:'Telefone de Emergência',
  comoConheceu:      'Como Conheceu',
  menorDeIdade:      'Menor de Idade',
};

const CAMPOS_AUDITADOS: (keyof ClienteInput)[] = Object.keys(CAMPO_LABELS) as (keyof ClienteInput)[];

// ─── API pública ──────────────────────────────────────────────────────────────

export function listarClientesLocal(query = ''): ClienteLocal[] {
  const all = readAll().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const q = query.trim().toLowerCase();
  if (!q) return all;
  const digits = q.replace(/\D/g, '');
  return all.filter(
    (c) =>
      c.nome.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (digits && c.cpf.replace(/\D/g, '').includes(digits)) ||
      (digits && c.whatsapp.replace(/\D/g, '').includes(digits)),
  );
}

export function buscarClienteLocalPorId(id: string): ClienteLocal | null {
  return readAll().find((c) => c.id === id) ?? null;
}

export function salvarClienteLocal(data: ClienteInput): string {
  const all = readAll();
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  writeAll([...all, { ...data, id, createdAt: now, updatedAt: now }]);

  // ── Auditoria ──
  if (typeof window !== 'undefined') {
    registrarAuditoria({
      acao:      'CRIOU',
      entidade:  'cliente',
      entidadeId: id,
      clienteId: id,
      descricao: `Cadastrou o cliente "${data.nome}"`,
    });
  }

  return id;
}

/**
 * Atualiza campos do cliente e registra cada campo alterado na auditoria.
 * Disponível para quando a página /clientes/[id]/editar for implementada.
 */
export function atualizarClienteLocal(
  id: string,
  patch: Partial<ClienteInput>,
): ClienteLocal | null {
  const all = readAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const antes = all[idx];
  const updated: ClienteLocal = { ...antes, ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  writeAll(all);

  // ── Auditoria — um registro por campo alterado ──
  if (typeof window !== 'undefined') {
    for (const campo of CAMPOS_AUDITADOS) {
      if (!(campo in patch)) continue;
      const vAntes = String(antes[campo] ?? '');
      const vNovo  = String((patch as Record<string, unknown>)[campo] ?? '');
      if (vAntes === vNovo) continue;

      registrarAuditoria({
        acao:          'EDITOU',
        entidade:      'cliente',
        entidadeId:    id,
        clienteId:     id,
        descricao:     `Editou "${CAMPO_LABELS[campo] ?? campo}" do cliente "${antes.nome}"`,
        campoAlterado: CAMPO_LABELS[campo] ?? campo,
        valorAnterior: vAntes,
        valorNovo:     vNovo,
      });
    }
  }

  return updated;
}

export function deletarClienteLocal(id: string): void {
  const cliente = buscarClienteLocalPorId(id);
  writeAll(readAll().filter((c) => c.id !== id));

  // ── Auditoria ──
  if (typeof window !== 'undefined' && cliente) {
    registrarAuditoria({
      acao:      'EXCLUIU',
      entidade:  'cliente',
      entidadeId: id,
      clienteId: id,
      descricao: `Excluiu o cliente "${cliente.nome}"`,
    });
  }
}
