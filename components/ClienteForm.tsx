'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { salvarClienteLocal } from '@/lib/local-storage-clientes';
import { type ClienteInput, type ClienteFormErrors } from '@/lib/types';
import { formatCPF, formatTelefone, formatCEP, validarCPF } from '@/lib/formatters';
import { MENSAGEM_PADRAO } from '@/lib/aniversarios';

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const SEXO_OPTS = ['Feminino', 'Masculino', 'Outro'];
const ESTADO_CIVIL_OPTS = [
  'Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável', 'Outro',
];
const PARENTESCO_EMER_OPTS = [
  'Cônjuge/Companheiro(a)', 'Pai/Mãe', 'Filho(a)', 'Irmão/Irmã', 'Avô/Avó', 'Outro',
];
const PARENTESCO_RESP_OPTS = ['Pai', 'Mãe', 'Tutor(a) Legal', 'Outro'];
const COMO_CONHECEU_OPTS = ['Instagram', 'TikTok', 'Google', 'Indicação', 'Outro'];
const UF_OPTS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];
const TODAY = new Date().toISOString().split('T')[0];

const INITIAL: ClienteInput = {
  nome: '', cpf: '', rg: '', rgOrgaoEmissor: '', dataNascimento: '', sexo: '',
  estadoCivil: '', profissao: '', nacionalidade: 'Brasileiro(a)',
  whatsapp: '', telefoneFix: '', email: '',
  cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  nomeEmergencia: '', parentescoEmergencia: '', telefoneEmergencia: '',
  menorDeIdade: false,
  nomeResponsavel: '', cpfResponsavel: '', rgResponsavel: '',
  dataNascResponsavel: '', parentescoResponsavel: '', whatsappResponsavel: '',
  emailResponsavel: '', enderecoIgual: true,
  cepResponsavel: '', ruaResponsavel: '', numeroResponsavel: '',
  complementoResponsavel: '', bairroResponsavel: '', cidadeResponsavel: '',
  ufResponsavel: '', comoConheceu: '',
  aniversarioMensagem: true,
  mensagemAniversario: '',
};

// Rótulos para o sumário de erros
const FIELD_LABELS: Partial<Record<keyof ClienteFormErrors, string>> = {
  nome: 'Nome completo',
  cpf: 'CPF',
  rg: 'RG',
  rgOrgaoEmissor: 'Órgão emissor do RG',
  dataNascimento: 'Data de nascimento',
  sexo: 'Sexo',
  estadoCivil: 'Estado civil',
  profissao: 'Profissão',
  nacionalidade: 'Nacionalidade',
  whatsapp: 'WhatsApp',
  email: 'Email',
  cep: 'CEP',
  rua: 'Rua / Logradouro',
  numero: 'Número',
  bairro: 'Bairro',
  cidade: 'Cidade',
  uf: 'UF',
  nomeEmergencia: 'Nome do contato de emergência',
  telefoneEmergencia: 'Telefone de emergência',
  nomeResponsavel: 'Nome do responsável legal',
  cpfResponsavel: 'CPF do responsável',
  rgResponsavel: 'RG do responsável',
  parentescoResponsavel: 'Parentesco do responsável',
  whatsappResponsavel: 'WhatsApp do responsável',
  cepResponsavel: 'CEP do responsável',
  ruaResponsavel: 'Rua do responsável',
  numeroResponsavel: 'Número do responsável',
  bairroResponsavel: 'Bairro do responsável',
  cidadeResponsavel: 'Cidade do responsável',
  ufResponsavel: 'UF do responsável',
};

// ═══════════════════════════════════════════════════════════════════════════════
//  VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

