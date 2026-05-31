'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listarParcelas,
  marcarPago,
  computeStatusParcela,
  formatCentavos,
  formatDataBR,
  today,
  type Parcela,
  type StatusParcela,
} from '@/lib/financeiro-modulo';

interface Props { refreshKey: number; onRefresh: () => void }

type FiltroStatus = 'todos' | 'pendente' | 'atrasado';

const STATUS_STYLE: Record<StatusParcela, { dot: string; border: string; bg: string; label: string }> = {
  pendente: { dot: '#16A34A', border: '#BBF7D0', bg: '#F0FDF4', label: 'A vencer' },
  atrasado: { dot: '#DC2626', border: '#FECACA', bg: '#FFF5F5', label: 'Atrasado' },
  pago:     { dot: '#6B7280', border: '#E5E7EB', bg: '#F9FAFB', label: 'Pago' },
};

// Amarelo para quem vence hoje
function getStyle(p: Parcela, status: StatusParcela) {
  if (status === 'pendente' && p.dataVencimento === today()) {
    return { dot: '#D97706', border: '#FDE68A', bg: '#FFFBEB', label: 'Vence hoje' };
  }
  return STATUS_STYLE[status];
}

function montarMensagemWA(p: Parcela): string {
  const valorFmt = formatCentavos(p.valor);
  const dataFmt  = formatDataBR(p.dataVencimento);
  const parcelaInfo = p.totalParcelas > 1 ? ` (parcela ${p.numero}/${p.totalParcelas})` : '';
  return (
    `Olá, ${p.clienteNome}! 😊\n\n` +
    `Passando para lembrar que a parcela referente ao procedimento ` +
    `*${p.procedimento}*${parcelaInfo} no valor de *${valorFmt}* ` +
    `venceu em *${dataFmt}*.\n\n` +
    `Quando puder, entre em contato para acertarmos o pagamento. 💙\n\n` +
    `Clínica — Sistema de Gestão`
  );
}

export default function TabContasReceber({ refreshKey, onRefresh }: Props) {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [filtro, setFiltro]    = useState<FiltroStatus>('todos');
  const [copied, setCopied]    = useState<string | null>(null);

  useEffect(() => {
    const abertas = listarParcelas()
      .filter((p) => !p.dataPagamento)
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
    setParcelas(abertas);
  }, [refreshKey]);

  const filtradas = useMemo(() => {
    const todayStr = today();
    return parcelas.filter((p) => {
      if (filtro === 'todos')    return true;
      if (filtro === 'atrasado') return p.dataVencimento < todayStr;
      if (filtro === 'pendente') return p.dataVencimento >= todayStr;
      return true;
    });
  }, [parcelas, filtro]);

  function handleMarcarPago(id: string) {
    marcarPago(id);
    onRefresh();
  }

  async function handleCopiarWA(p: Parcela) {
    const msg = montarMensagemWA(p);
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(p.id);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      alert(msg);
    }
  }

  const totalAberto = parcelas.reduce((s, p) => s + p.valor, 0);
  const totalAtrasado = parcelas.filter((p) => p.dataVencimento < today()).reduce((s, p) => s + p.valor, 0);

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex gap-4 text-sm">
        <div className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex-1 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Total em aberto</p>
          <p className="font-bold text-lg" style={{ color: '#1B2A4A' }}>{formatCentavos(totalAberto)}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-100 px-4 py-3 flex-1 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Atrasado</p>
          <p className="font-bold text-lg text-red-600">{formatCentavos(totalAtrasado)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex-1 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Parcelas em aberto</p>
          <p className="font-bold text-lg" style={{ color: '#1B2A4A' }}>{parcelas.length}</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(['todos', 'atrasado', 'pendente'] as FiltroStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors border"
            style={
              filtro === f
                ? { backgroundColor: '#1B2A4A', color: '#fff', borderColor: '#1B2A4A' }
                : { backgroundColor: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }
            }
          >
            {f === 'todos' ? 'Todas' : f === 'atrasado' ? 'Atrasadas' : 'A vencer'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-medium">Nenhuma parcela em aberto neste filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((p) => {
            const status = computeStatusParcela(p);
            const style  = getStyle(p, status);
            const isCopied = copied === p.id;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4"
                style={{ borderColor: style.border }}
              >
                {/* Dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: style.dot }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: '#1B2A4A' }}>{p.clienteNome}</p>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: style.bg, color: style.dot }}
                    >
                      {style.label}
                    </span>
                    {p.totalParcelas > 1 && (
                      <span className="text-xs text-gray-400">{p.numero}/{p.totalParcelas}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{p.procedimento}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Vencimento: {formatDataBR(p.dataVencimento)}
                    {p.profissionalNome && ` · ${p.profissionalNome}`}
                  </p>
                </div>

                {/* Valor */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold" style={{ color: '#1B2A4A' }}>{formatCentavos(p.valor)}</p>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleMarcarPago(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
                  >
                    Marcar pago
                  </button>
                  <button
                    onClick={() => handleCopiarWA(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                    style={
                      isCopied
                        ? { backgroundColor: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' }
                        : { backgroundColor: '#fff', color: '#25D366', borderColor: '#BBF7D0' }
                    }
                  >
                    {isCopied ? '✓ Copiado!' : '💬 WhatsApp'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
