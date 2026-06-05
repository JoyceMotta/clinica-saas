'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  mode: 'analisar' | 'gerar';
  correto: string[];
  ajustar: string[];
  proibido: string[];
  versaoCorrigida: string;
  postGerado?: string;
  observacoes?: string[];
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CONSELHOS = ['CRM', 'CRO', 'CFBio', 'COREN', 'CRN', 'CRP', 'CREFITO'];
const REDES     = ['Instagram', 'LinkedIn', 'TikTok/Reels'];
const LS_KEY    = 'clinica_anthropic_key';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
      style={copied
        ? { backgroundColor: '#D1FAE5', color: '#065F46' }
        : { backgroundColor: '#F3F4F6', color: '#374151' }}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          Copiado!
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          Copiar
        </>
      )}
    </button>
  );
}

// ─── Result section ───────────────────────────────────────────────────────────

function ResultSection({
  icon, label, items, bg, border, textColor,
}: {
  icon: string; label: string; items: string[];
  bg: string; border: string; textColor: string;
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border-l-4 px-5 py-4 space-y-2" style={{ backgroundColor: bg, borderLeftColor: border }}>
      <p className="text-sm font-bold flex items-center gap-2" style={{ color: textColor }}>
        <span className="text-base">{icon}</span>
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: textColor }}>
            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: border }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnalisadorPosts() {
  const [hasEnvKey, setHasEnvKey]       = useState<boolean | null>(null);
  const [savedKey, setSavedKey]         = useState('');
  const [inputKey, setInputKey]         = useState('');
  const [keySaved, setKeySaved]         = useState(false);

  const [conselho, setConselho]         = useState('CRM');
  const [redeSocial, setRedeSocial]     = useState('Instagram');
  const [postContent, setPostContent]   = useState('');
  const [descricao, setDescricao]       = useState('');

  const [loading, setLoading]           = useState<'analisar' | 'gerar' | null>(null);
  const [resultado, setResultado]       = useState<AnalysisResult | null>(null);
  const [erro, setErro]                 = useState('');

  // Check if server has env key + load localStorage key
  useEffect(() => {
    fetch('/api/analisador')
      .then(r => r.json())
      .then((d: { hasEnvKey: boolean }) => setHasEnvKey(d.hasEnvKey))
      .catch(() => setHasEnvKey(false));

    const stored = localStorage.getItem(LS_KEY) ?? '';
    setSavedKey(stored);
    setInputKey(stored);
  }, []);

  function saveKey() {
    const trimmed = inputKey.trim();
    localStorage.setItem(LS_KEY, trimmed);
    setSavedKey(trimmed);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  function removeKey() {
    localStorage.removeItem(LS_KEY);
    setSavedKey('');
    setInputKey('');
  }

  const apiReady = hasEnvKey || !!savedKey;

  const submit = useCallback(async (mode: 'analisar' | 'gerar') => {
    const conteudo = mode === 'analisar' ? postContent : descricao;
    if (!conteudo.trim()) {
      setErro(mode === 'analisar' ? 'Cole o post para analisar.' : 'Descreva o serviço para gerar o post.');
      return;
    }
    setErro('');
    setLoading(mode);
    setResultado(null);

    try {
      const res = await fetch('/api/analisador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, conselho, redeSocial, conteudo, apiKey: savedKey || undefined }),
      });
      const data = await res.json() as AnalysisResult;
      if (data.error) setErro(data.error);
      else setResultado(data);
    } catch {
      setErro('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(null);
    }
  }, [postContent, descricao, conselho, redeSocial, savedKey]);

  const inp  = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy bg-white transition-colors placeholder-gray-400';
  const lbl  = 'block text-[12px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide';

  // ─── Skeleton while checking ─────────────────────────────────────────────────
  if (hasEnvKey === null) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>Analisador de Posts</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Verifique ou gere posts para redes sociais em conformidade com as normas do seu conselho profissional.
        </p>
      </div>

      {/* API Key section (shown when no env key) */}
      {!hasEnvKey && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
              style={{ backgroundColor: '#FFF7ED' }}
            >
              🔑
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#1B2A4A' }}>Chave da API (Anthropic)</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Insira sua chave da Anthropic para usar o analisador.
                Ela fica salva apenas no navegador desta clínica.{' '}
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                  Obter chave →
                </a>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="password"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              placeholder="sk-ant-..."
              className={inp + ' flex-1'}
            />
            <button
              onClick={saveKey}
              disabled={!inputKey.trim()}
              className="px-5 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#1B2A4A' }}
            >
              {keySaved ? '✓ Salvo' : 'Salvar'}
            </button>
            {savedKey && (
              <button
                onClick={removeKey}
                className="px-3 py-2.5 text-sm font-semibold rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
              >
                Remover
              </button>
            )}
          </div>

          {savedKey && (
            <p className="text-xs text-green-600 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              Chave configurada — pronto para usar.
            </p>
          )}
        </div>
      )}

      {hasEnvKey && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold"
          style={{ backgroundColor: '#F0FDF4', color: '#166534' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          Chave da API configurada via variável de ambiente.
        </div>
      )}

      {/* Main form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

        {/* Conselho + rede */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Conselho</label>
            <select value={conselho} onChange={e => setConselho(e.target.value)} className={inp}>
              {CONSELHOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Rede Social</label>
            <select value={redeSocial} onChange={e => setRedeSocial(e.target.value)} className={inp}>
              {REDES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Use uma das opções abaixo</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Analisar post */}
        <div className="rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔍</span>
            <p className="text-sm font-bold" style={{ color: '#1B2A4A' }}>Analisar post existente</p>
          </div>
          <textarea
            rows={5}
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            placeholder="Cole aqui o post que deseja analisar…"
            className={inp + ' resize-none'}
            disabled={!apiReady}
          />
          <button
            onClick={() => submit('analisar')}
            disabled={!apiReady || loading !== null}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            {loading === 'analisar' ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Analisando…
              </>
            ) : '🔍 Analisar Post'}
          </button>
        </div>

        {/* Gerar post */}
        <div className="rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <p className="text-sm font-bold" style={{ color: '#1B2A4A' }}>Gerar novo post</p>
          </div>
          <textarea
            rows={4}
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o serviço, procedimento ou tema para gerar um post…&#10;Ex: Quero um post sobre harmonização facial com preenchimento labial, voltado para novos clientes."
            className={inp + ' resize-none'}
            disabled={!apiReady}
          />
          <button
            onClick={() => submit('gerar')}
            disabled={!apiReady || loading !== null}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
          >
            {loading === 'gerar' ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Gerando…
              </>
            ) : '✨ Gerar Post'}
          </button>
        </div>

        {!apiReady && (
          <p className="text-xs text-amber-600 text-center">Configure a chave da API acima para usar o analisador.</p>
        )}

        {erro && (
          <div className="rounded-xl border-l-4 px-4 py-3 text-sm text-red-700" style={{ backgroundColor: '#FEF2F2', borderLeftColor: '#DC2626' }}>
            ⚠ {erro}
          </div>
        )}
      </div>

      {/* ─── Result ──────────────────────────────────────────────────────────── */}
      {resultado && (
        <div className="space-y-4">

          {/* Section header */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, #C9A84C, transparent)' }}/>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C9A84C' }}>
              {resultado.mode === 'analisar' ? 'Resultado da Análise' : 'Post Gerado'}
            </p>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, #C9A84C, transparent)' }}/>
          </div>

          {/* Generated post */}
          {resultado.mode === 'gerar' && resultado.postGerado && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#1B2A4A' }}>
                  <span>✨</span> Post Gerado
                </p>
                <CopyButton text={resultado.postGerado} />
              </div>
              <div
                className="rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed"
                style={{ backgroundColor: '#FFFBF0', border: '1px solid #C9A84C33', color: '#1B2A4A' }}
              >
                {resultado.postGerado}
              </div>
              {resultado.observacoes && resultado.observacoes.length > 0 && (
                <div className="text-xs text-gray-500 space-y-1">
                  {resultado.observacoes.map((obs, i) => (
                    <p key={i} className="flex items-start gap-1.5">
                      <span className="mt-0.5 text-amber-400">ℹ</span> {obs}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analysis sections */}
          <ResultSection
            icon="✅" label="O que está correto"
            items={resultado.correto ?? []}
            bg="#F0FDF4" border="#16A34A" textColor="#14532D"
          />
          <ResultSection
            icon="⚠️" label="O que precisa ajustar"
            items={resultado.ajustar ?? []}
            bg="#FFFBEB" border="#D97706" textColor="#78350F"
          />
          <ResultSection
            icon="❌" label="O que está proibido pelo conselho"
            items={resultado.proibido ?? []}
            bg="#FEF2F2" border="#DC2626" textColor="#7F1D1D"
          />

          {/* Corrected version */}
          {resultado.versaoCorrigida && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-2" style={{ color: '#1B2A4A' }}>
                  <span>📝</span> Versão Corrigida — pronta para publicar
                </p>
                <CopyButton text={resultado.versaoCorrigida} />
              </div>
              <div
                className="rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1B2A4A' }}
              >
                {resultado.versaoCorrigida}
              </div>
            </div>
          )}

          {/* Info footer */}
          <p className="text-[11px] text-gray-400 text-center pb-2">
            Esta análise é gerada por IA como apoio. Consulte sempre o código de ética do seu conselho para decisões definitivas.
          </p>
        </div>
      )}

    </div>
  );
}