function validateForm(v: ClienteInput): ClienteFormErrors {
  const e: ClienteFormErrors = {};

  // ── Dados pessoais ──────────────────────────────────────────────────────────
  if (!v.nome.trim()) e.nome = ['Campo obrigatório'];

  const cpfDig = v.cpf.replace(/\D/g, '');
  if (!cpfDig) e.cpf = ['Campo obrigatório'];
  else if (!validarCPF(v.cpf)) e.cpf = ['CPF inválido — verifique os dígitos'];

  if (!v.rg.trim()) e.rg = ['Campo obrigatório'];
  if (!v.rgOrgaoEmissor.trim()) e.rgOrgaoEmissor = ['Campo obrigatório'];
  if (!v.dataNascimento) e.dataNascimento = ['Campo obrigatório'];
  if (!v.sexo) e.sexo = ['Campo obrigatório'];
  if (!v.estadoCivil) e.estadoCivil = ['Campo obrigatório'];
  if (!v.profissao.trim()) e.profissao = ['Campo obrigatório'];
  if (!v.nacionalidade.trim()) e.nacionalidade = ['Campo obrigatório'];

  // ── Contato ─────────────────────────────────────────────────────────────────
  if (!v.whatsapp.replace(/\D/g, '')) e.whatsapp = ['Campo obrigatório'];
  if (!v.email.trim()) e.email = ['Campo obrigatório'];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))
    e.email = ['E-mail inválido'];

  // ── Endereço ────────────────────────────────────────────────────────────────
  if (!v.cep.replace(/\D/g, '')) e.cep = ['Campo obrigatório'];
  if (!v.rua.trim()) e.rua = ['Campo obrigatório'];
  if (!v.numero.trim()) e.numero = ['Campo obrigatório'];
  if (!v.bairro.trim()) e.bairro = ['Campo obrigatório'];
  if (!v.cidade.trim()) e.cidade = ['Campo obrigatório'];
  if (!v.uf) e.uf = ['Campo obrigatório'];

  // ── Contato de emergência ───────────────────────────────────────────────────
  if (!v.nomeEmergencia.trim()) e.nomeEmergencia = ['Campo obrigatório'];
  if (!v.telefoneEmergencia.replace(/\D/g, '')) e.telefoneEmergencia = ['Campo obrigatório'];

  // ── Responsável legal (se menor) ────────────────────────────────────────────
  if (v.menorDeIdade) {
    if (!v.nomeResponsavel.trim()) e.nomeResponsavel = ['Campo obrigatório'];

    const cpfRDig = v.cpfResponsavel.replace(/\D/g, '');
    if (!cpfRDig) e.cpfResponsavel = ['Campo obrigatório'];
    else if (!validarCPF(v.cpfResponsavel)) e.cpfResponsavel = ['CPF inválido'];

    if (!v.rgResponsavel.trim()) e.rgResponsavel = ['Campo obrigatório'];
    if (!v.parentescoResponsavel) e.parentescoResponsavel = ['Campo obrigatório'];
    if (!v.whatsappResponsavel.replace(/\D/g, '')) e.whatsappResponsavel = ['Campo obrigatório'];

    if (!v.enderecoIgual) {
      if (!v.cepResponsavel.replace(/\D/g, '')) e.cepResponsavel = ['Campo obrigatório'];
      if (!v.ruaResponsavel.trim()) e.ruaResponsavel = ['Campo obrigatório'];
      if (!v.numeroResponsavel.trim()) e.numeroResponsavel = ['Campo obrigatório'];
      if (!v.bairroResponsavel.trim()) e.bairroResponsavel = ['Campo obrigatório'];
      if (!v.cidadeResponsavel.trim()) e.cidadeResponsavel = ['Campo obrigatório'];
      if (!v.ufResponsavel) e.ufResponsavel = ['Campo obrigatório'];
    }
  }

  return e;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS VISUAIS
// ═══════════════════════════════════════════════════════════════════════════════

function iCls(err?: string) {
  return [
    'w-full px-3.5 py-2.5 rounded-lg border text-navy text-sm',
    'focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy',
    'disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors placeholder-gray-400',
    err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
  ].join(' ');
}

function SH({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          {n}
        </span>
        <h2
          className="text-[13px] font-extrabold tracking-widest uppercase"
          style={{ color: '#1B2A4A' }}
        >
          {title}
        </h2>
      </div>
      <div
        className="mt-2.5 h-0.5 rounded"
        style={{ background: 'linear-gradient(to right, #C9A84C 20%, transparent)' }}
      />
    </div>
  );
}

