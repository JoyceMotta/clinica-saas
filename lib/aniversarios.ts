import type { ClienteLocal } from './local-storage-clientes';

// ─── Mensagem padrão ──────────────────────────────────────────────────────────

export const MENSAGEM_PADRAO =
  'Feliz aniversário, {nome}! 🎂 A equipe da Clínica deseja um dia incrível. ' +
  'Que tal se presentear com um cuidado especial? Temos condições especiais para você hoje!';

// ─── Cálculos de data ─────────────────────────────────────────────────────────

/** Próxima ocorrência do aniversário (UTC, hora zerada) */
function proximoAniversario(dataNasc: string): Date {
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const bd = new Date(
    Date.UTC(hoje.getUTCFullYear(), nasc.getUTCMonth(), nasc.getUTCDate()),
  );
  if (bd.getTime() < hoje.getTime()) bd.setUTCFullYear(bd.getUTCFullYear() + 1);
  return bd;
}

/** Quantos dias faltam para o próximo aniversário (0 = hoje) */
export function diasParaAniversario(dataNasc: string): number {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  return Math.round(
    (proximoAniversario(dataNasc).getTime() - hoje.getTime()) / 86_400_000,
  );
}

export function isAniversarioHoje(dataNasc: string): boolean {
  return diasParaAniversario(dataNasc) === 0;
}

export function isAniversarioEstaSemana(dataNasc: string): boolean {
  const d = diasParaAniversario(dataNasc);
  return d >= 0 && d <= 6;
}

export function isAniversarioEsteMes(dataNasc: string): boolean {
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  return nasc.getUTCMonth() === hoje.getUTCMonth();
}

/** Já aconteceu este mês (dia anterior ao de hoje) */
export function jaPassouEsteMes(dataNasc: string): boolean {
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  return (
    nasc.getUTCMonth() === hoje.getUTCMonth() &&
    nasc.getUTCDate() < hoje.getUTCDate()
  );
}

// ─── Filtros de lista ─────────────────────────────────────────────────────────

/** Respeita toggle — undefined (registros antigos) = ativo */
function querMensagem(c: ClienteLocal): boolean {
  return c.aniversarioMensagem !== false;
}

export function aniversariosEstaSemana(clientes: ClienteLocal[]): ClienteLocal[] {
  return clientes
    .filter((c) => querMensagem(c) && isAniversarioEstaSemana(c.dataNascimento))
    .sort(
      (a, b) =>
        diasParaAniversario(a.dataNascimento) - diasParaAniversario(b.dataNascimento),
    );
}

export function aniversariosEsteMes(clientes: ClienteLocal[]): ClienteLocal[] {
  return clientes
    .filter((c) => querMensagem(c) && isAniversarioEsteMes(c.dataNascimento))
    .sort(
      (a, b) =>
        new Date(a.dataNascimento).getUTCDate() -
        new Date(b.dataNascimento).getUTCDate(),
    );
}

/** Clientes para alertar: aniversário em até 3 dias (inclusive hoje) */
export function aniversariosAlertar(clientes: ClienteLocal[]): ClienteLocal[] {
  return clientes
    .filter((c) => querMensagem(c) && diasParaAniversario(c.dataNascimento) <= 3)
    .sort(
      (a, b) =>
        diasParaAniversario(a.dataNascimento) - diasParaAniversario(b.dataNascimento),
    );
}

/** Próximos N aniversários a partir de hoje */
export function proximosAniversarios(
  clientes: ClienteLocal[],
  n = 20,
): ClienteLocal[] {
  return clientes
    .filter((c) => querMensagem(c))
    .sort(
      (a, b) =>
        diasParaAniversario(a.dataNascimento) - diasParaAniversario(b.dataNascimento),
    )
    .slice(0, n);
}

// ─── Mensagem e WhatsApp ─────────────────────────────────────────────────────

export function montarMensagem(cliente: ClienteLocal): string {
  const template = cliente.mensagemAniversario?.trim() || MENSAGEM_PADRAO;
  const primeiroNome = cliente.nome.trim().split(' ')[0];
  return template.replace(/\{nome\}/gi, primeiroNome);
}

/** Abre o WhatsApp Web com a mensagem de parabéns pré-preenchida */
export function abrirWhatsApp(cliente: ClienteLocal): void {
  const num = cliente.whatsapp.replace(/\D/g, '');
  const msg = encodeURIComponent(montarMensagem(cliente));
  window.open(`https://wa.me/55${num}?text=${msg}`, '_blank', 'noopener,noreferrer');
}
