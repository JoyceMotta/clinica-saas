'use client';

import { useEffect, useState } from 'react';
import { computeDashboard, DashboardMetrics, formatCentavos } from '@/lib/financeiro-modulo';

interface CardProps {
  title: string;
  value: string;
  icon: string;
  accent: string;
  sub?: string;
}

function Card({ title, value, icon, accent, sub }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</span>
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: accent + '20', color: accent }}
        >
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DashboardCards({ refreshKey }: { refreshKey: number }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    faturamentoMes: 0,
    contasReceber: 0,
    recebidoHoje: 0,
    inadimplencia: 0,
  });

  useEffect(() => {
    setMetrics(computeDashboard());
  }, [refreshKey]);

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Faturamento do mês"
        value={formatCentavos(metrics.faturamentoMes)}
        icon="💰"
        accent="#C9A84C"
        sub={`Recebido em ${mesNome}`}
      />
      <Card
        title="Contas a receber"
        value={formatCentavos(metrics.contasReceber)}
        icon="📋"
        accent="#3B82F6"
        sub="Total em aberto"
      />
      <Card
        title="Recebido hoje"
        value={formatCentavos(metrics.recebidoHoje)}
        icon="✅"
        accent="#10B981"
        sub="Pagamentos de hoje"
      />
      <Card
        title="Inadimplência"
        value={formatCentavos(metrics.inadimplencia)}
        icon="⚠️"
        accent="#EF4444"
        sub="Parcelas vencidas"
      />
    </div>
  );
}