function F({
  label, req, err, children, cls = '',
}: {
  label: string; req?: boolean; err?: string; children: React.ReactNode; cls?: string;
}) {
  return (
    <div className={cls} {...(err ? { 'data-haserr': '1' } : {})}>
      <label className="block text-[12.5px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
        {req && <span className="text-red-500 ml-0.5 normal-case">*</span>}
      </label>
      {children}
      {err && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {err}
        </p>
      )}
    </div>
  );
}

function Sel({
  name, opts, value, onChange, ph, err, disabled,
}: {
  name: string; opts: string[]; value: string;
  onChange: (v: string) => void; ph?: string; err?: string; disabled?: boolean;
}) {
  return (
    <select
      name={name} value={value} onChange={(e) => onChange(e.target.value)}
      disabled={disabled} className={iCls(err)}
    >
      <option value="">{ph ?? 'Selecione...'}</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none w-fit group">
      <button
        type="button" role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gold shadow-sm"
        style={{ backgroundColor: checked ? '#C9A84C' : '#D1D5DB' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
      <span className="text-sm font-medium text-gray-700 group-hover:text-navy transition-colors">
        {label}
      </span>
    </label>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BLOCO DE ENDEREÇO (reutilizado para paciente e responsável)
// ═══════════════════════════════════════════════════════════════════════════════

function EnderecoFields({
  prefix, v, set, onCepChange, cepLoading, disabled, errors, req = false,
}: {
  prefix: '' | 'Responsavel';
  v: ClienteInput;
  set: (f: keyof ClienteInput, val: string) => void;
  onCepChange: (val: string) => void;
  cepLoading: boolean;
  disabled: boolean;
  errors: ClienteFormErrors;
  req?: boolean;
}) {
  const p = prefix === 'Responsavel';
  const cepKey  = (p ? 'cepResponsavel'          : 'cep')   as keyof ClienteInput;
  const ruaKey  = (p ? 'ruaResponsavel'           : 'rua')   as keyof ClienteInput;
  const numKey  = (p ? 'numeroResponsavel'         : 'numero') as keyof ClienteInput;
  const compKey = (p ? 'complementoResponsavel'    : 'complemento') as keyof ClienteInput;
  const baiKey  = (p ? 'bairroResponsavel'         : 'bairro') as keyof ClienteInput;
  const cidKey  = (p ? 'cidadeResponsavel'         : 'cidade') as keyof ClienteInput;
  const ufKey   = (p ? 'ufResponsavel'             : 'uf')   as keyof ClienteInput;

  const er = (k: keyof ClienteInput) =>
    (errors as Record<string, string[] | undefined>)[k as string]?.[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">

      <F label="CEP" req={req} cls="sm:col-span-2" err={er(cepKey)}>
        <div className="relative">
          <input
            type="text" inputMode="numeric" placeholder="00000-000"
            value={v[cepKey] as string}
            onChange={(e) => onCepChange(e.target.value)}
            maxLength={9} className={iCls(er(cepKey))} disabled={disabled}
          />
          {cepLoading && (
            <span className="absolute inset-y-0 right-3 flex items-center text-gold">
              <Spinner />
            </span>
          )}
        </div>
      </F>

      <F label="Rua / Logradouro" req={req} cls="sm:col-span-4" err={er(ruaKey)}>
        <input
          type="text" placeholder="Av. Paulista"
          value={v[ruaKey] as string}
          onChange={(e) => set(ruaKey, e.target.value)}
          className={iCls(er(ruaKey))} disabled={disabled}
        />
      </F>

      <F label="Número" req={req} cls="sm:col-span-2" err={er(numKey)}>
        <input
          type="text" placeholder="100"
          value={v[numKey] as string}
          onChange={(e) => set(numKey, e.target.value)}
          className={iCls(er(numKey))} disabled={disabled}
        />
      </F>

      <F label="Complemento" cls="sm:col-span-4">
        <input
          type="text" placeholder="Apto 42, Bloco B"
          value={v[compKey] as string}
          onChange={(e) => set(compKey, e.target.value)}
          className={iCls()} disabled={disabled}
        />
      </F>

      <F label="Bairro" req={req} cls="sm:col-span-2" err={er(baiKey)}>
        <input
          type="text" placeholder="Centro"
          value={v[baiKey] as string}
          onChange={(e) => set(baiKey, e.target.value)}
          className={iCls(er(baiKey))} disabled={disabled}
        />
      </F>

      <F label="Cidade" req={req} cls="sm:col-span-3" err={er(cidKey)}>
        <input
          type="text" placeholder="São Paulo"
          value={v[cidKey] as string}
          onChange={(e) => set(cidKey, e.target.value)}
          className={iCls(er(cidKey))} disabled={disabled}
        />
      </F>

      <F label="UF" req={req} cls="sm:col-span-1" err={er(ufKey)}>
        <Sel
          name={ufKey as string} opts={UF_OPTS} value={v[ufKey] as string}
          onChange={(val) => set(ufKey, val)} ph="—"
          disabled={disabled} err={er(ufKey)}
        />
      </F>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function ClienteForm() {
  const router = useRouter();
  const [v, setV] = useState<ClienteInput>(INITIAL);
  const [errors, setErrors] = useState<ClienteFormErrors>({});
  const [cepLoading, setCepLoading] = useState<'p' | 'r' | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Updaters ──────────────────────────────────────────────────────────────
  const set = (f: keyof ClienteInput, val: string | boolean) =>
    setV((prev) => ({ ...prev, [f]: val }));
  const setStr = (f: keyof ClienteInput, val: string) => set(f, val);

  // ── CEP auto-preenchimento ────────────────────────────────────────────────
  function handleCep(raw: string, who: 'p' | 'r') {
    const fmt = formatCEP(raw);
    setStr(who === 'p' ? 'cep' : 'cepResponsavel', fmt);
    if (fmt.replace(/\D/g, '').length === 8) fetchCep(fmt.replace(/\D/g, ''), who);
  }

  async function fetchCep(digits: string, who: 'p' | 'r') {
    setCepLoading(who);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await res.json();
      if (!d.erro) {
        if (who === 'p') {
          setV((p) => ({
            ...p,
            rua: d.logradouro || p.rua,
            bairro: d.bairro || p.bairro,
            cidade: d.localidade || p.cidade,
            uf: d.uf || p.uf,
          }));
        } else {
          setV((p) => ({
            ...p,
            ruaResponsavel: d.logradouro || p.ruaResponsavel,
            bairroResponsavel: d.bairro || p.bairroResponsavel,
            cidadeResponsavel: d.localidade || p.cidadeResponsavel,
            ufResponsavel: d.uf || p.ufResponsavel,
          }));
        }
      }
    } catch { /* silent */ }
    finally { setCepLoading(null); }
  }

  // ── Endereço igual (responsável = menor) ─────────────────────────────────
  function handleEnderecoIgual(igual: boolean) {
    setV((p) => ({
      ...p,
      enderecoIgual: igual,
      ...(igual
        ? {
            cepResponsavel: p.cep,
            ruaResponsavel: p.rua,
            numeroResponsavel: p.numero,
            complementoResponsavel: p.complemento,
            bairroResponsavel: p.bairro,
            cidadeResponsavel: p.cidade,
            ufResponsavel: p.uf,
          }
        : {}),
    }));
  }

  // ── Resetar campos do responsável quando desativa toggle ─────────────────
  function handleMenorToggle(val: boolean) {
    if (!val) {
      setV((p) => ({
        ...p,
        menorDeIdade: false,
        nomeResponsavel: '', cpfResponsavel: '', rgResponsavel: '',
        dataNascResponsavel: '', parentescoResponsavel: '', whatsappResponsavel: '',
        emailResponsavel: '', enderecoIgual: true,
        cepResponsavel: '', ruaResponsavel: '', numeroResponsavel: '',
        complementoResponsavel: '', bairroResponsavel: '', cidadeResponsavel: '',
        ufResponsavel: '',
      }));
    } else {
      set('menorDeIdade', true);
    }
  }

  // ── Submissão ─────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);

    const errs = validateForm(v);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => {
        document.querySelector('[data-haserr]')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 50);
      return;
    }

    setErrors({});
    setIsPending(true);
    const id = salvarClienteLocal(v);
    router.push(`/clientes/${id}`);
  }

  const errCount = Object.keys(errors).filter((k) => k !== '_form').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-10 pb-6">

        {/* ══════════════════════════════════════════════════════
            AVISO OBRIGATÓRIO
        ══════════════════════════════════════════════════════ */}
        <div
          className="flex items-start gap-4 rounded-xl border-l-4 px-5 py-4"
          style={{ borderColor: '#C9A84C', backgroundColor: '#FFFBF0' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0 mt-0.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ color: '#C9A84C' }}
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-bold" style={{ color: '#1B2A4A' }}>
              Todos os campos marcados com{' '}
              <span className="text-red-500 font-extrabold">*</span>{' '}
              são obrigatórios.
            </p>
            <p className="text-xs mt-0.5 text-gray-600 leading-relaxed">
              O preenchimento completo é essencial para fins{' '}
              <strong>clínicos, jurídicos e de cobrança</strong>.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SUMÁRIO DE ERROS (aparece após primeira tentativa)
        ══════════════════════════════════════════════════════ */}
        {submitted && errCount > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3">
            <p className="text-sm font-bold text-red-700 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {errCount === 1
                ? '1 campo obrigatório não preenchido:'
                : `${errCount} campos obrigatórios não preenchidos:`}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {Object.entries(errors)
                .filter(([k]) => k !== '_form')
                .map(([k, msgs]) => (
                  <li key={k} className="flex items-start gap-2 text-xs text-red-600">
                    <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                    <span>
                      <strong>
                        {FIELD_LABELS[k as keyof typeof FIELD_LABELS] ?? k}
                      </strong>
                      {' — '}
                      <em>{(msgs as string[])[0]}</em>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SEÇÃO 1 — DADOS PESSOAIS
        ══════════════════════════════════════════════════════ */}
        <section>
          <SH n={1} title="Dados Pessoais" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <F label="Nome completo" req err={errors.nome?.[0]} cls="sm:col-span-2">
              <input
                name="nome" type="text" placeholder="Ex: Ana Beatriz Santos"
                value={v.nome} onChange={(e) => setStr('nome', e.target.value)}
                className={iCls(errors.nome?.[0])} disabled={isPending}
              />
            </F>

            <F label="CPF" req err={errors.cpf?.[0]}>
              <input
                name="cpf" type="text" inputMode="numeric"
                placeholder="000.000.000-00"
                value={v.cpf}
                onChange={(e) => setStr('cpf', formatCPF(e.target.value))}
                maxLength={14} className={iCls(errors.cpf?.[0])} disabled={isPending}
              />
            </F>

            <F label="RG" req err={errors.rg?.[0]}>
              <input
                name="rg" type="text" placeholder="00.000.000-0"
                value={v.rg} onChange={(e) => setStr('rg', e.target.value)}
                className={iCls(errors.rg?.[0])} disabled={isPending}
              />
            </F>

            <F label="Órgão Emissor do RG" req err={errors.rgOrgaoEmissor?.[0]} cls="sm:col-span-2">
              <input
                name="rgOrgaoEmissor" type="text" placeholder="Ex: SSP/SP, DETRAN/RJ"
                value={v.rgOrgaoEmissor}
                onChange={(e) => setStr('rgOrgaoEmissor', e.target.value.toUpperCase())}
                className={iCls(errors.rgOrgaoEmissor?.[0])} disabled={isPending}
              />
            </F>

            <F label="Data de Nascimento" req err={errors.dataNascimento?.[0]}>
              <input
                name="dataNascimento" type="date"
                value={v.dataNascimento}
                onChange={(e) => setStr('dataNascimento', e.target.value)}
                max={TODAY}
                className={iCls(errors.dataNascimento?.[0])} disabled={isPending}
              />
            </F>

            <F label="Sexo" req err={errors.sexo?.[0]}>
              <Sel
                name="sexo" opts={SEXO_OPTS} value={v.sexo}
                onChange={(val) => setStr('sexo', val)}
                disabled={isPending} err={errors.sexo?.[0]}
              />
            </F>

            <F label="Estado Civil" req err={errors.estadoCivil?.[0]}>
              <Sel
                name="estadoCivil" opts={ESTADO_CIVIL_OPTS} value={v.estadoCivil}
                onChange={(val) => setStr('estadoCivil', val)}
                disabled={isPending} err={errors.estadoCivil?.[0]}
              />
            </F>

            <F label="Profissão" req err={errors.profissao?.[0]}>
              <input
                name="profissao" type="text" placeholder="Ex: Professora"
                value={v.profissao} onChange={(e) => setStr('profissao', e.target.value)}
                className={iCls(errors.profissao?.[0])} disabled={isPending}
              />
            </F>

            <F label="Nacionalidade" req err={errors.nacionalidade?.[0]} cls="sm:col-span-2">
              <input
                name="nacionalidade" type="text" placeholder="Brasileiro(a)"
                value={v.nacionalidade}
                onChange={(e) => setStr('nacionalidade', e.target.value)}
                className={iCls(errors.nacionalidade?.[0])} disabled={isPending}
              />
            </F>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SEÇÃO 2 — CONTATO
        ══════════════════════════════════════════════════════ */}
        <section>
          <SH n={2} title="Contato" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <F label="WhatsApp" req err={errors.whatsapp?.[0]}>
              <input
                name="whatsapp" type="text" inputMode="tel"
                placeholder="(00) 00000-0000"
                value={v.whatsapp}
                onChange={(e) => setStr('whatsapp', formatTelefone(e.target.value))}
                maxLength={15} className={iCls(errors.whatsapp?.[0])} disabled={isPending}
              />
            </F>

            <F label="Telefone Fixo">
              <input
                name="telefoneFix" type="text" inputMode="tel"
                placeholder="(00) 0000-0000"
                value={v.telefoneFix}
                onChange={(e) => setStr('telefoneFix', formatTelefone(e.target.value))}
                maxLength={14} className={iCls()} disabled={isPending}
              />
            </F>

            <F label="Email" req err={errors.email?.[0]} cls="sm:col-span-2">
              <input
                name="email" type="email" placeholder="cliente@email.com"
                value={v.email} onChange={(e) => setStr('email', e.target.value)}
                className={iCls(errors.email?.[0])} disabled={isPending}
              />
            </F>

            {/* Mensagem de aniversário */}
            <div className="sm:col-span-2">
              <div
                className="rounded-xl border p-4 space-y-4"
                style={{ borderColor: '#C9A84C33', backgroundColor: '#FFFBF0' }}
              >
                <Toggle
                  checked={v.aniversarioMensagem}
                  onChange={(val) => set('aniversarioMensagem', val)}
                  label="Enviar mensagem de parabéns no aniversário via WhatsApp"
                />

                {v.aniversarioMensagem && (
                  <div className="pl-14 space-y-2">
                    <label className="block text-[12.5px] font-semibold text-gray-500 uppercase tracking-wide">
                      Mensagem personalizada{' '}
                      <span className="text-gray-400 normal-case font-normal">(opcional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder={MENSAGEM_PADRAO}
                      value={v.mensagemAniversario}
                      onChange={(e) => setStr('mensagemAniversario', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-navy text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy disabled:bg-gray-50 disabled:cursor-not-allowed placeholder-gray-400"
                      disabled={isPending}
                    />
                    <p className="text-xs text-gray-400">
                      Use{' '}
                      <code className="text-navy bg-gray-100 px-1 py-0.5 rounded text-[11px]">
                        {'{nome}'}
                      </code>{' '}
                      para o primeiro nome. Deixe em branco para usar a mensagem padrão da clínica.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SEÇÃO 3 — ENDEREÇO
        ══════════════════════════════════════════════════════ */}
        <section>
          <SH n={3} title="Endereço" />
          <EnderecoFields
            prefix="" v={v} set={setStr}
            onCepChange={(val) => handleCep(val, 'p')}
            cepLoading={cepLoading === 'p'} disabled={isPending}
            errors={errors} req
          />
        </section>

        {/* ══════════════════════════════════════════════════════
            SEÇÃO 4 — CONTATO DE EMERGÊNCIA
        ══════════════════════════════════════════════════════ */}
        <section>
          <SH n={4} title="Contato de Emergência" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <F label="Nome do contato" req err={errors.nomeEmergencia?.[0]}>
              <input
                name="nomeEmergencia" type="text" placeholder="Ex: Maria Santos"
                value={v.nomeEmergencia}
                onChange={(e) => setStr('nomeEmergencia', e.target.value)}
                className={iCls(errors.nomeEmergencia?.[0])} disabled={isPending}
              />
            </F>

            <F label="Grau de parentesco">
              <Sel
                name="parentescoEmergencia" opts={PARENTESCO_EMER_OPTS}
                value={v.parentescoEmergencia}
                onChange={(val) => setStr('parentescoEmergencia', val)}
                disabled={isPending}
              />
            </F>

            <F label="Telefone de emergência" req err={errors.telefoneEmergencia?.[0]}>
              <input
                name="telefoneEmergencia" type="text" inputMode="tel"
                placeholder="(00) 00000-0000"
                value={v.telefoneEmergencia}
                onChange={(e) => setStr('telefoneEmergencia', formatTelefone(e.target.value))}
                maxLength={15} className={iCls(errors.telefoneEmergencia?.[0])} disabled={isPending}
              />
            </F>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SEÇÃO 5 — MENOR DE IDADE
        ══════════════════════════════════════════════════════ */}
        <section>
          <SH n={5} title="Cliente Menor de Idade" />
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <Toggle
              checked={v.menorDeIdade}
              onChange={handleMenorToggle}
              label="Este cliente é menor de idade"
            />
            {!v.menorDeIdade && (
              <p className="mt-2 text-xs text-amber-700 ml-14 leading-relaxed">
                Ao ativar, todos os dados do Responsável Legal serão exigidos por
                obrigação legal e clínica.
              </p>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SEÇÃO 6 — RESPONSÁVEL LEGAL (condicional)
        ══════════════════════════════════════════════════════ */}
        {v.menorDeIdade && (
          <section>
            <SH n={6} title="Responsável Legal" />

            {/* Banner de obrigatoriedade */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-xs font-semibold"
              style={{ backgroundColor: '#1B2A4A', color: '#C9A84C' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Todos os campos desta seção são obrigatórios por exigência legal.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <F
                label="Nome completo do responsável"
                req err={errors.nomeResponsavel?.[0]} cls="sm:col-span-2"
              >
                <input
                  name="nomeResponsavel" type="text" placeholder="Ex: João da Silva"
                  value={v.nomeResponsavel}
                  onChange={(e) => setStr('nomeResponsavel', e.target.value)}
                  className={iCls(errors.nomeResponsavel?.[0])} disabled={isPending}
                />
              </F>

              <F label="CPF do responsável" req err={errors.cpfResponsavel?.[0]}>
                <input
                  name="cpfResponsavel" type="text" inputMode="numeric"
                  placeholder="000.000.000-00" value={v.cpfResponsavel}
                  onChange={(e) => setStr('cpfResponsavel', formatCPF(e.target.value))}
                  maxLength={14} className={iCls(errors.cpfResponsavel?.[0])} disabled={isPending}
                />
              </F>

              <F label="RG do responsável" req err={errors.rgResponsavel?.[0]}>
                <input
                  name="rgResponsavel" type="text" placeholder="00.000.000-0"
                  value={v.rgResponsavel}
                  onChange={(e) => setStr('rgResponsavel', e.target.value)}
                  className={iCls(errors.rgResponsavel?.[0])} disabled={isPending}
                />
              </F>

              <F label="Data de nascimento do responsável">
                <input
                  name="dataNascResponsavel" type="date"
                  value={v.dataNascResponsavel}
                  onChange={(e) => setStr('dataNascResponsavel', e.target.value)}
                  max={TODAY} className={iCls()} disabled={isPending}
                />
              </F>

              <F
                label="Grau de parentesco com o menor"
                req err={errors.parentescoResponsavel?.[0]}
              >
                <Sel
                  name="parentescoResponsavel" opts={PARENTESCO_RESP_OPTS}
                  value={v.parentescoResponsavel}
                  onChange={(val) => setStr('parentescoResponsavel', val)}
                  disabled={isPending} err={errors.parentescoResponsavel?.[0]}
                />
              </F>

              <F label="WhatsApp do responsável" req err={errors.whatsappResponsavel?.[0]}>
                <input
                  name="whatsappResponsavel" type="text" inputMode="tel"
                  placeholder="(00) 00000-0000" value={v.whatsappResponsavel}
                  onChange={(e) => setStr('whatsappResponsavel', formatTelefone(e.target.value))}
                  maxLength={15} className={iCls(errors.whatsappResponsavel?.[0])} disabled={isPending}
                />
              </F>

              <F label="Email do responsável" cls="sm:col-span-2">
                <input
                  name="emailResponsavel" type="email"
                  placeholder="responsavel@email.com" value={v.emailResponsavel}
                  onChange={(e) => setStr('emailResponsavel', e.target.value)}
                  className={iCls()} disabled={isPending}
                />
              </F>

              {/* Endereço igual */}
              <div className="sm:col-span-2 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <input
                    id="endIgual" type="checkbox" checked={v.enderecoIgual}
                    onChange={(e) => handleEnderecoIgual(e.target.checked)}
                    className="w-4 h-4 rounded accent-navy cursor-pointer"
                    disabled={isPending}
                  />
                  <span className="text-sm text-gray-700 select-none">
                    Endereço do responsável é o mesmo que o do menor
                  </span>
                </label>

                {!v.enderecoIgual && (
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                      Endereço do Responsável
                    </p>
                    <EnderecoFields
                      prefix="Responsavel" v={v} set={setStr}
                      onCepChange={(val) => handleCep(val, 'r')}
                      cepLoading={cepLoading === 'r'} disabled={isPending}
                      errors={errors} req
                    />
                  </div>
                )}
              </div>

            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            SEÇÃO 7 — COMO NOS CONHECEU
        ══════════════════════════════════════════════════════ */}
        <section>
          <SH n={7} title="Como Nos Conheceu" />
          <div className="max-w-sm">
            <Sel
              name="comoConheceu" opts={COMO_CONHECEU_OPTS}
              value={v.comoConheceu}
              onChange={(val) => setStr('comoConheceu', val)}
              ph="Selecione uma origem..." disabled={isPending}
            />
          </div>
        </section>

      </div>{/* end .space-y-10 */}

      {/* ══════════════════════════════════════════════════════
          BOTÃO SALVAR — sticky no rodapé
      ══════════════════════════════════════════════════════ */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-200 -mx-6 md:-mx-8 px-6 md:px-8 py-4 mt-4">
        <div className="flex items-center justify-between gap-4">
          {submitted && errCount > 0 ? (
            <p className="text-xs text-red-600 font-semibold hidden sm:block">
              ⚠ {errCount} {errCount === 1 ? 'campo faltando' : 'campos faltando'} — corrija acima
            </p>
          ) : (
            <p className="text-xs text-gray-400 hidden sm:block">
              Campos com <span className="text-red-500">*</span> são obrigatórios
            </p>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <Link
              href="/clientes"
              className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-navy rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-bold rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
              style={{ backgroundColor: '#1B2A4A', color: 'white' }}
            >
              {isPending ? (
                <>
                  <Spinner />
                  <span>Salvando…</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Salvar Cliente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
