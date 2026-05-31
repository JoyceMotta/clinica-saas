'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { listarClientesLocal, type ClienteLocal } from '@/lib/local-storage-clientes';
import {
  diasParaAniversario,
  isAniversarioHoje,
  aniversariosAlertar,
  proximosAniversarios,
  abrirWhatsApp,
} from '@/lib/aniversarios';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ─── Mini calendário mensal ───────────────────────────────────────────────────

function CalendarioMes({
  ano,
  mes,
  clientes,
}: {
  ano: number;
  mes: number;
  clientes: ClienteLocal[];
}) {
  const hoje = new Date();
  const todayDay =
    hoje.getFullYear() === ano && hoje.getMonth() === mes ? hoje.getDate() : -1;
  const daysInMonth = new Date(ano, mes + 1, 0).getDate();
  const firstDow = new Date(ano, mes, 1).getDay();

  // mapa dia → clientes
  const map = new Map<number, ClienteLocal[]>();
  for (const c of clientes) {
    const nasc = new Date(c.dataNascimento);
    if (nasc.getUTCMonth() === mes && c.aniversarioMensagem !== false) {
      const d = nasc.getUTCDate();
      map.set(d, [...(map.get(d) ?? []), c]);
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const bdClientes = map.get(d) ?? [];
          const isToday = d === todayDay;
          const hasBd = bdClientes.length > 0;

          return (
            <div
              key={d}
              className={`rounded-lg p-1 min-h-[52px] flex flex-col items-center ${
                isToday ? 'ring-2 ring-navy ring-offset-1' : ''
              } ${hasBd ? 'bg-amber-50' : 'bg-white border border-gray-50'}`}
            >
              <span
                className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? 'text-white' : hasBd ? 'text-amber-700' : 'text-gray-500'
                }`}
                style={isToday ? { backgroundColor: '#1B2A4A' } : {}}
              >
                {d}
              </span>
              {bdClientes.slice(0, 2).map((c) => (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="mt-0.5 text-[9px] font-semibold leading-tight text-center truncate w-full px-0.5 rounded hover:opacity-70"
                  style={{ color: '#1B2A4A', backgroundColor: '#C9A84C33' }}
                  title={c.nome}
                >
                  {c.nome.split(' ')[0]}
                </Link>
              ))}
              {bdClientes.length > 2 && (
                <span className="text-[9px] text-amber-600">+{bdClientes.length - 2}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AgendaAniversarios() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [clientes, setClientes] = useState<ClienteLocal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setClientes(listarClientesLocal());
    setLoaded(true);
  }, []);

  const navMes = useCallback(
    (delta: number) => {
      let m = mes + delta;
      let a = ano;
      if (m < 0) { m = 11; a--; }
      if (m > 11) { m = 0; a++; }
      setMes(m);
      setAno(a);
    },
    [mes, ano],
  );

  const alertas = aniversariosAlertar(clientes);
  const proximos = proximosAniversarios(clientes, 30);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>Agenda</h1>
        <p className="text-gray-500 mt-1 text-sm">Aniversários e eventos dos clientes</p>
      </div>

      {/* Alerta 3 dias */}
      {loaded && alertas.length > 0 && (
        <div
          className="rounded-xl px-5 py-4 flex items-start gap-4"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          <span className="text-2xl flex-shrink-0 mt-0.5">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: '#C9A84C' }}>
              Alerta — aniversários nos próximos 3 dias
            </p>
            <div className="mt-2 space-y-1.5">
              {alertas.map((c) => {
                const dias = diasParaAniversario(c.dataNascimento);
                const hoje_ = isAniversarioHoje(c.dataNascimento);
                return (
                  <div key={c.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">{hoje_ ? '🎉' : '📅'}</span>
                      <Link
                        href={`/clientes/${c.id}`}
                        className="text-sm text-white hover:opacity-70 truncate"
                      >
                        {c.nome}
                      </Link>
                      <span className="text-xs text-white/50 flex-shrink-0">
                        {hoje_ ? 'hoje!' : `em ${dias} dia${dias === 1 ? '' : 's'}`}
                      </span>
                    </div>
                    {c.aniversarioMensagem !== false && (
                      <button
                        onClick={() => abrirWhatsApp(c)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
                      >
                        📱 Enviar parabéns
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grid: calendário + lista próximos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Calendário */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          {/* Nav mês */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navMes(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              ‹
            </button>
            <h2 className="font-bold text-base" style={{ color: '#1B2A4A' }}>
              {MESES[mes]} {ano}
            </h2>
            <button
              onClick={() => navMes(1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              ›
            </button>
          </div>

          {loaded ? (
            <CalendarioMes ano={ano} mes={mes} clientes={clientes} />
          ) : (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Legenda */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 flex-shrink-0" />
              Aniversário
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#1B2A4A' }}
              />
              Hoje
            </div>
          </div>
        </div>

        {/* Lista próximos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <span className="text-base">🎂</span>
            <h3 className="font-bold text-sm" style={{ color: '#1B2A4A' }}>
              Próximos aniversários
            </h3>
          </div>

          {!loaded ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
          ) : proximos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              Nenhum cliente cadastrado ainda
            </p>
          ) : (
            <ul className="divide-y divide-gray-50 overflow-y-auto max-h-[420px]">
              {proximos.map((c) => {
                const dias = diasParaAniversario(c.dataNascimento);
                const hojeFlag = dias === 0;
                return (
                  <li key={c.id}>
                    <div className="flex items-center justify-between px-5 py-3 gap-3">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="min-w-0 group"
                      >
                        <p
                          className="text-sm font-semibold truncate group-hover:opacity-70 transition-opacity"
                          style={{ color: '#1B2A4A' }}
                        >
                          {hojeFlag && '🎉 '}{c.nome}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(c.dataNascimento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            timeZone: 'UTC',
                          })}
                          {' · '}
                          {hojeFlag
                            ? 'Hoje!'
                            : `${dias} dia${dias === 1 ? '' : 's'}`}
                        </p>
                      </Link>
                      {c.aniversarioMensagem !== false && (
                        <button
                          onClick={() => abrirWhatsApp(c)}
                          title="Enviar parabéns via WhatsApp"
                          className="flex-shrink-0 p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                          style={
                            hojeFlag
                              ? { backgroundColor: '#C9A84C', color: '#1B2A4A' }
                              : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                          }
                        >
                          📱
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
