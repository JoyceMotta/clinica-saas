'use client';

import { useAuth } from '@/context/AuthContext';

function getSaudacao(h: number): { texto: string; emoji: string } {
  if (h < 12) return { texto: 'Bom dia',    emoji: '☀️' };
  if (h < 18) return { texto: 'Boa tarde',  emoji: '🌤️' };
  return              { texto: 'Boa noite', emoji: '🌙' };
}

export default function SaudacaoDashboard() {
  const { user } = useAuth();
  const h = new Date().getHours();
  const { texto, emoji } = getSaudacao(h);
  const primeiroNome = user?.nome?.split(' ')[0] ?? '';

  const dataFmt = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>
            {texto}{primeiroNome ? `, ${primeiroNome}` : ''}!
          </h1>
          <span className="text-2xl leading-none">{emoji}</span>
        </div>
        <p className="text-gray-500 mt-1 text-sm capitalize">
          {user?.clinicaNome && (
            <span className="font-semibold" style={{ color: '#C9A84C' }}>{user.clinicaNome} · </span>
          )}
          {dataFmt}
        </p>
      </div>
    </div>
  );
}
