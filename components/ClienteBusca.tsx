'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export default function ClienteBusca({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('q', value);
    else params.delete('q');
    startTransition(() => {
      router.replace(`/clientes?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400 pointer-events-none select-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar por nome, CPF ou email…"
        className={[
          'w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-white',
          'text-navy text-sm placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent',
          'transition-all',
          isPending ? 'opacity-60' : '',
        ].join(' ')}
      />
    </div>
  );
}
