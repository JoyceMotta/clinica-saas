'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  listarModelos, criarModelo, atualizarModelo, deletarModelo,
  imprimirDocumento, preencherTemplate,
  CATEGORIA_MODELOS_LABELS, CATEGORIA_MODELOS_CORES, CONSELHOS_OPTS, VARIAVEIS,
  type ModeloDocumento, type CategoriaModelo,
} from '@/lib/local-storage-documentos-modelos';

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORIAS: CategoriaModelo[] = ['tcle', 'anamnese', 'contrato', 'termo', 'aviso', 'outro'];

const MODELO_INICIAL: Omit<ModeloDocumento, 'id' | 'createdAt' | 'updatedAt'> = {
  titulo: '',
  categoria: 'tcle',
  conselho: 'Todos',
  versao: '1.0',
  conteudo: '',
  tipoArquivo: 'texto',
  ativo: true,
};

const EXEMPLO_VARS: Record<string, string> = {
  '{{nome_paciente}}':   'Ana Beatriz Santos',
  '{{cpf_paciente}}':    '000.000.000-00',
  '{{data_nascimento}}': '01/01/1990',
  '{{telefone}}':        '(11) 99999-0000',
  '{{email_paciente}}':  'paciente@email.com',
  '{{data}}':            new Date().toLocaleDateString('pt-BR'),
  '{{procedimento}}':    'Toxina Botulínica',
  '{{profissional}}':    'Dra. Joyce Motta',
  '{{conselho}}':        'CRM',
  '{{numero_registro}}': '123456',
  '{{clinica}}':         'Clínica Estética',
};

