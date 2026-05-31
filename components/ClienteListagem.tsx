'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { listarClientesLocal, type ClienteLocal } from '@/lib/local-storage-clientes';
import { displayCPF, displayTelefone, calcularIdade, getIniciais } from '@/lib/formatters';
import ClienteBusca from '@/components/ClienteBusca';

interface Props {
  initialQuery: string;
}

export default function ClienteListagem({ initialQuery }: Props) {
  const [clientes, setClientes] = useState<ClienteLocal[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setClientes(listarClientesLocal(initialQuery));
    setLoaded(true);
  }, [initialQuery]);

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Clientes</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {!loaded
              ? 'Carregando…'
              : clientes.length === 0
              ? 'Nenhum resultado'
              : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`}
            {initialQuery && loaded && ` para "${initialQuery}"`}
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
        >
          <span className="text-base leading-none font-bold">+</span>
          Novo Cliente
        </Link>
      </div>

      {/* ── Busca ── */}
      <Suspense fallback={null}>
        <ClienteBusca defaultValue={initialQuery} />
      </Suspense>

      {/* ── Conteúdo ── */}
      {!loaded ? (
        <div className="flex justify-center pt-20">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clientes.length === 0 ? (
        <EmptyState query={initialQuery} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientes.map((c) => {
            const idade = calcularIdade(c.dataNascimento);
            return (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="group block bg-white rounded-xl border border-gray-100 p-5 hover:border-gold hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 select-none"
                    style={
                      c.menorDeIdade
                        ? { backgroundColor: '#C9A84C', color: '#1B2A4A' }
                        : { backgroundColor: '#1B2A4A', color: '#fff' }
                    }
                  >
                    {getIniciais(c.nome)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-navy truncate group-hover:text-gold transition-colors">
                      {c.nome}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {idade} ano{idade !== 1 ? 's' : ''}
                      </span>
                      {c.menorDeIdade && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                          menor
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm text-gray-500 border-t border-gray-50 pt-3">
                  <li className="flex items-center gap-2">
                    <span>🪪</span>
                    <span>{displayCPF(c.cpf)}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span>📱</span>
                    <span>{displayTelefone(c.whatsapp)}</span>
                  </li>
                  {c.email && (
                    <li className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0">✉</span>
                      <span className="truncate">{c.email}</span>
                    </li>
                  )}
                </ul>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div className="mt-24 flex flex-col items-center justify-center text-center gap-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#1B2A4A' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-9 text-white/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"
          />
        </svg>
      </div>

      {query ? (
        <>
          <p className="text-lg font-semibold text-gray-700">
            Nenhum cliente encontrado
          </p>
          <p className="text-sm text-gray-400">
            Nenhum resultado para{' '}
            <span className="font-medium text-navy">"{query}"</span>.{' '}
            Tente outra busca.
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-gray-700">
            Nenhum cliente cadastrado ainda
          </p>
          <p className="text-sm text-gray-400 max-w-xs">
            Comece cadastrando o primeiro cliente da clínica.
          </p>
          <Link
            href="/clientes/novo"
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
          >
            <span className="text-base leading-none font-black">+</span>
            Cadastrar Primeiro Cliente
          </Link>
        </>
      )}
    </div>
  );
}
