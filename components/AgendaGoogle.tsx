'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  criarAgendamento, atualizarAgendamento, deletarAgendamento,
  listarTodosAgendamentos, STATUS_LABELS, STATUS_COLORS,
  type Agendamento, type AgendamentoInput, type StatusAgendamento,
} from '@/lib/local-storage-agendamentos';
import { listarClientesLocal, type ClienteLocal } from '@/lib/local-storage-clientes';
import { listarProfissionais, type Profissional } from '@/lib/local-storage-configuracoes';
import { listarItens, formatReais, type ItemCatalogo } from '@/lib/local-storage-catalogo';

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SLOT_H     = 48;
const DAY_START  = 7;
const DAY_END    = 20;
const TOTAL_SLOTS = (DAY_END - DAY_START) * 2;
const SLOTS = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const m = DAY_START * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
});

const DIAS   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MESES  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_C = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const STATUS_ALL: StatusAgendamento[] = ['agendado','confirmado','realizado','cancelado','faltou'];

const EVENT_COLORS = {
  birthday:  { bg: '#FFF7ED', fg: '#C2410C', border: '#F97316' },
  followup:  { bg: '#F5F3FF', fg: '#7C3AED', border: '#8B5CF6' },
  google:    { bg: '#EFF6FF', fg: '#1D4ED8', border: '#3B82F6' },
};

// ═══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type EventType = 'agendamento' | 'birthday' | 'followup' | 'google';

