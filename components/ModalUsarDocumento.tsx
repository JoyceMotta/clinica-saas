'use client';

import { useState, useMemo } from 'react';
import {
  listarModelos, preencherTemplate, imprimirDocumento,
  CATEGORIA_MODELOS_LABELS, CATEGORIA_MODELOS_CORES,
  type ModeloDocumento,
} from '@/lib/local-storage-documentos-modelos';
import type { ClienteLocal } from '@/lib/local-storage-clientes';

interface Props {
  cliente: ClienteLocal;
  procedimento?: string;
  tituloProfissional?: string;  // título + nome, ex: "Dra. Joyce Motta — Médica Esteta"
  clinicaNome?: string;
  onClose: () => void;
}

export default function ModalUsarDocumento({
  cliente, procedimento = '', tituloProfissional = '', clinicaNome = 'Clínica', onClose,
}: Props) {
  const modelos = useMemo(() => listarModelos().filter(m => m.ativo && m.tipoArquivo === 'texto'), []);
  const [selecionado, setSelecionado] = useState<ModeloDocumento | null>(null);
  const [tab, setTab] = useState<'selecionar' | 'preview'>('selecionar');

  // Build variables from patient data
  const vars = useMemo<Record<string, string>>(() => ({
    '{{nome_paciente}}':   cliente.nome,
    '{{cpf_paciente}}':    cliente.cpf,
    '{{data_nascimento}}': cliente.dataNascimento
      ? new Date(cliente.dataNascimento + 'T12:00').toLocaleDateString('pt-BR')
      : '',
    '{{telefone}}':        cliente.whatsapp,
    '{{email_paciente}}':  cliente.email,
    '{{data}}':                new Date().toLocaleDateString('pt-BR'),
    '{{procedimento}}':        procedimento,
    '{{titulo_profissional}}': tituloProfissional,
    '{{conselho}}':            '',
    '{{numero_registro}}':     '',
    '{{clinica}}':             clinicaNome,
  }), [cliente, procedimento, tituloProfissional, clinicaNome]);

  const conteudoPreenchido = selecionado
    ? preencherTemplate(selecionado.conteudo, vars)
    : '';

  function handleSelecionar(m: ModeloDocumento) {
    setSelecionado(m);
    setTab('preview');
  }

  function handleImprimir() {
    if (!selecionado) return;
    imprimirDocumento(selecionado.titulo, conteudoPreenchido);
  }

  function handleDownloadTxt() {
    if (!selecionado) return;
    const blob = new Blob([conteudoPreenchido], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selecionado.titulo} - ${cliente.nome}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
          <div>
            <h3 className="font-bold text-white text-sm">Usar Modelo de Documento</h3>
            <p className="text-[11px] text-white/60 mt-0.5">Paciente: {cliente.nome}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 px-6">
          {(['selecionar', 'preview'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              disabled={t === 'preview' && !selecionado}
              className="px-4 py-2.5 text-xs font-bold border-b-2 transition-colors mr-2 disabled:opacity-40"
              style={tab === t
                ? { borderBottomColor: '#C9A84C', color: '#1B2A4A' }
                : { borderBottomColor: 'transparent', color: '#9CA3AF' }}>
              {t === 'selecionar' ? '📋 Selecionar modelo' : '👁 Pré-visualizar'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'selecionar' && (
            <div className="p-4 space-y-2">
              {modelos.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-3xl">📋</p>
                  <p className="text-sm text-gray-500 font-semibold">Nenhum modelo de texto cadastrado</p>
                  <p className="text-xs text-gray-400">Acesse <strong>Documentos</strong> no menu lateral para criar modelos.</p>
                </div>
              ) : (
                modelos.map(m => {
                  const cores = CATEGORIA_MODELOS_CORES[m.categoria];
                  const isSelected = selecionado?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelecionar(m)}
                      className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all hover:shadow-sm flex items-start gap-3"
                      style={isSelected
                        ? { borderColor: '#1B2A4A', backgroundColor: '#F8FAFF' }
                        : { borderColor: '#F3F4F6', backgroundColor: 'white' }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: cores.bg }}
                      >
                        ✏️
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#1B2A4A' }}>{m.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: cores.bg, color: cores.text }}>
                            {CATEGORIA_MODELOS_LABELS[m.categoria]}
                          </span>
                          {m.conselho !== 'Todos' && (
                            <span className="text-[10px] text-gray-400">{m.conselho}</span>
                          )}
                          <span className="text-[10px] text-gray-400">v{m.versao}</span>
                        </div>
                      </div>
                      {isSelected && <span className="text-navy font-bold flex-shrink-0">✓</span>}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {tab === 'preview' && selecionado && (
            <div className="p-5">
              {/* Patient data summary */}
              <div
                className="flex flex-wrap gap-2 rounded-xl px-4 py-3 mb-4 text-xs"
                style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}
              >
                <span className="font-semibold text-blue-700">Dados preenchidos automaticamente:</span>
                <span className="text-blue-600">{cliente.nome}</span>
                <span className="text-blue-400">·</span>
                <span className="text-blue-600">{cliente.cpf}</span>
                {procedimento && <><span className="text-blue-400">·</span><span className="text-blue-600">{procedimento}</span></>}
              </div>

              {/* Document preview */}
              <div
                className="border border-gray-200 rounded-xl p-5 text-sm whitespace-pre-wrap leading-relaxed font-mono bg-white"
                style={{ minHeight: 300 }}
              >
                {conteudoPreenchido}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
            Fechar
          </button>
          {selecionado && tab === 'preview' && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                ⬇ .txt
              </button>
              <button
                onClick={handleImprimir}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-xl hover:opacity-90"
                style={{ backgroundColor: '#1B2A4A' }}
              >
                🖨 Imprimir / PDF
              </button>
            </div>
          )}
          {tab === 'selecionar' && selecionado && (
            <button
              onClick={() => setTab('preview')}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-xl hover:opacity-90"
              style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
            >
              Ver prévia →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
