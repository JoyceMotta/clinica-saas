'use client';

import { useEffect, useRef, useState } from 'react';
import { listarAgendamentosCliente } from '@/lib/local-storage-agendamentos';
import { registrarAuditoria } from '@/lib/local-storage-auditoria';
import {
  salvarMidia,
  listarMidiaCliente,
  getBlobMidia,
  deletarMidia,
  atualizarMidiaMetadata,
  gerarId,
  formatarTamanho,
  isImagem,
  isVideo,
  isPDF,
  TIPO_LABELS,
  ROLE_LABELS,
  MAX_SIZE_BYTES,
  type MidiaMetadata,
  type TipoMidia,
  type RolePerfil,
} from '@/lib/indexed-db-midia';

// ─── Helper: tipo padrão baseado no MIME ─────────────────────────────────────

function tipoDefaultParaMime(mimeType: string): TipoMidia {
  if (mimeType.startsWith('video/'))  return 'video';
  if (mimeType === 'application/pdf') return 'documento';
  return 'foto_antes';
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface PendingMeta {
  tipo: TipoMidia;
  dataRegistro: string;
  procedimento: string;
  observacao: string;
}

// ─── Ícones SVG inline ────────────────────────────────────────────────────────

function IconPencil({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ─── ResumoStats ─────────────────────────────────────────────────────────────

function ResumoStats({ midias }: { midias: MidiaMetadata[] }) {
  if (midias.length === 0) return null;

  const totalSize = midias.reduce((acc, m) => acc + m.tamanho, 0);
  const counts: Partial<Record<TipoMidia, number>> = {};
  for (const m of midias) counts[m.tipo] = (counts[m.tipo] ?? 0) + 1;

  const totalFotos =
    (counts.foto_antes ?? 0) + (counts.foto_depois ?? 0) + (counts.foto_durante ?? 0);
  const totalOutros =
    (counts.video ?? 0) + (counts.exame ?? 0) + (counts.documento ?? 0) + (counts.outro ?? 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total de arquivos',  value: String(midias.length),       bg: '#EFF6FF', color: '#1B2A4A' },
        { label: 'Armazenamento',      value: formatarTamanho(totalSize),  bg: '#FFFBF0', color: '#92400E' },
        { label: 'Fotos',             value: String(totalFotos),           bg: '#F0FDF4', color: '#166534' },
        { label: 'Vídeos & Docs',     value: String(totalOutros),          bg: '#FAF5FF', color: '#6B21A8' },
      ].map(({ label, value, bg, color }) => (
        <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
          <p className="text-xl font-bold leading-tight" style={{ color }}>{value}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MidiaThumb ───────────────────────────────────────────────────────────────

function MidiaThumb({
  midia,
  onClick,
  onDelete,
  onEdit,
}: {
  midia: MidiaMetadata;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoke: (() => void) | null = null;
    getBlobMidia(midia.id)
      .then((blob) => {
        if (!blob) return;
        const u = URL.createObjectURL(blob);
        setUrl(u);
        revoke = () => URL.revokeObjectURL(u);
      })
      .catch(() => {});
    return () => revoke?.();
  }, [midia.id]);

  const eImg = isImagem(midia.mimeType);
  const eVid = isVideo(midia.mimeType);
  const ePDF = isPDF(midia.mimeType);

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square cursor-pointer border border-gray-200 hover:shadow-md transition-all"
      onClick={onClick}
    >
      {/* Thumbnail */}
      {eImg && url ? (
        <img src={url} alt={midia.nomeOriginal} className="w-full h-full object-cover" />
      ) : eVid ? (
        <div className="w-full h-full relative bg-gray-900 flex items-center justify-center">
          {url && <video src={url} className="w-full h-full object-cover opacity-60" muted />}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow">
              <span className="text-lg ml-0.5">▶</span>
            </div>
          </div>
        </div>
      ) : ePDF ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 gap-1 px-2">
          <span className="text-3xl">📄</span>
          <p className="text-[9px] text-gray-500 text-center truncate w-full">{midia.nomeOriginal}</p>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <span className="text-3xl">📎</span>
        </div>
      )}

      {/* Gradiente info no hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-bold text-white leading-tight truncate">
          {TIPO_LABELS[midia.tipo]}
        </p>
        <p className="text-[9px] text-white/70">{midia.dataRegistro}</p>
      </div>

      {/* Badge tipo (sempre visível) */}
      <div className="absolute top-1.5 left-1.5 pointer-events-none">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
        >
          {TIPO_LABELS[midia.tipo]}
        </span>
      </div>

      {/* Botões ação (hover) */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
          style={{ backgroundColor: '#1B2A4A', color: 'white' }}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          title="Editar metadados"
        >
          <IconPencil className="w-3 h-3" />
        </button>
        <button
          className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
          style={{ backgroundColor: '#DC2626', color: 'white' }}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Remover arquivo"
        >
          <IconTrash className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── MidiaListaItem ───────────────────────────────────────────────────────────

function MidiaListaItem({
  midia,
  onClick,
  onDelete,
  onEdit,
}: {
  midia: MidiaMetadata;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImagem(midia.mimeType)) return;
    let revoke: (() => void) | null = null;
    getBlobMidia(midia.id)
      .then((blob) => {
        if (!blob) return;
        const u = URL.createObjectURL(blob);
        setUrl(u);
        revoke = () => URL.revokeObjectURL(u);
      })
      .catch(() => {});
    return () => revoke?.();
  }, [midia.id]);

  const eImg = isImagem(midia.mimeType);
  const eVid = isVideo(midia.mimeType);
  const ePDF = isPDF(midia.mimeType);

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer border-b border-gray-50 last:border-0"
      onClick={onClick}
    >
      {/* Mini thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
        {eImg && url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : eVid ? (
          <span className="text-xl">🎥</span>
        ) : ePDF ? (
          <span className="text-xl">📄</span>
        ) : (
          <span className="text-xl">📎</span>
        )}
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#1B2A4A' }}>
          {midia.nomeOriginal}
        </p>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(27,42,74,0.08)', color: '#1B2A4A' }}
          >
            {TIPO_LABELS[midia.tipo]}
          </span>
          {midia.procedimento && (
            <span className="text-xs text-gray-400">📋 {midia.procedimento}</span>
          )}
          <span className="text-xs text-gray-400">📅 {midia.dataRegistro}</span>
          <span className="text-xs text-gray-400">{formatarTamanho(midia.tamanho)}</span>
        </div>
        {midia.observacao && (
          <p className="text-[10px] text-gray-400 italic mt-0.5 truncate">"{midia.observacao}"</p>
        )}
      </div>

      {/* Ações */}
      <div
        className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          onClick={onEdit}
          title="Editar metadados"
        >
          <IconPencil className="w-4 h-4" />
        </button>
        <button
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400"
          onClick={onDelete}
          title="Remover arquivo"
        >
          <IconTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  midia,
  total,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  midia: MidiaMetadata;
  total: number;
  currentIndex: number;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    let revoke: (() => void) | null = null;
    getBlobMidia(midia.id)
      .then((blob) => {
        if (!blob) return;
        const u = URL.createObjectURL(blob);
        setUrl(u);
        revoke = () => URL.revokeObjectURL(u);
      })
      .catch(() => {});
    return () => revoke?.();
  }, [midia.id]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   onPrev?.();
      if (e.key === 'ArrowRight')  onNext?.();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, onPrev, onNext]);

  function handleDownload() {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = midia.nomeOriginal;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const eImg = isImagem(midia.mimeType);
  const eVid = isVideo(midia.mimeType);
  const ePDF = isPDF(midia.mimeType);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/92 p-4"
      onClick={onClose}
    >
      {/* Fechar */}
      <button
        className="absolute top-4 right-5 text-white/70 hover:text-white text-3xl font-thin leading-none z-10"
        onClick={onClose}
        title="Fechar (Esc)"
      >
        ×
      </button>

      {/* Contador */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="text-xs text-white/50 bg-black/30 px-3 py-1 rounded-full">
            {currentIndex + 1} / {total}
          </span>
        </div>
      )}

      {/* Nav anterior */}
      {onPrev && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-2xl font-light transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          title="Anterior (←)"
        >
          ‹
        </button>
      )}

      {/* Nav próximo */}
      {onNext && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white text-2xl font-light transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          title="Próximo (→)"
        >
          ›
        </button>
      )}

      {/* Conteúdo principal */}
      <div
        className="relative flex flex-col items-center gap-4 max-w-5xl w-full max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading */}
        {!url && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* Imagem */}
        {eImg && url && (
          <img
            src={url}
            alt={midia.nomeOriginal}
            className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        )}

        {/* Vídeo */}
        {eVid && url && (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-[75vh] max-w-full rounded-xl shadow-2xl"
          />
        )}

        {/* PDF */}
        {ePDF && url && (
          <iframe
            src={url}
            title={midia.nomeOriginal}
            className="w-full rounded-xl bg-white shadow-2xl"
            style={{ height: '75vh' }}
          />
        )}

        {/* Arquivo genérico */}
        {!eImg && !eVid && !ePDF && url && (
          <div className="flex flex-col items-center gap-4 p-12 text-center">
            <span className="text-7xl">📎</span>
            <p className="text-white font-semibold text-lg">{midia.nomeOriginal}</p>
            <p className="text-white/50 text-sm">{formatarTamanho(midia.tamanho)}</p>
          </div>
        )}

        {/* Barra de metadados + botão download */}
        {url && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
            <span className="font-medium text-white/80 max-w-[200px] truncate">{midia.nomeOriginal}</span>
            <span>·</span>
            <span>{formatarTamanho(midia.tamanho)}</span>
            <span>·</span>
            <span className="text-white/70">{TIPO_LABELS[midia.tipo]}</span>
            {midia.procedimento && (
              <><span>·</span><span>📋 {midia.procedimento}</span></>
            )}
            <span>·</span>
            <span>📅 {midia.dataRegistro}</span>
            <span>·</span>
            <span>👤 {midia.uploadadoPor}</span>
            <span>·</span>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Baixar arquivo"
            >
              <IconDownload className="w-3 h-3" />
              Baixar
            </button>
          </div>
        )}
        {midia.observacao && url && (
          <p className="text-xs text-white/40 italic max-w-lg text-center">
            "{midia.observacao}"
          </p>
        )}
      </div>
    </div>
  );
}

