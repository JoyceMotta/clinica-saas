'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  buscarClienteLocalPorId,
  deletarClienteLocal,
  type ClienteLocal,
} from '@/lib/local-storage-clientes';
import { calcularIdade, getIniciais, displayTelefone } from '@/lib/formatters';
import { isAniversarioHoje, diasParaAniversario, abrirWhatsApp } from '@/lib/aniversarios';
import { registrarAuditoria } from '@/lib/local-storage-auditoria';
import TabDados from '@/components/ficha/TabDados';
import TabDocumentos from '@/components/ficha/TabDocumentos';
import TabAgenda from '@/components/ficha/TabAgenda';
import TabFinanceiro from '@/components/ficha/TabFinanceiro';
import TabProntuario from '@/components/ficha/TabProntuario';
import TabTimeline from '@/components/ficha/TabTimeline';

// ─── Tipos de aba ─────────────────────────────────────────────────────────────

type TabId = 'dados' | 'documentos' | 'agenda' | 'financeiro' | 'prontuario' | 'timeline';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dados',       label: 'Dados Cadastrais', icon: '👤' },
  { id: 'documentos',  label: 'Documentos',        icon: '📋' },
  { id: 'agenda',      label: 'Agenda',            icon: '📅' },
  { id: 'financeiro',  label: 'Financeiro',        icon: '💰' },
  { id: 'prontuario',  label: 'Prontuário',        icon: '🩺' },
  { id: 'timeline',    label: 'Linha do Tempo',    icon: '📜' },
];

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  id: string;
}