// ═══════════════════════════════════════════════════════════════════════════════
//  EDITOR MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function EditorModal({
  inicial, onSave, onClose,
}: {
  inicial?: ModeloDocumento;
  onSave: (data: Omit<ModeloDocumento, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [titulo, setTitulo]       = useState(inicial?.titulo ?? '');
  const [categoria, setCat]       = useState<CategoriaModelo>(inicial?.categoria ?? 'tcle');
  const [conselho, setConselho]   = useState(inicial?.conselho ?? 'Todos');
  const [versao, setVersao]       = useState(inicial?.versao ?? '1.0');
  const [conteudo, setConteudo]   = useState(inicial?.conteudo ?? '');
  const [arquivo, setArquivo]     = useState<{ nome: string; base64: string; tipo: 'pdf' | 'docx' } | null>(
    inicial?.arquivoBase64 ? { nome: inicial.arquivoNome!, base64: inicial.arquivoBase64, tipo: inicial.tipoArquivo as 'pdf' | 'docx' } : null,
  );
  const [tab, setTab]             = useState<'texto' | 'arquivo'>((inicial?.tipoArquivo ?? 'texto') === 'texto' ? 'texto' : 'arquivo');
  const [preview, setPreview]     = useState(false);
  const [erro, setErro]           = useState('');
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  // Insert variable at cursor
  function inserirVariavel(v: string) {
    const el = textareaRef.current;
    if (!el) { setConteudo(c => c + v); return; }
    const start = el.selectionStart ?? conteudo.length;
    const end   = el.selectionEnd   ?? conteudo.length;
    const novo  = conteudo.slice(0, start) + v + conteudo.slice(end);
    setConteudo(novo);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    }, 0);
  }

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const tipo = file.name.endsWith('.docx') ? 'docx' : 'pdf';
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setArquivo({ nome: file.name, base64, tipo });
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) { setErro('Título é obrigatório.'); return; }
    if (tab === 'texto' && !conteudo.trim()) { setErro('Conteúdo é obrigatório.'); return; }
    if (tab === 'arquivo' && !arquivo) { setErro('Selecione um arquivo.'); return; }

    onSave({
      titulo: titulo.trim(),
      categoria,
      conselho,
      versao: versao.trim() || '1.0',
      conteudo: tab === 'texto' ? conteudo : '',
      tipoArquivo: tab === 'texto' ? 'texto' : arquivo!.tipo,
      arquivoBase64: tab === 'arquivo' ? arquivo!.base64 : undefined,
      arquivoNome:   tab === 'arquivo' ? arquivo!.nome   : undefined,
      ativo: true,
    });
    onClose();
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white';
  const lbl = 'block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '95vh' }}
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#1B2A4A' }}>
          <h3 className="font-bold text-white text-sm">
            {inicial ? 'Editar Modelo' : 'Novo Modelo de Documento'}
          </h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Meta fields */}
          <div className="px-6 pt-5 pb-4 space-y-4 border-b border-gray-100 flex-shrink-0">
            {erro && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">⚠ {erro}</p>}

            <div>
              <label className={lbl}>Título *</label>
              <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: TCLE — Toxina Botulínica" className={inp} autoFocus />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Categoria</label>
                <select value={categoria} onChange={e => setCat(e.target.value as CategoriaModelo)} className={inp}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_MODELOS_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Conselho</label>
                <select value={conselho} onChange={e => setConselho(e.target.value)} className={inp}>
                  {CONSELHOS_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Versão</label>
                <input type="text" value={versao} onChange={e => setVersao(e.target.value)} placeholder="1.0" className={inp} />
              </div>
            </div>
          </div>

          {/* Tab: texto | arquivo */}
          <div className="flex border-b border-gray-100 flex-shrink-0 px-6">
            {(['texto', 'arquivo'] as const).map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className="px-4 py-2.5 text-xs font-bold border-b-2 transition-colors capitalize mr-2"
                style={tab === t
                  ? { borderBottomColor: '#C9A84C', color: '#1B2A4A' }
                  : { borderBottomColor: 'transparent', color: '#9CA3AF' }}>
                {t === 'texto' ? '✏️ Editor de texto' : '📎 Upload de arquivo'}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {tab === 'texto' && (
              <>
                {/* Variable toolbar (left) */}
                <div className="w-52 flex-shrink-0 border-r border-gray-100 overflow-y-auto p-3 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Inserir variável</p>
                  {VARIAVEIS.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => inserirVariavel(v.key)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors group"
                    >
                      <span className="font-mono text-blue-600 text-[10px]">{v.key}</span>
                      <span className="block text-[10px] text-gray-400 group-hover:text-gray-600 truncate">{v.label}</span>
                    </button>
                  ))}
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col min-w-0 p-4 gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-400">
                      Use as variáveis da esquerda para personalização automática
                    </p>
                    <button
                      type="button"
                      onClick={() => setPreview(!preview)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={preview
                        ? { backgroundColor: '#1B2A4A', color: 'white' }
                        : { backgroundColor: '#F3F4F6', color: '#374151' }}
                    >
                      {preview ? '✏️ Editar' : '👁 Pré-visualizar'}
                    </button>
                  </div>

                  {preview ? (
                    <div className="flex-1 overflow-auto border border-gray-200 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 font-mono text-gray-800">
                      {preencherTemplate(conteudo, EXEMPLO_VARS) || <span className="text-gray-400 italic">Conteúdo vazio…</span>}
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      value={conteudo}
                      onChange={e => setConteudo(e.target.value)}
                      placeholder={`TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO\n\nEu, {{nome_paciente}}, CPF {{cpf_paciente}}, declaro que fui devidamente informado(a) sobre o procedimento {{procedimento}} a ser realizado por {{profissional}} ({{conselho}} {{numero_registro}})…\n\n{{clinica}}, {{data}}`}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none font-mono leading-relaxed bg-white"
                    />
                  )}
                </div>
              </>
            )}

            {tab === 'arquivo' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                <div
                  className="w-full max-w-md border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-navy transition-colors"
                  style={{ borderColor: '#D1D5DB' }}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <p className="text-4xl mb-3">📁</p>
                  <p className="text-sm font-semibold text-gray-600">
                    Clique para selecionar ou arraste aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Aceita .pdf ou .docx</p>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleArquivo}
                    className="hidden"
                  />
                </div>

                {arquivo && (
                  <div
                    className="flex items-center gap-3 w-full max-w-md px-4 py-3 rounded-xl border"
                    style={{ backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}
                  >
                    <span className="text-xl">{arquivo.tipo === 'pdf' ? '📄' : '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800 truncate">{arquivo.nome}</p>
                      <p className="text-xs text-green-600">Arquivo carregado com sucesso</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setArquivo(null)}
                      className="text-red-400 hover:text-red-600 font-bold"
                    >×</button>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center max-w-sm">
                  O arquivo será armazenado localmente. Para preenchimento automático de variáveis, use o <strong>Editor de texto</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" className="px-6 py-2 text-sm font-bold text-white rounded-xl hover:opacity-90" style={{ backgroundColor: '#1B2A4A' }}>
            {inicial ? 'Salvar alterações' : 'Criar modelo'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function DocumentosModelos() {
  const [modelos, setModelos]         = useState<ModeloDocumento[]>([]);
  const [modal, setModal]             = useState<{ tipo: 'criar' | 'editar'; item?: ModeloDocumento } | null>(null);
  const [filtroCat, setFiltroCat]     = useState<'' | CategoriaModelo>('');
  const [filtroConselho, setFiltroC]  = useState('');
  const [busca, setBusca]             = useState('');

  function refresh() { setModelos(listarModelos()); }
  useEffect(() => { refresh(); }, []);

  function handleSave(data: Omit<ModeloDocumento, 'id' | 'createdAt' | 'updatedAt'>) {
    if (modal?.item) atualizarModelo(modal.item.id, data);
    else              criarModelo(data);
    refresh();
  }

  function handleDelete(id: string, titulo: string) {
    if (!confirm(`Excluir o modelo "${titulo}"?`)) return;
    deletarModelo(id);
    refresh();
  }

  function handleToggle(id: string, ativo: boolean) {
    atualizarModelo(id, { ativo: !ativo });
    refresh();
  }

  function handlePreview(modelo: ModeloDocumento) {
    if (modelo.tipoArquivo !== 'texto') {
      // Download original file
      const a = document.createElement('a');
      a.href = `data:application/${modelo.tipoArquivo};base64,${modelo.arquivoBase64}`;
      a.download = modelo.arquivoNome ?? `${modelo.titulo}.${modelo.tipoArquivo}`;
      a.click();
      return;
    }
    const filled = preencherTemplate(modelo.conteudo, EXEMPLO_VARS);
    imprimirDocumento(modelo.titulo, filled);
  }

  const filtrados = modelos.filter(m => {
    if (filtroCat    && m.categoria !== filtroCat) return false;
    if (filtroConselho && m.conselho !== filtroConselho && filtroConselho !== 'Todos') return false;
    if (busca && !m.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1B2A4A' }}>Modelos de Documentos</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gerencie TCLEs, anamneses, contratos e termos. Use variáveis para preenchimento automático.
          </p>
        </div>
        <button
          onClick={() => setModal({ tipo: 'criar' })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
        >
          + Novo Modelo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar modelo…"
          className="border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white w-48"
        />
        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value as typeof filtroCat)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none">
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{CATEGORIA_MODELOS_LABELS[c]}</option>)}
        </select>
        <select value={filtroConselho} onChange={e => setFiltroC(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none">
          <option value="">Todos os conselhos</option>
          {CONSELHOS_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400 self-center">
          {filtrados.length} modelo{filtrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de modelos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-4xl">📋</p>
            <p className="text-sm font-semibold text-gray-500">
              {modelos.length === 0 ? 'Nenhum modelo cadastrado' : 'Nenhum resultado para os filtros'}
            </p>
            {modelos.length === 0 && (
              <button
                onClick={() => setModal({ tipo: 'criar' })}
                className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ backgroundColor: '#1B2A4A' }}
              >
                Criar primeiro modelo
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtrados.map(m => {
              const cores = CATEGORIA_MODELOS_CORES[m.categoria];
              const tipoIcon = m.tipoArquivo === 'pdf' ? '📄' : m.tipoArquivo === 'docx' ? '📝' : '✏️';
              return (
                <div key={m.id} className="px-5 py-4 flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: cores.bg }}
                  >
                    {tipoIcon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold truncate" style={{ color: m.ativo ? '#1B2A4A' : '#9CA3AF' }}>
                        {m.titulo}
                      </p>
                      {!m.ativo && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Inativo</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: cores.bg, color: cores.text }}>
                        {CATEGORIA_MODELOS_LABELS[m.categoria]}
                      </span>
                      {m.conselho !== 'Todos' && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {m.conselho}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">v{m.versao}</span>
                      <span className="text-[10px] text-gray-400">·</span>
                      <span className="text-[10px] text-gray-400">
                        Atualizado em {new Date(m.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => handlePreview(m)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      {m.tipoArquivo === 'texto' ? '🖨 Imprimir' : '⬇ Baixar'}
                    </button>
                    <button
                      onClick={() => setModal({ tipo: 'editar', item: m })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(m.id, m.ativo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={m.ativo
                        ? { borderColor: '#E5E7EB', color: '#6B7280' }
                        : { borderColor: '#10B981', color: '#10B981' }}
                    >
                      {m.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.titulo)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Variables reference */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Variáveis disponíveis nos modelos
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VARIAVEIS.map(v => (
            <div key={v.key} className="flex items-center gap-2">
              <code className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">{v.key}</code>
              <span className="text-[11px] text-gray-500 truncate">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor modal */}
      {modal && (
        <EditorModal
          inicial={modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