// ─── EditMetadataModal ────────────────────────────────────────────────────────

function EditMetadataModal({
  midia,
  procedimentos,
  onClose,
  onSave,
}: {
  midia: MidiaMetadata;
  procedimentos: string[];
  onClose: () => void;
  onSave: (
    patch: Partial<Pick<MidiaMetadata, 'tipo' | 'dataRegistro' | 'procedimento' | 'observacao'>>,
  ) => Promise<void>;
}) {
  const [tipo, setTipo]               = useState<TipoMidia>(midia.tipo);
  const [dataRegistro, setDataRegistro] = useState(midia.dataRegistro);
  const [procedimento, setProcedimento] = useState(midia.procedimento ?? '');
  const [observacao, setObservacao]   = useState(midia.observacao ?? '');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        tipo,
        dataRegistro,
        procedimento: procedimento || undefined,
        observacao:   observacao   || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1B2A4A' }}>
          <div className="flex items-center gap-2.5">
            <IconPencil className="w-4 h-4 text-white" />
            <h3 className="font-bold text-white text-sm">Editar Metadados</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl font-thin leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info do arquivo */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-2xl flex-shrink-0">
              {isImagem(midia.mimeType) ? '🖼️' : isVideo(midia.mimeType) ? '🎥' : isPDF(midia.mimeType) ? '📄' : '📎'}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#1B2A4A' }}>
                {midia.nomeOriginal}
              </p>
              <p className="text-[10px] text-gray-400">
                {formatarTamanho(midia.tamanho)} · {midia.mimeType}
              </p>
            </div>
          </div>

          {/* Tipo + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                Tipo *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoMidia)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                {(Object.keys(TIPO_LABELS) as TipoMidia[]).map((t) => (
                  <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                Data do registro
              </label>
              <input
                type="date"
                value={dataRegistro}
                onChange={(e) => setDataRegistro(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          {/* Procedimento */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
              Procedimento vinculado
            </label>
            {procedimentos.length > 0 ? (
              <select
                value={procedimento}
                onChange={(e) => setProcedimento(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              >
                <option value="">— sem vínculo —</option>
                {procedimentos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={procedimento}
                onChange={(e) => setProcedimento(e.target.value)}
                placeholder="Ex: Botox, Preenchimento labial…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            )}
          </div>

          {/* Observação */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="Observações adicionais sobre este arquivo…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            {saving ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Salvando…
              </>
            ) : (
              '✅ Salvar alterações'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Comparador Antes/Depois ──────────────────────────────────────────────────

function ComparadorModal({
  midias,
  onClose,
}: {
  midias: MidiaMetadata[];
  onClose: () => void;
}) {
  const antesItems  = midias.filter((m) => m.tipo === 'foto_antes');
  const depoisItems = midias.filter((m) => m.tipo === 'foto_depois');

  const procedimentos = [
    ...new Set([
      ...antesItems.map((m) => m.procedimento ?? ''),
      ...depoisItems.map((m) => m.procedimento ?? ''),
    ].filter(Boolean)),
  ];
  if (!procedimentos.length) procedimentos.push('');

  const [proc, setProc]         = useState(procedimentos[0]);
  const [antesId, setAntesId]   = useState<string>('');
  const [depoisId, setDepoisId] = useState<string>('');
  const [antesUrl, setAntesUrl] = useState<string | null>(null);
  const [depoisUrl, setDepoisUrl] = useState<string | null>(null);

  useEffect(() => {
    const a = antesItems.find((m) => (m.procedimento ?? '') === proc);
    const d = depoisItems.find((m) => (m.procedimento ?? '') === proc);
    setAntesId(a?.id ?? '');
    setDepoisId(d?.id ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proc]);

  useEffect(() => {
    let rev: (() => void) | null = null;
    if (!antesId) { setAntesUrl(null); return; }
    getBlobMidia(antesId).then((b) => {
      if (!b) return;
      const u = URL.createObjectURL(b);
      setAntesUrl(u);
      rev = () => URL.revokeObjectURL(u);
    }).catch(() => {});
    return () => rev?.();
  }, [antesId]);

  useEffect(() => {
    let rev: (() => void) | null = null;
    if (!depoisId) { setDepoisUrl(null); return; }
    getBlobMidia(depoisId).then((b) => {
      if (!b) return;
      const u = URL.createObjectURL(b);
      setDepoisUrl(u);
      rev = () => URL.revokeObjectURL(u);
    }).catch(() => {});
    return () => rev?.();
  }, [depoisId]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const semPar = antesItems.length === 0 && depoisItems.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1B2A4A' }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">↔</span>
            <h3 className="font-bold text-white text-sm">Comparação Antes / Depois</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin leading-none">×</button>
        </div>

        {semPar ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-3">🖼️</p>
            <p className="text-sm font-semibold text-gray-500">
              Nenhum par Antes/Depois encontrado
            </p>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
              Faça upload de fotos com tipo "Foto Antes" e "Foto Depois" para usar esta comparação.
            </p>
          </div>
        ) : (
          <>
            {/* Controles */}
            <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-4 items-center">
              {procedimentos.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-500">Procedimento:</label>
                  <select
                    value={proc}
                    onChange={(e) => setProc(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                  >
                    {procedimentos.map((p) => (
                      <option key={p} value={p}>{p || '— sem vínculo —'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500">Antes:</label>
                <select
                  value={antesId}
                  onChange={(e) => setAntesId(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                >
                  <option value="">— sem foto —</option>
                  {antesItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.dataRegistro}{m.procedimento ? ` · ${m.procedimento}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500">Depois:</label>
                <select
                  value={depoisId}
                  onChange={(e) => setDepoisId(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                >
                  <option value="">— sem foto —</option>
                  {depoisItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.dataRegistro}{m.procedimento ? ` · ${m.procedimento}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lado a lado */}
            <div className="grid grid-cols-2 gap-1 p-3 bg-gray-900">
              {(['Antes', 'Depois'] as const).map((lado, i) => {
                const imgUrl = i === 0 ? antesUrl : depoisUrl;
                return (
                  <div key={lado} className="flex flex-col items-center gap-2">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{ backgroundColor: i === 0 ? '#1B2A4A' : '#C9A84C', color: i === 0 ? 'white' : '#1B2A4A' }}
                    >
                      {lado}
                    </span>
                    <div className="w-full bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={lado} className="w-full h-full object-contain" />
                      ) : (
                        <p className="text-white/30 text-sm">Sem foto selecionada</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── UploadZone ───────────────────────────────────────────────────────────────

function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function validate(raw: FileList | File[]): File[] {
    const erros: string[] = [];
    const valid: File[] = [];
    for (const f of Array.from(raw)) {
      if (f.size > MAX_SIZE_BYTES) {
        erros.push(`"${f.name}" excede 50 MB`);
        continue;
      }
      const ok =
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        f.type === 'application/pdf';
      if (!ok) {
        erros.push(`"${f.name}" — tipo não suportado`);
        continue;
      }
      valid.push(f);
    }
    setErro(erros.length ? erros.join(' • ') : null);
    return valid;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const v = validate(e.dataTransfer.files);
    if (v.length) onFiles(v);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const v = validate(e.target.files);
    if (v.length) onFiles(v);
    e.target.value = '';
  }

  return (
    <div className="space-y-2">
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
        style={{
          borderColor: dragging ? '#1B2A4A' : '#D1D5DB',
          backgroundColor: dragging ? 'rgba(27,42,74,0.04)' : 'transparent',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onMouseEnter={(e) => { if (!dragging) (e.currentTarget as HTMLDivElement).style.borderColor = '#1B2A4A'; }}
        onMouseLeave={(e) => { if (!dragging) (e.currentTarget as HTMLDivElement).style.borderColor = '#D1D5DB'; }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">{dragging ? '📂' : '📁'}</span>
          <p className="font-semibold text-sm" style={{ color: '#1B2A4A' }}>
            Arraste arquivos aqui ou{' '}
            <span style={{ color: '#C9A84C' }}>clique para selecionar</span>
          </p>
          <p className="text-xs text-gray-400">
            JPG · PNG · HEIC · PDF · MP4 · MOV — máx.{' '}
            <strong>50 MB</strong> por arquivo · múltiplos arquivos simultâneos
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,video/mp4,video/quicktime,.heic,.mov"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {erro && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          ⚠️ {erro}
        </p>
      )}
    </div>
  );
}

// ─── CategorizacaoPanel ───────────────────────────────────────────────────────

function CategorizacaoPanel({
  files,
  metas,
  procedimentos,
  onChange,
  onRemove,
  onSave,
  saving,
}: {
  files: File[];
  metas: PendingMeta[];
  procedimentos: string[];
  onChange: (i: number, patch: Partial<PendingMeta>) => void;
  onRemove: (i: number) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div
      className="rounded-xl border-2 overflow-hidden"
      style={{ borderColor: '#C9A84C' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ backgroundColor: '#FFFBF0', borderBottom: '1px solid rgba(201,168,76,0.25)' }}
      >
        <div className="flex items-center gap-2">
          <span>📎</span>
          <span className="font-bold text-sm" style={{ color: '#1B2A4A' }}>
            {files.length} arquivo{files.length !== 1 ? 's' : ''} aguardando categorização
          </span>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          {saving ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Salvando…
            </>
          ) : (
            <>✅ Salvar todos</>
          )}
        </button>
      </div>

      {/* Linhas */}
      <div className="bg-white divide-y divide-gray-50">
        {files.map((file, i) => (
          <div key={i} className="px-5 py-4 flex flex-col sm:flex-row gap-4 items-start">
            {/* Ícone + nome */}
            <div className="flex items-center gap-3 w-full sm:w-52 flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                {file.type.startsWith('image/') ? '🖼️' : file.type.startsWith('video/') ? '🎥' : '📄'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#1B2A4A' }}>{file.name}</p>
                <p className="text-[10px] text-gray-400">{formatarTamanho(file.size)}</p>
              </div>
            </div>

            {/* Campos */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Tipo */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                  Tipo *
                </label>
                <select
                  value={metas[i]?.tipo ?? tipoDefaultParaMime(file.type)}
                  onChange={(e) => onChange(i, { tipo: e.target.value as TipoMidia })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1"
                >
                  {(Object.keys(TIPO_LABELS) as TipoMidia[]).map((t) => (
                    <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                  Data
                </label>
                <input
                  type="date"
                  value={metas[i]?.dataRegistro ?? ''}
                  onChange={(e) => onChange(i, { dataRegistro: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1"
                />
              </div>

              {/* Procedimento */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                  Procedimento
                </label>
                {procedimentos.length > 0 ? (
                  <select
                    value={metas[i]?.procedimento ?? ''}
                    onChange={(e) => onChange(i, { procedimento: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none"
                  >
                    <option value="">— sem vínculo —</option>
                    {procedimentos.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={metas[i]?.procedimento ?? ''}
                    onChange={(e) => onChange(i, { procedimento: e.target.value })}
                    placeholder="Opcional"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  />
                )}
              </div>

              {/* Observação */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wide">
                  Observação
                </label>
                <input
                  type="text"
                  value={metas[i]?.observacao ?? ''}
                  onChange={(e) => onChange(i, { observacao: e.target.value })}
                  placeholder="Opcional"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Remover */}
            <button
              onClick={() => onRemove(i)}
              className="flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors self-start sm:self-center mt-1 sm:mt-0"
              title="Remover da fila"
            >
              <IconTrash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TabProntuario principal ──────────────────────────────────────────────────

export default function TabProntuario({ clienteId }: { clienteId: string }) {
  const [role, setRole]                   = useState<RolePerfil>('profissional');
  const [midias, setMidias]               = useState<MidiaMetadata[]>([]);
  const [loadingMidia, setLoadingMidia]   = useState(true);
  const [pendingFiles, setPendingFiles]   = useState<File[]>([]);
  const [pendingMetas, setPendingMetas]   = useState<PendingMeta[]>([]);
  const [saving, setSaving]               = useState(false);
  const [filtroTipo, setFiltroTipo]       = useState<TipoMidia | 'todos'>('todos');
  const [filtroProc, setFiltroProc]       = useState('');
  const [lightboxId, setLightboxId]       = useState<string | null>(null);
  const [comparando, setComparando]       = useState(false);
  const [histProcs, setHistProcs]         = useState<string[]>([]);
  const [viewMode, setViewMode]           = useState<'grid' | 'list'>('grid');
  const [editandoId, setEditandoId]       = useState<string | null>(null);

  // ── Carregar mídias + registrar VISUALIZOU prontuário ─────────────────────────
  const auditProntuarioRef = useRef(false);

  useEffect(() => {
    if (role === 'recepcao') { setLoadingMidia(false); return; }
    setLoadingMidia(true);
    listarMidiaCliente(clienteId)
      .then(setMidias)
      .catch(() => setMidias([]))
      .finally(() => setLoadingMidia(false));

    const ags = listarAgendamentosCliente(clienteId);
    setHistProcs([...new Set(ags.map((a) => a.procedimento).filter(Boolean))]);

    // ── Auditoria: VISUALIZOU prontuário (uma vez por montagem) ──
    if (!auditProntuarioRef.current) {
      auditProntuarioRef.current = true;
      registrarAuditoria({
        acao:      'VISUALIZOU',
        entidade:  'prontuario',
        entidadeId: clienteId,
        clienteId,
        descricao: `Acessou o prontuário clínico (perfil: ${role})`,
      });
    }
  }, [clienteId, role]);

  function refresh() {
    listarMidiaCliente(clienteId)
      .then(setMidias)
      .catch(() => {});
  }

  // ── Upload ───────────────────────────────────────────────────────────────────
  function handleFiles(files: File[]) {
    const hoje = new Date().toISOString().slice(0, 10);
    setPendingFiles((p) => [...p, ...files]);
    setPendingMetas((p) => [
      ...p,
      ...files.map((f): PendingMeta => ({
        tipo:         tipoDefaultParaMime(f.type),
        dataRegistro: hoje,
        procedimento: '',
        observacao:   '',
      })),
    ]);
  }

  function handleMetaChange(i: number, patch: Partial<PendingMeta>) {
    setPendingMetas((p) => p.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  function handleRemovePending(i: number) {
    setPendingFiles((p) => p.filter((_, idx) => idx !== i));
    setPendingMetas((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      const agora = new Date().toISOString();
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const meta = pendingMetas[i];
        const midiaId = gerarId();
        await salvarMidia({
          id:           midiaId,
          clienteId,
          tipo:         meta.tipo,
          dataRegistro: meta.dataRegistro || agora.slice(0, 10),
          procedimento: meta.procedimento || undefined,
          observacao:   meta.observacao   || undefined,
          nomeOriginal: file.name,
          tamanho:      file.size,
          mimeType:     file.type || 'application/octet-stream',
          uploadadoPor: role === 'admin' ? 'Admin' : 'Profissional',
          uploadadoEm:  agora,
          blob:         file,
        });

        // ── Auditoria ──
        registrarAuditoria({
          acao:      'UPLOAD',
          entidade:  'prontuario',
          entidadeId: midiaId,
          clienteId,
          descricao: `Fez upload de "${file.name}" (${TIPO_LABELS[meta.tipo]}, ${formatarTamanho(file.size)})${meta.procedimento ? ` — procedimento: ${meta.procedimento}` : ''}`,
        });
      }
      setPendingFiles([]);
      setPendingMetas([]);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Remover este arquivo permanentemente? Esta ação não pode ser desfeita.')) return;
    if (lightboxId === id) setLightboxId(null);

    // Captura metadados antes de deletar para o log
    const midia = midias.find((m) => m.id === id);
    await deletarMidia(id);

    // ── Auditoria ──
    if (midia) {
      registrarAuditoria({
        acao:      'EXCLUIU',
        entidade:  'prontuario',
        entidadeId: id,
        clienteId,
        descricao: `Removeu o arquivo "${midia.nomeOriginal}" (${TIPO_LABELS[midia.tipo]}, ${formatarTamanho(midia.tamanho)})`,
        valorAnterior: midia.nomeOriginal,
      });
    }

    refresh();
  }

  // ── Editar metadados ─────────────────────────────────────────────────────────
  async function handleEditSave(
    id: string,
    patch: Partial<Pick<MidiaMetadata, 'tipo' | 'dataRegistro' | 'procedimento' | 'observacao'>>,
  ) {
    await atualizarMidiaMetadata(id, patch);
    refresh();
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const procedimentosMidia = [
    ...new Set(midias.map((m) => m.procedimento).filter((p): p is string => Boolean(p))),
  ];
  const todosProcs = [...new Set([...histProcs, ...procedimentosMidia])];

  const midiasFiltradas = midias
    .filter((m) => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
      if (filtroProc && (m.procedimento ?? '') !== filtroProc) return false;
      return true;
    })
    .sort((a, b) => b.dataRegistro.localeCompare(a.dataRegistro));

  // Lightbox com navegação
  const lightboxIndex = lightboxId
    ? midiasFiltradas.findIndex((m) => m.id === lightboxId)
    : -1;
  const lightboxMidia = lightboxIndex >= 0 ? midiasFiltradas[lightboxIndex] : null;

  function lightboxPrev() {
    if (lightboxIndex <= 0) return;
    setLightboxId(midiasFiltradas[lightboxIndex - 1].id);
  }
  function lightboxNext() {
    if (lightboxIndex >= midiasFiltradas.length - 1) return;
    setLightboxId(midiasFiltradas[lightboxIndex + 1].id);
  }

  const temAnteDepois = midias.some(
    (m) => m.tipo === 'foto_antes' || m.tipo === 'foto_depois',
  );
  const editandoMidia = editandoId ? midias.find((m) => m.id === editandoId) ?? null : null;

  const TIPOS_FILTRO: { id: TipoMidia | 'todos'; label: string }[] = [
    { id: 'todos',        label: 'Todos' },
    { id: 'foto_antes',   label: 'Antes' },
    { id: 'foto_depois',  label: 'Depois' },
    { id: 'foto_durante', label: 'Durante' },
    { id: 'video',        label: 'Vídeos' },
    { id: 'exame',        label: 'Exames' },
    { id: 'documento',    label: 'Docs' },
    { id: 'outro',        label: 'Outros' },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Seletor de perfil simulado ── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-400">🔐 Simular perfil:</span>
        <div className="flex gap-2 flex-wrap">
          {(['profissional', 'admin', 'recepcao'] as RolePerfil[]).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={
                role === r
                  ? { backgroundColor: '#1B2A4A', color: 'white' }
                  : { backgroundColor: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }
              }
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-400 ml-auto hidden sm:block">
          Controle de acesso simulado — auth real em breve
        </span>
      </div>

      {/* ── Acesso negado para recepção ── */}
      {role === 'recepcao' ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: '#1B2A4A' }}>
            <span className="text-xl">🔒</span>
            <p className="font-bold text-sm text-white">Acesso Restrito — Prontuário Clínico</p>
          </div>
          <div className="p-12 text-center space-y-3">
            <p className="text-5xl">🚫</p>
            <p className="text-sm font-semibold text-gray-600">
              Recepcionistas não têm acesso ao Prontuário
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Fotos, vídeos, exames e documentos clínicos são restritos a profissionais
              de saúde e administradores do sistema.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO — ARQUIVOS, FOTOS E VÍDEOS                   */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Cabeçalho */}
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🗂️</span>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Arquivos, Fotos e Vídeos
                </h3>
                {midias.length > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#1B2A4A', color: 'white' }}
                  >
                    {midias.length}
                  </span>
                )}
              </div>

              {temAnteDepois && (
                <button
                  onClick={() => setComparando(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
                >
                  ↔ Comparar Antes/Depois
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">

              {/* 1. Upload */}
              <UploadZone onFiles={handleFiles} />

              {/* 2. Painel de categorização */}
              {pendingFiles.length > 0 && (
                <CategorizacaoPanel
                  files={pendingFiles}
                  metas={pendingMetas}
                  procedimentos={todosProcs}
                  onChange={handleMetaChange}
                  onRemove={handleRemovePending}
                  onSave={handleSaveAll}
                  saving={saving}
                />
              )}

              {/* 3. Stats resumo */}
              {!loadingMidia && midias.length > 0 && (
                <ResumoStats midias={midias} />
              )}

              {/* 4. Filtros + toggle visualização */}
              {midias.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filtros de tipo */}
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {TIPOS_FILTRO.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setFiltroTipo(id)}
                        className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={
                          filtroTipo === id
                            ? { backgroundColor: '#1B2A4A', color: 'white' }
                            : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Filtro procedimento */}
                    {todosProcs.length > 0 && (
                      <select
                        value={filtroProc}
                        onChange={(e) => setFiltroProc(e.target.value)}
                        className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none"
                      >
                        <option value="">Todos os procedimentos</option>
                        {todosProcs.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    )}

                    {/* Toggle Grid / Lista */}
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className="px-2.5 py-1 text-sm font-bold transition-colors"
                        style={viewMode === 'grid'
                          ? { backgroundColor: '#1B2A4A', color: 'white' }
                          : { color: '#9CA3AF' }
                        }
                        title="Visualização em grade"
                      >
                        ⊞
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className="px-2.5 py-1 text-sm font-bold transition-colors border-l border-gray-200"
                        style={viewMode === 'list'
                          ? { backgroundColor: '#1B2A4A', color: 'white' }
                          : { color: '#9CA3AF' }
                        }
                        title="Visualização em lista"
                      >
                        ☰
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Galeria ou Lista */}
              {loadingMidia ? (
                <div className="flex justify-center py-10">
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#1B2A4A', borderTopColor: 'transparent' }}
                  />
                </div>
              ) : midiasFiltradas.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {midiasFiltradas.map((m) => (
                      <MidiaThumb
                        key={m.id}
                        midia={m}
                        onClick={() => setLightboxId(m.id)}
                        onDelete={() => handleDelete(m.id)}
                        onEdit={() => setEditandoId(m.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {midiasFiltradas.map((m) => (
                      <MidiaListaItem
                        key={m.id}
                        midia={m}
                        onClick={() => setLightboxId(m.id)}
                        onDelete={() => handleDelete(m.id)}
                        onEdit={() => setEditandoId(m.id)}
                      />
                    ))}
                  </div>
                )
              ) : midias.length > 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum arquivo corresponde ao filtro selecionado.
                </div>
              ) : (
                <div className="text-center py-10 space-y-2">
                  <p className="text-4xl">📸</p>
                  <p className="text-sm font-semibold text-gray-500">Nenhum arquivo ainda</p>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Arraste fotos, vídeos ou documentos clínicos para a área acima,
                    ou clique nela para selecionar.
                  </p>
                </div>
              )}

              {/* 6. Aviso de segurança */}
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs text-gray-500"
                style={{ backgroundColor: 'rgba(27,42,74,0.04)' }}
              >
                <span className="flex-shrink-0 mt-0.5">🔒</span>
                <span>
                  Arquivos visíveis apenas para{' '}
                  <strong className="font-semibold">Profissional</strong> e{' '}
                  <strong className="font-semibold">Admin</strong>.{' '}
                  Recepcionistas não têm acesso a fotos e vídeos clínicos.
                  Todo upload registra perfil, data e hora.{' '}
                  Armazenamento local via <strong>IndexedDB</strong> — estrutura preparada
                  para migração ao <strong>Supabase Storage</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO — PRONTUÁRIO CLÍNICO (módulos futuros)       */}
          {/* ═══════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
              <span className="text-base">🩺</span>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Prontuário Clínico — Em Desenvolvimento
              </h3>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '📋', label: 'Evoluções',   desc: 'Notas clínicas por atendimento' },
                { icon: '💊', label: 'Prescrições', desc: 'Medicamentos e protocolos' },
                { icon: '📊', label: 'Laudos',      desc: 'Exames e avaliações técnicas' },
                { icon: '📝', label: 'Anamnese',    desc: 'Histórico de saúde do cliente' },
              ].map(({ icon, label, desc }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <span className="text-2xl">{icon}</span>
                  <p className="text-xs font-semibold text-gray-600 mt-2">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  <span className="inline-block mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Em breve
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Lightbox ── */}
      {lightboxMidia && (
        <Lightbox
          midia={lightboxMidia}
          total={midiasFiltradas.length}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxId(null)}
          onPrev={lightboxIndex > 0 ? lightboxPrev : undefined}
          onNext={lightboxIndex < midiasFiltradas.length - 1 ? lightboxNext : undefined}
        />
      )}

      {/* ── Comparador Antes/Depois ── */}
      {comparando && (
        <ComparadorModal midias={midias} onClose={() => setComparando(false)} />
      )}

      {/* ── Modal editar metadados ── */}
      {editandoMidia && (
        <EditMetadataModal
          midia={editandoMidia}
          procedimentos={todosProcs}
          onClose={() => setEditandoId(null)}
          onSave={(patch) => handleEditSave(editandoMidia.id, patch)}
        />
      )}
    </div>
  );
}
