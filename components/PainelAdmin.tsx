'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { listarClientesLocal } from '@/lib/local-storage-clientes';
import { listarTodosAgendamentos } from '@/lib/local-storage-agendamentos';
import { listarTodosLancamentos, formatarMoeda } from '@/lib/local-storage-financeiro';
import {
  listarAuditoria, ACAO_CORES, ACAO_LABELS, ENTIDADE_LABELS,
  type RegistroAuditoria,
} from '@/lib/local-storage-auditoria';
import { aniversariosEstaSemana } from '@/lib/aniversarios';
import type { ClienteLocal } from '@/lib/local-storage-clientes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mesAtual() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'agora mesmo';
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7)    return `${d}d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon, href, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent ? `${accent}15` : '#F3F4F6' }}
      >
        <span className="text-xl">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-0.5 leading-none" style={{ color: accent ?? '#1B2A4A' }}>
          {value}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── AuditRow ─────────────────────────────────────────────────────────────────

function AuditRow({ entry }: { entry: RegistroAuditoria }) {
  const cores = ACAO_CORES[entry.acao];
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
        style={{ backgroundColor: cores.bg }}
      >
        {cores.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{entry.descricao}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: cores.bg, color: cores.text }}
          >
            {ACAO_LABELS[entry.acao]}
          </span>
          <span className="text-[10px] text-gray-400">
            {ENTIDADE_LABELS[entry.entidade]}
          </span>
          <span className="text-[10px] text-gray-400">·</span>
          <span className="text-[10px] text-gray-400">{entry.usuarioNome}</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
        {tempoRelativo(entry.dataHora)}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PainelAdmin() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [clientes,     setClientes]     = useState<ClienteLocal[]>([]);
  const [agendamentos, setAgs]          = useState<ReturnType<typeof listarTodosAgendamentos>>([]);
  const [lancamentos,  setLancamentos]  = useState<ReturnType<typeof listarTodosLancamentos>>([]);
  const [auditoria,    setAuditoria]    = useState<RegistroAuditoria[]>([]);
  const [loaded,       setLoaded]       = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user?.role !== 'admin') { router.replace('/'); return; }

    setClientes(listarClientesLocal());
    setAgs(listarTodosAgendamentos());
    setLancamentos(listarTodosLancamentos());
    setAuditoria(listarAuditoria());
    setLoaded(true);
  }, [isLoading, user, router]);

  const mes = mesAtual();

  const stats = useMemo(() => {
    const agsMes  = agendamentos.filter(a => a.data.startsWith(mes));
    const recMes  = lancamentos
      .filter(l => l.data.startsWith(mes) && l.status !== 'cancelado')
      .reduce((s, l) => s + l.valorPago, 0);
    const bdSemana = aniversariosEstaSemana(clientes);
    return { agsMes: agsMes.length, recMes, bdSemana };
  }, [agendamentos, lancamentos, clientes, mes]);

  const ultimasAtividades = useMemo(
    () => [...auditoria].sort((a, b) => b.dataHora.localeCompare(a.dataHora)).slice(0, 15),
    [auditoria],
  );

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  if (isLoading || !loaded) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-9 w-56 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>Painel Admin</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Visão geral da clínica · <span className="capitalize">{mesNome}</span>
        </p>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Clientes"
          value={clientes.length}
          sub="cadastrados no sistema"
          icon="👥"
          href="/clientes"
          accent="#1B2A4A"
        />
        <MetricCard
          label="Agendamentos"
          value={stats.agsMes}
          sub={`em ${mesNome}`}
          icon="📅"
          href="/agenda"
          accent="#2563EB"
        />
        <MetricCard
          label="Receita do mês"
          value={formatarMoeda(stats.recMes)}
          sub={`recebido em ${mesNome}`}
          icon="💰"
          href="/financeiro"
          accent="#16A34A"
        />
        <MetricCard
          label="Aniversariantes"
          value={stats.bdSemana.length}
          sub="nos próximos 7 dias"
          icon="🎂"
          href="/agenda"
          accent="#C9A84C"
        />
      </div>

      {/* ── Aniversariantes da semana ── */}
      {stats.bdSemana.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-5 py-3.5 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #2d4070 100%)' }}
          >
            <span className="text-base">🎂</span>
            <h2 className="font-bold text-sm text-white">Aniversariantes da semana</h2>
            <span
              className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
            >
              {stats.bdSemana.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.bdSemana.map(c => {
              const nasc = new Date(c.dataNascimento + 'T12:00');
              const dia  = nasc.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 gap-3">
                  <Link href={`/clientes/${c.id}`} className="flex items-center gap-3 group min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: '#1B2A4A' }}
                    >
                      {c.nome.split(' ').slice(0,2).map(n=>n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:opacity-70 transition-opacity" style={{ color: '#1B2A4A' }}>
                        {c.nome}
                      </p>
                      <p className="text-xs text-gray-400">{dia}</p>
                    </div>
                  </Link>
                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/55${c.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Parabéns, ${c.nome.split(' ')[0]}! 🎂`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      📱 Parabéns
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Últimas atividades ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-sm" style={{ color: '#1B2A4A' }}>
            Últimas atividades do sistema
          </h2>
          <span className="text-[11px] text-gray-400">{ultimasAtividades.length} registros recentes</span>
        </div>

        {ultimasAtividades.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ultimasAtividades.map(entry => (
              <AuditRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {auditoria.length > 15 && (
          <div className="px-5 py-3 border-t border-gray-50 text-center">
            <Link
              href="/configuracoes"
              className="text-xs font-semibold hover:underline"
              style={{ color: '#C9A84C' }}
            >
              Ver log de auditoria completo →
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