interface CalEvent {
  id:          string;
  type:        EventType;
  title:       string;
  date:        string;       // YYYY-MM-DD
  hora?:       string;       // HH:MM (undefined = all-day)
  duracaoMin?: number;
  allDay:      boolean;
  bg:          string;
  fg:          string;
  border:      string;
  agendamento?: Agendamento;
  cliente?:    ClienteLocal;
  valorCentavos?: number;
  googleRaw?:  Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekDays(anchor: Date): Date[] {
  const dow = anchor.getDay();
  const mon = new Date(anchor);
  mon.setDate(anchor.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => { const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function timeToMins(h: string): number {
  const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm;
}

function timeToTop(h: string): number {
  const m = timeToMins(h) - DAY_START * 60;
  if (m <= 0) return 0;
  if (m >= (DAY_END - DAY_START) * 60) return TOTAL_SLOTS * SLOT_H;
  return (m / 30) * SLOT_H;
}

function durToH(min: number) { return Math.max(SLOT_H - 4, (min / 30) * SLOT_H - 4); }

function resolveOverlaps(evs: CalEvent[]): Map<string, { col: number; total: number }> {
  const result = new Map<string, { col: number; total: number }>();
  if (!evs.length) return result;
  const sorted = [...evs].filter(e => !e.allDay).sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
  const free: number[] = [];
  for (const e of sorted) {
    const start = timeToMins(e.hora ?? '00:00');
    const end   = start + (e.duracaoMin ?? 30);
    let col = free.findIndex(f => f <= start);
    if (col === -1) { col = free.length; free.push(end); } else free[col] = end;
    result.set(e.id, { col, total: 0 });
  }
  const total = free.length;
  for (const [id, info] of result) result.set(id, { ...info, total });
  return result;
}

// ─── Compute events ───────────────────────────────────────────────────────────

function buildAgEvents(
  ags: Agendamento[],
  clientes: ClienteLocal[],
  itens: ItemCatalogo[],
): CalEvent[] {
  return ags.map(ag => {
    const cliente = clientes.find(c => c.id === ag.clienteId);
    const item    = itens.find(i => i.nome === ag.procedimento);
    const c       = STATUS_COLORS[ag.status];
    return {
      id:           ag.id,
      type:         'agendamento',
      title:        cliente ? `${cliente.nome.split(' ')[0]} — ${ag.procedimento}` : ag.procedimento,
      date:         ag.data,
      hora:         ag.hora,
      duracaoMin:   ag.duracaoMin ?? 30,
      allDay:       false,
      bg:           c.bg,
      fg:           c.text,
      border:       c.text,
      agendamento:  ag,
      cliente,
      valorCentavos: item?.valorUnitario,
    } satisfies CalEvent;
  });
}

function buildBirthdays(clientes: ClienteLocal[], year: number): CalEvent[] {
  return clientes
    .filter(c => c.aniversarioMensagem !== false && c.dataNascimento)
    .map(c => {
      const nasc = new Date(c.dataNascimento + 'T12:00:00');
      const date = `${year}-${String(nasc.getUTCMonth() + 1).padStart(2, '0')}-${String(nasc.getUTCDate()).padStart(2, '0')}`;
      return {
        id:    `bd-${c.id}-${year}`,
        type:  'birthday' as EventType,
        title: `🎂 ${c.nome.split(' ')[0]}`,
        date,
        allDay: true,
        ...EVENT_COLORS.birthday,
        cliente: c,
      } satisfies CalEvent;
    });
}

function buildFollowUps(
  ags: Agendamento[],
  clientes: ClienteLocal[],
  itens: ItemCatalogo[],
): CalEvent[] {
  const events: CalEvent[] = [];
  const seen = new Set<string>();

  const realized = [...ags]
    .filter(a => a.status === 'realizado')
    .sort((a, b) => b.data.localeCompare(a.data));

  for (const ag of realized) {
    const key = `${ag.clienteId}-${ag.procedimento}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const item = itens.find(i => i.nome === ag.procedimento);
    if (!item?.intervaloRecompra) continue;

    const lastDate = new Date(ag.data + 'T12:00:00');
    const fuDate   = new Date(lastDate);
    fuDate.setDate(fuDate.getDate() + item.intervaloRecompra);

    const today = new Date(); today.setHours(0,0,0,0);
    const diff  = Math.ceil((fuDate.getTime() - today.getTime()) / 86400000);
    if (diff < -14 || diff > 90) continue;

    const cliente = clientes.find(c => c.id === ag.clienteId);
    events.push({
      id:    `fu-${ag.id}`,
      type:  'followup',
      title: `↻ ${cliente?.nome.split(' ')[0] ?? '?'} — ${ag.procedimento}`,
      date:  toDateStr(fuDate),
      allDay: true,
      ...EVENT_COLORS.followup,
      cliente,
    });
  }
  return events;
}

function buildGoogleEvents(raw: Record<string, unknown>[]): CalEvent[] {
  return raw.map(ev => {
    const start = (ev.start as Record<string,string> | undefined);
    const date  = start?.date ?? (start?.dateTime ?? '').slice(0, 10);
    const hora  = start?.dateTime ? start.dateTime.slice(11, 16) : undefined;
    const endDt = (ev.end as Record<string,string> | undefined)?.dateTime;
    let duracaoMin: number | undefined;
    if (hora && endDt) {
      const endHora = endDt.slice(11, 16);
      duracaoMin = timeToMins(endHora) - timeToMins(hora);
      if (duracaoMin <= 0) duracaoMin = 30;
    }
    return {
      id:        `gc-${ev.id as string}`,
      type:      'google' as EventType,
      title:     (ev.summary as string) ?? '(sem título)',
      date,
      hora,
      duracaoMin,
      allDay:    !hora,
      ...EVENT_COLORS.google,
      googleRaw: ev,
    } satisfies CalEvent;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MONTH VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function MonthView({
  year, month, events, todayStr, onDayClick, onEventClick,
}: {
  year: number; month: number;
  events: CalEvent[];
  todayStr: string;
  onDayClick: (date: string) => void;
  onEventClick: (ev: CalEvent) => void;
}) {
  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = firstDow === 0 ? 6 : firstDow - 1;
  const prevDays    = new Date(year, month, 0).getDate();

  // Build 6 weeks of cells
  const cells: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevDays - i), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, cells.length - daysInMonth - offset + 1), isCurrentMonth: false });
  }

  // Events indexed by date string
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const ev of events) {
      if (!m.has(ev.date)) m.set(ev.date, []);
      m.get(ev.date)!.push(ev);
    }
    // Sort: all-day first, then by hora
    for (const [, arr] of m) {
      arr.sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return (a.hora ?? '').localeCompare(b.hora ?? '');
      });
    }
    return m;
  }, [events]);

  const MAX_CHIPS = 3;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-gray-400 uppercase py-2">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}>
        {cells.map(({ date, isCurrentMonth }, i) => {
          const ds      = toDateStr(date);
          const isToday = ds === todayStr;
          const dayEvs  = byDay.get(ds) ?? [];
          const extra   = dayEvs.length - MAX_CHIPS;

          return (
            <div
              key={i}
              className={`border-r border-b border-gray-100 p-1 flex flex-col gap-0.5 cursor-pointer hover:bg-gray-50/60 transition-colors ${!isCurrentMonth ? 'bg-gray-50/30' : ''}`}
              onClick={() => onDayClick(ds)}
            >
              {/* Day number */}
              <div className="flex justify-end mb-0.5">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                    isToday ? 'text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}
                  style={isToday ? { backgroundColor: '#1B2A4A' } : {}}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Event chips */}
              {dayEvs.slice(0, MAX_CHIPS).map(ev => (
                <button
                  key={ev.id}
                  onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                  className="w-full text-left rounded px-1 py-0.5 text-[10px] font-semibold truncate leading-tight"
                  style={{ backgroundColor: ev.bg, color: ev.fg, borderLeft: `2px solid ${ev.border}` }}
                >
                  {ev.hora && <span className="opacity-70 mr-0.5">{ev.hora}</span>}
                  {ev.title}
                </button>
              ))}
              {extra > 0 && (
                <button
                  onClick={e => { e.stopPropagation(); onDayClick(ds); }}
                  className="text-[10px] text-gray-400 font-semibold text-left px-1 hover:text-navy"
                >
                  +{extra} mais
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GRADE VIEW (week / day)
// ═══════════════════════════════════════════════════════════════════════════════

function GradeView({
  days, events, todayStr, onSlotClick, onEventClick,
}: {
  days: Date[];
  events: CalEvent[];
  todayStr: string;
  onSlotClick: (date: string, hora: string) => void;
  onEventClick: (ev: CalEvent) => void;
}) {
  const gridH = TOTAL_SLOTS * SLOT_H;

  const byDay = useMemo(() => {
    const m = new Map<string, { timed: CalEvent[]; allDay: CalEvent[] }>();
    for (const d of days) m.set(toDateStr(d), { timed: [], allDay: [] });
    for (const ev of events) {
      const bucket = m.get(ev.date);
      if (!bucket) continue;
      if (ev.allDay) bucket.allDay.push(ev);
      else bucket.timed.push(ev);
    }
    return m;
  }, [days, events]);

  const overlapMap = useMemo(() => {
    const m = new Map<string, Map<string, { col: number; total: number }>>();
    for (const [day, { timed }] of byDay) m.set(day, resolveOverlaps(timed));
    return m;
  }, [byDay]);

  const now    = new Date();
  const nowTop = toDateStr(now) === todayStr
    ? timeToTop(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
    : -1;

  const maxAllDay = useMemo(() => Math.max(...[...byDay.values()].map(b => b.allDay.length), 0), [byDay]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* All-day row */}
      {maxAllDay > 0 && (
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <div className="w-14 flex-shrink-0 flex items-center justify-end pr-2">
            <span className="text-[9px] text-gray-400 uppercase font-bold">dia todo</span>
          </div>
          {days.map(d => {
            const ds = toDateStr(d);
            const bucket = byDay.get(ds);
            return (
              <div key={ds} className="flex-1 min-w-0 border-l border-gray-100 py-1 px-1 flex flex-col gap-0.5">
                {bucket?.allDay.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className="w-full text-left rounded px-1.5 py-0.5 text-[10px] font-semibold truncate"
                    style={{ backgroundColor: ev.bg, color: ev.fg, borderLeft: `3px solid ${ev.border}` }}
                  >
                    {ev.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex overflow-auto flex-1 min-h-0">
        {/* Time labels */}
        <div className="flex-shrink-0 w-14 relative" style={{ minHeight: gridH }}>
          {SLOTS.map((slot, i) => i % 2 === 0 && (
            <div key={slot} className="absolute right-2 text-[10px] text-gray-400 font-medium leading-none" style={{ top: i * SLOT_H - 5 }}>
              {slot}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(d => {
          const ds      = toDateStr(d);
          const isToday = ds === todayStr;
          const { timed } = byDay.get(ds) ?? { timed: [] };
          const overlaps  = overlapMap.get(ds) ?? new Map();

          return (
            <div
              key={ds}
              className="flex-1 min-w-0 relative border-l border-gray-100"
              style={{ minHeight: gridH, backgroundColor: isToday ? '#FAFBFF' : undefined }}
            >
              {/* Slot lines + click */}
              {SLOTS.map((slot, i) => (
                <div
                  key={slot}
                  className={`absolute left-0 right-0 cursor-pointer hover:bg-blue-50/40 transition-colors ${
                    i % 2 === 0 ? 'border-t border-gray-100' : 'border-t border-gray-50'
                  }`}
                  style={{ top: i * SLOT_H, height: SLOT_H }}
                  onClick={() => onSlotClick(ds, slot)}
                />
              ))}

              {/* Current-time line */}
              {isToday && nowTop >= 0 && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: nowTop }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -ml-1.5" />
                  <div className="h-px bg-red-500 flex-1" />
                </div>
              )}

              {/* Timed event cards */}
              {timed.map(ev => {
                const top    = timeToTop(ev.hora!);
                const height = durToH(ev.duracaoMin ?? 30);
                const ov     = overlaps.get(ev.id) ?? { col: 0, total: 1 };
                const w      = 100 / ov.total;
                const l      = ov.col * w;

                return (
                  <div
                    key={ev.id}
                    onClick={e => { e.stopPropagation(); onEventClick(ev); }}
                    className="absolute rounded-lg cursor-pointer shadow-sm hover:shadow-md hover:z-30 transition-shadow overflow-hidden border-l-[3px] z-10"
                    style={{ top: top+2, height, left: `calc(${l}% + 2px)`, width: `calc(${w}% - 5px)`, backgroundColor: ev.bg, borderLeftColor: ev.border }}
                  >
                    <div className="px-1.5 pt-1 h-full flex flex-col overflow-hidden">
                      <p className="text-[10px] font-bold leading-none mb-0.5" style={{ color: ev.fg }}>{ev.hora}</p>
                      <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: '#1B2A4A' }}>{ev.title}</p>
                      {height > SLOT_H + 4 && ev.agendamento && (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{ev.agendamento.profissional}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EVENT DETAIL POPUP
// ═══════════════════════════════════════════════════════════════════════════════

function EventDetail({
  ev, onEdit, onClose,
}: { ev: CalEvent; onEdit: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Colored top bar */}
        <div className="h-2 w-full" style={{ backgroundColor: ev.border }} />

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm leading-tight" style={{ color: '#1B2A4A' }}>{ev.title}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none">×</button>
          </div>

          {/* Date + time */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>
              {new Date(ev.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {ev.hora && ` · ${ev.hora}`}
              {ev.duracaoMin && ev.hora && ` (${ev.duracaoMin} min)`}
            </span>
          </div>

          {/* Agendamento details */}
          {ev.agendamento && (
            <>
              {ev.cliente && (
                <div className="flex items-center gap-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <Link href={`/clientes/${ev.cliente.id}`} className="font-semibold hover:underline" style={{ color: '#1B2A4A' }}>
                    {ev.cliente.nome}
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                {ev.agendamento.procedimento}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {ev.agendamento.profissional}
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[ev.agendamento.status].bg, color: STATUS_COLORS[ev.agendamento.status].text }}
                >
                  {STATUS_LABELS[ev.agendamento.status]}
                </span>
                {ev.valorCentavos != null && (
                  <span className="text-sm font-bold" style={{ color: '#1B2A4A' }}>
                    {formatReais(ev.valorCentavos)}
                  </span>
                )}
              </div>
              {ev.agendamento.observacoes && (
                <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">{ev.agendamento.observacoes}</p>
              )}
            </>
          )}

          {/* Follow-up detail */}
          {ev.type === 'followup' && ev.cliente && (
            <div className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
              Sugestão de retorno para <strong>{ev.cliente.nome.split(' ')[0]}</strong> com base no intervalo de recompra do procedimento.
            </div>
          )}

          {/* Google event detail */}
          {ev.type === 'google' && ev.googleRaw && (
            <p className="text-xs text-gray-500">
              {(ev.googleRaw.description as string) ?? 'Evento do Google Agenda'}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 border-t border-gray-50">
            {ev.type === 'agendamento' && (
              <button
                onClick={onEdit}
                className="flex-1 py-2 text-xs font-bold rounded-lg text-white hover:opacity-90"
                style={{ backgroundColor: '#1B2A4A' }}
              >
                Editar
              </button>
            )}
            {ev.type === 'birthday' && ev.cliente && (
              <a
                href={`https://wa.me/55${ev.cliente.whatsapp?.replace(/\D/g,'')}?text=${encodeURIComponent(`Feliz aniversário, ${ev.cliente.nome.split(' ')[0]}! 🎂`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 text-xs font-bold rounded-lg text-center text-white hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}
              >
                📱 Enviar parabéns
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODAL AGENDAMENTO
// ═══════════════════════════════════════════════════════════════════════════════

function ModalAgendamento({
  inicial, dataInicial, horaInicial,
  clientes, profissionais, itens,
  onSave, onDelete, onClose,
}: {
  inicial?: Agendamento; dataInicial?: string; horaInicial?: string;
  clientes: ClienteLocal[]; profissionais: Profissional[]; itens: ItemCatalogo[];
  onSave: (d: AgendamentoInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [clienteId, setClienteId] = useState(inicial?.clienteId ?? '');
  const [busca, setBusca]         = useState(() => inicial?.clienteId ? clientes.find(c => c.id === inicial.clienteId)?.nome ?? '' : '');
  const [showList, setShowList]   = useState(false);
  const [procedimento, setProc]   = useState(inicial?.procedimento ?? '');
  const [profNome, setProfNome]   = useState(inicial?.profissional ?? '');
  const [data, setData]           = useState(inicial?.data ?? dataInicial ?? '');
  const [hora, setHora]           = useState(inicial?.hora ?? horaInicial ?? '');
  const [duracaoMin, setDur]      = useState(inicial?.duracaoMin ?? 30);
  const [status, setStatus]       = useState<StatusAgendamento>(inicial?.status ?? 'agendado');
  const [obs, setObs]             = useState(inicial?.observacoes ?? '');
  const [erro, setErro]           = useState('');

  const filtClientes = useMemo(() => {
    if (!busca.trim() || clienteId) return [];
    const q = busca.toLowerCase();
    return clientes.filter(c => c.nome.toLowerCase().includes(q) || c.cpf?.replace(/\D/g,'').includes(q.replace(/\D/g,''))).slice(0, 8);
  }, [busca, clienteId, clientes]);

  function handleProc(nome: string) {
    setProc(nome);
    const item = itens.find(i => i.nome === nome);
    if (item?.duracaoMediaMin) setDur(item.duracaoMediaMin);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId)    { setErro('Selecione um cliente.'); return; }
    if (!procedimento) { setErro('Informe o procedimento.'); return; }
    if (!profNome)     { setErro('Selecione o profissional.'); return; }
    if (!data || !hora){ setErro('Informe data e horário.'); return; }
    onSave({ clienteId, procedimento: procedimento.trim(), profissional: profNome, data, hora, duracaoMin, status, observacoes: obs.trim() || undefined });
    onClose();
  }

  const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white';
  const lbl = 'block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>

        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
          <h3 className="font-bold text-white text-sm">{inicial ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin leading-none">×</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {erro && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ {erro}</p>}

          {/* Cliente */}
          <div className="relative">
            <label className={lbl}>Cliente *</label>
            <div className="relative">
              <input type="text" value={busca} onChange={e => { setBusca(e.target.value); setClienteId(''); setShowList(true); }} onFocus={() => setShowList(true)} onBlur={() => setTimeout(() => setShowList(false), 150)} placeholder="Buscar por nome ou CPF…" className={inp} autoFocus={!inicial} />
              {clienteId && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold">✓</span>}
            </div>
            {showList && filtClientes.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                {filtClientes.map(c => (
                  <button key={c.id} type="button" onMouseDown={() => { setClienteId(c.id); setBusca(c.nome); setShowList(false); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-2">
                    <span className="font-semibold truncate" style={{ color: '#1B2A4A' }}>{c.nome}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{c.cpf}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={lbl}>Procedimento *</label>
            <input type="text" list="proc-list" value={procedimento} onChange={e => handleProc(e.target.value)} placeholder="Ex: Toxina Botulínica" className={inp} />
            <datalist id="proc-list">{itens.filter(i => i.ativo).map(i => <option key={i.id} value={i.nome} />)}</datalist>
          </div>

          <div>
            <label className={lbl}>Profissional *</label>
            <select value={profNome} onChange={e => setProfNome(e.target.value)} className={inp}>
              <option value="">Selecione…</option>
              {profissionais.filter(p => p.ativo).map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Data *</label><input type="date" value={data} onChange={e => setData(e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Horário *</label><input type="time" value={hora} onChange={e => setHora(e.target.value)} className={inp} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Duração (min)</label>
              <input type="number" min={5} step={5} value={duracaoMin} onChange={e => setDur(parseInt(e.target.value) || 30)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as StatusAgendamento)} className={inp}>
                {STATUS_ALL.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Observações</label>
            <textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} placeholder="Instruções, notas, etc." className={inp + ' resize-none'} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
          {inicial && onDelete && (
            <button type="button" onClick={() => { if (confirm('Excluir este agendamento?')) { onDelete(); onClose(); } }} className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50">Excluir</button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-5 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#1B2A4A' }}>{inicial ? 'Salvar' : 'Agendar'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MINI CALENDÁRIO (sidebar)
// ═══════════════════════════════════════════════════════════════════════════════

function MiniCal({ selected, onSelect, events }: { selected: Date; onSelect: (d: Date) => void; events: CalEvent[] }) {
  const [vy, setVy] = useState(selected.getFullYear());
  const [vm, setVm] = useState(selected.getMonth());

  const todayStr = toDateStr(new Date());
  const selStr   = toDateStr(selected);

  const daysWithEvs = useMemo(() => {
    const s = new Set<string>();
    for (const ev of events) {
      if (new Date(ev.date + 'T12:00').getFullYear() === vy && new Date(ev.date + 'T12:00').getMonth() === vm) s.add(ev.date);
    }
    return s;
  }, [events, vy, vm]);

  function nav(d: number) { let m=vm+d,y=vy; if(m<0){m=11;y--;}if(m>11){m=0;y++;} setVm(m);setVy(y); }

  const firstDow    = new Date(vy, vm, 1).getDay();
  const daysInMonth = new Date(vy, vm + 1, 0).getDate();
  const offset      = firstDow === 0 ? 6 : firstDow - 1;
  const cells: (number|null)[] = [...Array(offset).fill(null), ...Array.from({length: daysInMonth},(_,i)=>i+1)];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <button onClick={()=>nav(-1)} className="p-1 rounded hover:bg-gray-100 text-gray-500">‹</button>
        <span className="text-xs font-bold" style={{color:'#1B2A4A'}}>{MESES_C[vm]} {vy}</span>
        <button onClick={()=>nav(1)}  className="p-1 rounded hover:bg-gray-100 text-gray-500">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['S','T','Q','Q','S','S','D'].map((d,i)=><div key={i} className="text-center text-[10px] font-bold text-gray-400">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d,i) => {
          if (!d) return <div key={`e${i}`}/>;
          const ds = `${vy}-${String(vm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const isToday = ds===todayStr, isSel=ds===selStr, hasEv=daysWithEvs.has(ds);
          return (
            <button key={d} onClick={()=>onSelect(new Date(vy,vm,d))} className="relative h-7 rounded text-[11px] font-medium hover:bg-gray-100 transition-colors"
              style={isSel?{backgroundColor:'#1B2A4A',color:'white'}:isToday?{color:'#C9A84C',fontWeight:700}:{color:'#374151'}}>
              {d}
              {hasEv && !isSel && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{backgroundColor:'#C9A84C'}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AgendaGoogle() {
  const { data: session } = useSession();
  const googleConnected   = !!(session as Record<string,unknown> | null)?.accessToken;

  const hoje     = new Date(); hoje.setHours(0,0,0,0);
  const todayStr = toDateStr(hoje);

  const [viewMode, setViewMode]         = useState<'mes'|'semana'|'dia'>('semana');
  const [anchor, setAnchor]             = useState(new Date(hoje));
  const [agendamentos, setAgs]          = useState<Agendamento[]>([]);
  const [clientes, setClientes]         = useState<ClienteLocal[]>([]);
  const [profissionais, setProfs]       = useState<Profissional[]>([]);
  const [itens, setItens]               = useState<ItemCatalogo[]>([]);
  const [googleRaw, setGoogleRaw]       = useState<Record<string,unknown>[]>([]);
  const [filtroProfissional, setFiltro] = useState('');
  const [modal, setModal]               = useState<{ ag?: Agendamento; dataInicial?: string; horaInicial?: string } | null>(null);
  const [detail, setDetail]             = useState<CalEvent | null>(null);

  // Load localStorage data
  useEffect(() => {
    setAgs(listarTodosAgendamentos());
    setClientes(listarClientesLocal());
    setProfs(listarProfissionais());
    setItens(listarItens());
  }, []);

  // Load Google Calendar events
  useEffect(() => {
    if (!googleConnected) return;
    fetch('/api/google-calendar')
      .then(r => r.json())
      .then(d => setGoogleRaw(d.events ?? []))
      .catch(() => {});
  }, [googleConnected]);

  function refresh() { setAgs(listarTodosAgendamentos()); }

  // Days for current view
  const days = useMemo(() =>
    viewMode === 'semana' ? getWeekDays(anchor) :
    viewMode === 'dia'    ? [anchor] :
    [],
    [viewMode, anchor],
  );

  // All events unified
  const allEvents = useMemo(() => {
    const agEvs  = buildAgEvents(
      agendamentos.filter(a => !filtroProfissional || a.profissional === filtroProfissional),
      clientes,
      itens,
    );
    const bds    = buildBirthdays(clientes, anchor.getFullYear());
    const fus    = buildFollowUps(agendamentos, clientes, itens);
    const gEvs   = buildGoogleEvents(googleRaw);
    return [...agEvs, ...bds, ...fus, ...gEvs];
  }, [agendamentos, clientes, itens, googleRaw, filtroProfissional, anchor]);

  // Navigation
  const navPrev = useCallback(() => setAnchor(a => addDays(a, viewMode==='semana'?-7:viewMode==='dia'?-1:-new Date(a.getFullYear(),a.getMonth()+1,0).getDate())), [viewMode]);
  const navNext = useCallback(() => setAnchor(a => addDays(a, viewMode==='semana'?7:viewMode==='dia'?1:new Date(a.getFullYear(),a.getMonth()+1,0).getDate())), [viewMode]);

  function handleSave(data: AgendamentoInput) {
    if (modal?.ag) atualizarAgendamento(modal.ag.id, data);
    else            criarAgendamento(data);
    refresh();
  }
  function handleDelete() { if (modal?.ag) { deletarAgendamento(modal.ag.id); refresh(); } }

  // Header label
  const headerLabel = useMemo(() => {
    if (viewMode === 'dia')    return `${DIAS[anchor.getDay()]}, ${anchor.getDate()} de ${MESES[anchor.getMonth()]} de ${anchor.getFullYear()}`;
    if (viewMode === 'semana') {
      const f=days[0],l=days[6]; if(!f||!l) return '';
      return f.getMonth()===l.getMonth()
        ? `${f.getDate()}–${l.getDate()} de ${MESES[f.getMonth()]} ${f.getFullYear()}`
        : `${f.getDate()} ${MESES_C[f.getMonth()]} – ${l.getDate()} ${MESES_C[l.getMonth()]} ${f.getFullYear()}`;
    }
    return `${MESES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }, [viewMode, anchor, days]);

  // Today's list for sidebar
  const todayList = useMemo(() =>
    allEvents.filter(e => e.date === todayStr && !e.allDay).sort((a,b)=>(a.hora??'').localeCompare(b.hora??'')),
    [allEvents, todayStr],
  );

  const showSidebar = viewMode !== 'mes';

  return (
    <div className="flex flex-col gap-3" style={{ height: 'calc(100vh - 96px)', minHeight: 600 }}>

      {/* ── Google Calendar banner ── */}
      {!googleConnected && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 flex-shrink-0"
          style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.82 8.254l-5.25 5.248-2.25-2.25a.75.75 0 10-1.062 1.062l2.782 2.783a.748.748 0 001.062 0l5.781-5.78A.75.75 0 0017.82 8.254z"/>
          </svg>
          <p className="text-sm text-blue-700 flex-1">
            Conecte o <strong>Google Agenda</strong> para ver seus eventos sincronizados no calendário.
          </p>
          <button
            onClick={() => signIn('google')}
            className="px-4 py-1.5 text-xs font-bold rounded-lg text-white flex-shrink-0 hover:opacity-90"
            style={{ backgroundColor: '#1D4ED8' }}
          >
            Conectar
          </button>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        <h1 className="text-2xl font-bold mr-1" style={{ color: '#1B2A4A' }}>Agenda</h1>

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['mes','semana','dia'] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)} className="px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
              style={viewMode===v?{backgroundColor:'#1B2A4A',color:'white'}:{backgroundColor:'white',color:'#6B7280'}}>
              {v==='mes'?'Mês':v==='semana'?'Semana':'Dia'}
            </button>
          ))}
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1">
          <button onClick={navPrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={() => setAnchor(new Date(hoje))} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Hoje</button>
          <button onClick={navNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        <span className="text-sm font-medium text-gray-500">{headerLabel}</span>

        <div className="ml-auto flex items-center gap-2">
          {viewMode !== 'mes' && (
            <select value={filtroProfissional} onChange={e => setFiltro(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none">
              <option value="">Todos os profissionais</option>
              {profissionais.filter(p => p.ativo).map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
            </select>
          )}
          {googleConnected && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"/>Google Agenda
            </span>
          )}
          <button onClick={() => setModal({})} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}>
            + Novo
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">

        {/* Sidebar (week/day only) */}
        {showSidebar && (
          <div className="w-52 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
              <MiniCal selected={anchor} onSelect={d => setAnchor(d)} events={allEvents} />
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Legenda</p>
              {[
                { label: 'Agendamento', bg: '#EFF6FF', border: '#1D4ED8' },
                { label: 'Aniversário',  ...EVENT_COLORS.birthday },
                { label: 'Follow-up',    ...EVENT_COLORS.followup },
                { label: 'Google Agenda',...EVENT_COLORS.google },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: l.bg, borderLeft: `3px solid ${l.border}` }}/>
                  <span className="text-[11px] text-gray-600">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Today list */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="px-3 py-2.5 border-b border-gray-50 flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold" style={{color:'#1B2A4A'}}>Hoje</span>
                {todayList.length > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{backgroundColor:'#1B2A4A',color:'#C9A84C'}}>{todayList.length}</span>}
              </div>
              {todayList.length === 0
                ? <p className="text-xs text-gray-400 text-center py-6">Sem eventos hoje</p>
                : <ul className="divide-y divide-gray-50 overflow-y-auto">
                    {todayList.map(ev => (
                      <li key={ev.id} onClick={() => setDetail(ev)} className="px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold" style={{color:'#C9A84C'}}>{ev.hora}</span>
                          <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:ev.border}}/>
                        </div>
                        <p className="text-xs font-semibold truncate" style={{color:'#1B2A4A'}}>{ev.title}</p>
                      </li>
                    ))}
                  </ul>
              }
            </div>
          </div>
        )}

        {/* Calendar card */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">

          {/* Day-of-week header (week/day views) */}
          {viewMode !== 'mes' && (
            <div className="flex flex-shrink-0 border-b border-gray-100">
              <div className="w-14 flex-shrink-0"/>
              {days.map(d => {
                const ds=toDateStr(d), isToday=ds===todayStr;
                const cnt=allEvents.filter(e=>e.date===ds&&!e.allDay&&(!filtroProfissional||e.agendamento?.profissional===filtroProfissional)).length;
                return (
                  <div key={ds} className="flex-1 py-2 text-center border-l border-gray-50" style={isToday?{backgroundColor:'#EEF2FF'}:{}}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{DIAS[d.getDay()]}</p>
                    <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-base font-bold ${isToday?'text-white':'text-gray-700'}`} style={isToday?{backgroundColor:'#1B2A4A'}:{}}>
                      {d.getDate()}
                    </div>
                    {cnt > 0 && <p className="text-[9px] font-bold" style={{color:'#C9A84C'}}>{cnt} ag.</p>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Views */}
          {viewMode === 'mes' && (
            <MonthView
              year={anchor.getFullYear()}
              month={anchor.getMonth()}
              events={allEvents}
              todayStr={todayStr}
              onDayClick={ds => { setAnchor(new Date(ds+'T12:00')); setViewMode('dia'); }}
              onEventClick={ev => {
                if (ev.type === 'agendamento' && ev.agendamento) setModal({ ag: ev.agendamento });
                else setDetail(ev);
              }}
            />
          )}

          {(viewMode === 'semana' || viewMode === 'dia') && (
            <GradeView
              days={days}
              events={allEvents}
              todayStr={todayStr}
              onSlotClick={(date, hora) => setModal({ dataInicial: date, horaInicial: hora })}
              onEventClick={ev => {
                if (ev.type === 'agendamento' && ev.agendamento) setModal({ ag: ev.agendamento });
                else setDetail(ev);
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {detail && !modal && (
        <EventDetail
          ev={detail}
          onEdit={() => { if (detail.agendamento) { setModal({ ag: detail.agendamento }); setDetail(null); } }}
          onClose={() => setDetail(null)}
        />
      )}

      {modal && (
        <ModalAgendamento
          inicial={modal.ag}
          dataInicial={modal.dataInicial}
          horaInicial={modal.horaInicial}
          clientes={clientes}
          profissionais={profissionais}
          itens={itens}
          onSave={handleSave}
          onDelete={modal.ag ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