export default function ClienteFicha({ id }: Props) {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClienteLocal | null | 'loading'>('loading');
  const [abaAtiva, setAbaAtiva] = useState<TabId>('dados');
  const auditadoRef = useRef(false);

  useEffect(() => {
    const c = buscarClienteLocalPorId(id) ?? null;
    setCliente(c);

    // ── Auditoria: registra VISUALIZOU uma única vez por montagem ──
    if (c && !auditadoRef.current) {
      auditadoRef.current = true;
      registrarAuditoria({
        acao:      'VISUALIZOU',
        entidade:  'cliente',
        entidadeId: id,
        clienteId: id,
        descricao: `Abriu a ficha do cliente "${c.nome}"`,
      });
    }
  }, [id]);

  // ── Estados de carregamento / não encontrado ────────────────────────────────
  if (cliente === 'loading') {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2A4A', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="max-w-2xl mx-auto text-center pt-24 space-y-4">
        <p className="text-5xl">🔍</p>
        <h1 className="text-xl font-bold" style={{ color: '#1B2A4A' }}>Cliente não encontrado</h1>
        <p className="text-gray-500 text-sm">Este cadastro não existe ou foi removido.</p>
        <Link
          href="/clientes"
          className="inline-block mt-4 px-5 py-2.5 text-sm font-semibold rounded-lg text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          ← Voltar para Clientes
        </Link>
      </div>
    );
  }

  const idade = calcularIdade(cliente.dataNascimento);
  const iniciais = getIniciais(cliente.nome);
  const primeiroNome = cliente.nome.trim().split(' ')[0];
  const ehAniversario = isAniversarioHoje(cliente.dataNascimento);
  const diasAte = diasParaAniversario(cliente.dataNascimento);
  const querMsg = cliente.aniversarioMensagem !== false;

  function handleDelete() {
    const c = cliente as ClienteLocal;
    if (!confirm(`Excluir "${c.nome}"?\nEsta ação não pode ser desfeita.`)) return;
    deletarClienteLocal(id);
    router.push('/clientes');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">

      {/* ── Banner aniversário hoje ── */}
      {ehAniversario && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
          style={{ backgroundColor: '#C9A84C' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl flex-shrink-0">🎂</span>
            <div>
              <p className="font-bold" style={{ color: '#1B2A4A' }}>
                Hoje é aniversário de {primeiroNome}!
              </p>
              <p className="text-sm" style={{ color: 'rgba(27,42,74,0.7)' }}>
                Envie os parabéns e ofereça uma condição especial 🎉
              </p>
            </div>
          </div>
          {querMsg && (
            <button
              type="button"
              onClick={() => abrirWhatsApp(cliente)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1B2A4A', color: 'white' }}
            >
              <span>📱</span> Enviar parabéns via WhatsApp
            </button>
          )}
        </div>
      )}

      {/* ── Alerta 3 dias antes ── */}
      {!ehAniversario && diasAte <= 3 && diasAte > 0 && (
        <div
          className="rounded-xl px-5 py-3.5 flex items-center justify-between gap-4 border-l-4"
          style={{ backgroundColor: '#FFFBF0', borderColor: '#C9A84C' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">📅</span>
            <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
              Aniversário de {primeiroNome} em{' '}
              <strong>{diasAte} {diasAte === 1 ? 'dia' : 'dias'}</strong>!
              {querMsg && ' Prepare a mensagem de parabéns.'}
            </p>
          </div>
          {querMsg && (
            <button
              type="button"
              onClick={() => abrirWhatsApp(cliente)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold flex-shrink-0 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
            >
              <span>📱</span> Preparar mensagem
            </button>
          )}
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/clientes" className="hover:text-navy transition-colors" style={{ color: '#6B7280' }}>
          Clientes
        </Link>
        <span>/</span>
        <span className="font-medium truncate max-w-xs" style={{ color: '#1B2A4A' }}>{cliente.nome}</span>
      </nav>

      {/* ── Banner do cliente ── */}
      <div className="rounded-xl p-6 text-white" style={{ backgroundColor: '#1B2A4A' }}>
        <div className="flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 select-none"
              style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
            >
              {iniciais}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold leading-tight">{cliente.nome}</h1>
                {cliente.menorDeIdade && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#C9A84C', borderColor: 'rgba(201,168,76,0.3)' }}>
                    Menor de Idade
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <span>{idade} ano{idade !== 1 ? 's' : ''}</span>
                {cliente.sexo && <><span>•</span><span>{cliente.sexo}</span></>}
                <span>•</span>
                <span>{displayTelefone(cliente.whatsapp)}</span>
              </div>
              {cliente.email && (
                <p className="text-sm mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{cliente.email}</p>
              )}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/clientes/${cliente.id}/editar`}
              className="px-4 py-2 text-sm font-semibold rounded-lg border transition-colors hover:opacity-90"
              style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
            >
              Editar
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-400 text-red-400 hover:bg-red-400/10 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div>
        {/* Barra de abas */}
        <div className="flex overflow-x-auto border-b border-gray-200 -mb-px">
          {TABS.map(({ id: tabId, label, icon }) => {
            const active = abaAtiva === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setAbaAtiva(tabId)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0"
                style={
                  active
                    ? { borderColor: '#1B2A4A', color: '#1B2A4A' }
                    : { borderColor: 'transparent', color: '#9CA3AF' }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#1B2A4A';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo da aba */}
        <div className="pt-5">
          {abaAtiva === 'dados'      && <TabDados      cliente={cliente} />}
          {abaAtiva === 'documentos' && <TabDocumentos clienteId={cliente.id} />}
          {abaAtiva === 'agenda'     && <TabAgenda     clienteId={cliente.id} />}
          {abaAtiva === 'financeiro' && <TabFinanceiro clienteId={cliente.id} />}
          {abaAtiva === 'prontuario' && <TabProntuario clienteId={cliente.id} />}
          {abaAtiva === 'timeline'   && <TabTimeline   cliente={cliente} />}
        </div>
      </div>

      {/* ── Voltar ── */}
      <div className="pt-2">
        <Link
          href="/clientes"
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: '#6B7280' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1B2A4A')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Clientes
        </Link>
      </div>

    </div>
  );
}
