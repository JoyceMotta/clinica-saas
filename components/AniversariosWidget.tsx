'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listarClientesLocal, type ClienteLocal } from '@/lib/local-storage-clientes';
import {
  aniversariosEstaSemana,
  aniversariosEsteMes,
  aniversariosAlertar,
  diasParaAniversario,
  isAniversarioHoje,
  jaPassouEsteMes,
} from '@/lib/aniversarios';

// ─── Alerta 3 dias ────────────────────────────────────────────────────────────

function AlertaBanner({ clientes }: { clientes: ClienteLocal[] }) {
  if (clientes.length === 0) return null;
  return (
    <div
      className="rounded-xl px-5 py-4 flex items-start gap-4"
      style={{ backgroundColor: '#1B2A4A' }}
    >
      <span className="text-2xl flex-shrink-0">🎂</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: '#C9A84C' }}>
          {clientes.length === 1
            ? `${clientes[0].nome.split(' ')[0]} faz aniversário ${
                isAniversarioHoje(clientes[0].dataNascimento)
                  ? 'hoje!'
                  : `em ${diasParaAniversario(clientes[0].dataNascimento)} dia${
                      diasParaAniversario(clientes[0].dataNascimento) === 1 ? '' : 's'
                    }!`
              }`
            : `${clientes.length} aniversários nos próximos 3 dias!`}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {clientes.map((c) => {
            const dias = diasParaAniversario(c.dataNascimento);
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="text-xs text-white/70 hover:text-white transition-colors"
              >
                {c.nome.split(' ')[0]}{' '}
                <span style={{ color: '#C9A84C' }}>
                  {dias === 0 ? '(hoje 🎉)' : `(${dias}d)`}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Card semana ──────────────────────────────────────────────────────────────

function CardSemana({ clientes }: { clientes: ClienteLocal[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎂</span>
          <h3 className="font-bold text-sm" style={{ color: '#1B2A4A' }}>
            Aniversários desta semana
          </h3>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
        >
          {clientes.length}
        </span>
      </div>

      {clientes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Nenhum aniversário esta semana
        </p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {clientes.map((c) => {
            const hoje = isAniversarioHoje(c.dataNascimento);
            const dias = diasParaAniversario(c.dataNascimento);
            return (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {hoje && <span className="flex-shrink-0">🎉</span>}
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate group-hover:opacity-80 transition-opacity"
                        style={{ color: '#1B2A4A' }}
                      >
                        {c.nome}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(c.dataNascimento).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          timeZone: 'UTC',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full ml-3 flex-shrink-0"
                    style={
                      hoje
                        ? { backgroundColor: '#C9A84C', color: '#1B2A4A' }
                        : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                    }
                  >
                    {hoje ? 'Hoje 🎂' : `${dias}d`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Card mês ─────────────────────────────────────────────────────────────────

function CardMes({ clientes }: { clientes: ClienteLocal[] }) {
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h3 className="font-bold text-sm" style={{ color: '#1B2A4A' }}>
            Aniversários de {mesAtual}
          </h3>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: '#1B2A4A', color: 'white' }}
        >
          {clientes.length}
        </span>
      </div>

      {clientes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Nenhum aniversário este mês
        </p>
      ) : (
        <ul className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
          {clientes.map((c) => {
            const passou = jaPassouEsteMes(c.dataNascimento);
            const hoje = isAniversarioHoje(c.dataNascimento);
            const dia = new Date(c.dataNascimento).getUTCDate();
            return (
              <li key={c.id} className={passou ? 'opacity-40' : ''}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex items-center justify-between px-5 py-2.5 hover:bg-amber-50/60 transition-colors group"
                >
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: '#1B2A4A' }}
                    >
                      {c.nome}
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full ml-3 flex-shrink-0"
                    style={
                      hoje
                        ? { backgroundColor: '#C9A84C', color: '#1B2A4A' }
                        : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                    }
                  >
                    {hoje ? 'Hoje!' : `dia ${dia}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-5 py-3 border-t border-gray-50">
        <Link
          href="/agenda"
          className="text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: '#C9A84C' }}
        >
          Ver agenda completa →
        </Link>
      </div>
    </div>
  );
}

// ─── Widget principal ─────────────────────────────────────────────────────────

export default function AniversariosWidget() {
  const [semana, setSemana] = useState<ClienteLocal[]>([]);
  const [mes, setMes] = useState<ClienteLocal[]>([]);
  const [alertas, setAlertas] = useState<ClienteLocal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const clientes = listarClientesLocal();
    setSemana(aniversariosEstaSemana(clientes));
    setMes(aniversariosEsteMes(clientes));
    setAlertas(aniversariosAlertar(clientes));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      <AlertaBanner clientes={alertas} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSemana clientes={semana} />
        <CardMes clientes={mes} />
      </div>
    </div>
  );
}
