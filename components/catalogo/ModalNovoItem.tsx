'use client';

import { useState } from 'react';
import {
  criarItem,
  atualizarItem,
  type ItemCatalogo,
  type CategoriaItem,
  type TipoFiscal,
  type FormaPagamento,
  type InsumoVinculado,
  CATEGORIA_LABELS,
  FORMA_LABELS,
} from '@/lib/local-storage-catalogo';
import { listarDocumentoTemplates } from '@/lib/local-storage-configuracoes';

const FORMAS: FormaPagamento[]           = ['pix', 'credito', 'debito', 'boleto', 'dinheiro'];
const FORMAS_PARCELAVEIS: FormaPagamento[] = ['credito', 'boleto'];
const CATEGORIAS: CategoriaItem[]        = ['consulta', 'procedimento', 'produto_fisico', 'pacote_sessoes'];

function parseCentavos(v: string): number {
  const s = v.trim();
  let normalized: string;
  if (s.includes(',')) {
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = s;
  }
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

function formatDecimal(centavos: number): string {
  return centavos > 0 ? (centavos / 100).toFixed(2).replace('.', ',') : '';
}

// ─── ModalNovoItem ────────────────────────────────────────────────────────────

export default function ModalNovoItem({
  inicial,
  onClose,
  onSaved,
}: {
  inicial?: ItemCatalogo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const docTemplates = listarDocumentoTemplates().filter((d) => d.ativo);

  const [nome, setNome]       = useState(inicial?.nome ?? '');
  const [categoria, setCat]   = useState<CategoriaItem>(inicial?.categoria ?? 'procedimento');
  const [tipoFiscal, setTipo] = useState<TipoFiscal>(inicial?.tipoFiscal ?? 'servico');
  const [vlUnit, setVlUnit]   = useState(inicial ? formatDecimal(inicial.valorUnitario) : '');
  const [vlPkt, setVlPkt]     = useState(inicial?.valorPacote ? formatDecimal(inicial.valorPacote) : '');
  const [formas, setFormas]   = useState<FormaPagamento[]>(
    inicial?.formasPagamento ?? ['pix', 'credito', 'debito'],
  );
  const [parcMax, setParcMax] = useState<Partial<Record<FormaPagamento, number>>>(
    inicial?.parcelamentoMaximo ?? { credito: 12 },
  );
  const [descPix, setDescPix] = useState(
    inicial?.descontoPix != null ? String(inicial.descontoPix) : '',
  );
  const [insumos, setInsumos] = useState<InsumoVinculado[]>(inicial?.insumos ?? []);
  const [docIds, setDocIds]   = useState<string[]>(inicial?.documentosIds ?? []);
  const [recompra, setRecomp] = useState(
    inicial?.intervaloRecompra != null ? String(inicial.intervaloRecompra) : '',
  );
  const [ativo, setAtivo]     = useState(inicial?.ativo ?? true);
  const [erro, setErro]       = useState('');

  function toggleForma(f: FormaPagamento) {
    if (formas.includes(f)) {
      setFormas(formas.filter((x) => x !== f));
      setParcMax((m) => { const copy = { ...m }; delete copy[f]; return copy; });
    } else {
      setFormas([...formas, f]);
    }
  }

  function addInsumo() {
    setInsumos((prev) => [...prev, { nome: '', quantidade: 1, unidade: 'unidade' }]);
  }

  function removeInsumo(i: number) {
    setInsumos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateInsumo(i: number, field: keyof InsumoVinculado, value: string | number) {
    setInsumos((prev) => prev.map((ins, idx) => idx === i ? { ...ins, [field]: value } : ins));
  }

  function toggleDoc(id: string) {
    setDocIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro('Nome é obrigatório.'); return; }
    const valorUnitario = parseCentavos(vlUnit);
    if (!valorUnitario) { setErro('Valor unitário inválido.'); return; }
    if (formas.length === 0) { setErro('Selecione ao menos uma forma de pagamento.'); return; }

    const data: Omit<ItemCatalogo, 'id' | 'createdAt'> = {
      nome:              nome.trim(),
      categoria,
      tipoFiscal,
      valorUnitario,
      valorPacote:        vlPkt ? parseCentavos(vlPkt) : null,
      formasPagamento:    formas,
      parcelamentoMaximo: parcMax,
      descontoPix:        descPix ? parseFloat(descPix) : null,
      insumos:            insumos.filter((ins) => ins.nome.trim()),
      documentosIds:      docIds,
      intervaloRecompra:  recompra ? parseInt(recompra) : null,
      ativo,
    };

    if (inicial) {
      atualizarItem(inicial.id, data);
    } else {
      criarItem(data);
    }
    onSaved();
    onClose();
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';
  const labelCls = 'block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: '#1B2A4A' }}
        >
          <h3 className="font-bold text-white text-sm">
            {inicial ? 'Editar Item do Catálogo' : 'Novo Item do Catálogo'}
          </h3>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white text-2xl font-thin leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Identificação */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
              Identificação
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Nome do item *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputCls}
                  placeholder="Ex: Toxina Botulínica, Protetor Solar FPS 70..."
                  autoFocus
                />
                {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
              </div>
              <div>
                <label className={labelCls}>Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCat(e.target.value as CategoriaItem)}
                  className={inputCls + ' bg-white'}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tipo Fiscal</label>
                <select
                  value={tipoFiscal}
                  onChange={(e) => setTipo(e.target.value as TipoFiscal)}
                  className={inputCls + ' bg-white'}
                >
                  <option value="servico">Serviço — NFS-e</option>
                  <option value="produto">Produto — NF-e</option>
                </select>
              </div>
            </div>
          </section>

          {/* Valores */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
              Precificação
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Valor unitário (R$) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vlUnit}
                  onChange={(e) => setVlUnit(e.target.value)}
                  className={inputCls}
                  placeholder="800,00"
                />
              </div>
              <div>
                <label className={labelCls}>Valor em pacote (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={vlPkt}
                  onChange={(e) => setVlPkt(e.target.value)}
                  className={inputCls}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </section>

          {/* Pagamento */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
              Formas de Pagamento
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {FORMAS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleForma(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                  style={
                    formas.includes(f)
                      ? { backgroundColor: '#1B2A4A', color: '#fff', borderColor: '#1B2A4A' }
                      : { backgroundColor: 'transparent', color: '#6B7280', borderColor: '#E5E7EB' }
                  }
                >
                  {FORMA_LABELS[f]}
                </button>
              ))}
            </div>

            {/* Parcelamento */}
            {FORMAS_PARCELAVEIS.some((f) => formas.includes(f)) && (
              <div className="mb-4">
                <label className={labelCls}>Parcelamento máximo</label>
                <div className="flex flex-wrap gap-4 mt-1">
                  {FORMAS_PARCELAVEIS.filter((f) => formas.includes(f)).map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{FORMA_LABELS[f]}</span>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={parcMax[f] ?? 1}
                        onChange={(e) =>
                          setParcMax((m) => ({ ...m, [f]: parseInt(e.target.value) || 1 }))
                        }
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-xs text-gray-400">x máx.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desconto PIX */}
            {formas.includes('pix') && (
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Desconto PIX
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={descPix}
                  onChange={(e) => setDescPix(e.target.value)}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="5"
                />
                <span className="text-sm text-gray-400">% de desconto</span>
              </div>
            )}
          </section>

          {/* Insumos */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C9A84C' }}>
                Insumos Vinculados
              </p>
              <button
                type="button"
                onClick={addInsumo}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors hover:bg-gray-50"
                style={{ color: '#1B2A4A', borderColor: '#1B2A4A' }}
              >
                + Adicionar insumo
              </button>
            </div>
            {insumos.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Nenhum insumo vinculado.</p>
            ) : (
              <div className="space-y-2">
                {insumos.map((ins, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nome do insumo"
                      value={ins.nome}
                      onChange={(e) => updateInsumo(i, 'nome', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder="Qtd"
                      value={ins.quantidade}
                      onChange={(e) => updateInsumo(i, 'quantidade', parseFloat(e.target.value) || 1)}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Unid."
                      value={ins.unidade}
                      onChange={(e) => updateInsumo(i, 'unidade', e.target.value)}
                      className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeInsumo(i)}
                      className="text-red-400 hover:text-red-600 text-xl font-bold px-1 leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Documentos */}
          {docTemplates.length > 0 && (
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Documentos Obrigatórios
              </p>
              <div className="grid grid-cols-2 gap-1 max-h-44 overflow-y-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                {docTemplates.map((dt) => (
                  <label
                    key={dt.id}
                    className="flex items-start gap-2 cursor-pointer text-sm hover:bg-white rounded p-1.5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={docIds.includes(dt.id)}
                      onChange={() => toggleDoc(dt.id)}
                      className="mt-0.5 w-4 h-4 rounded flex-shrink-0"
                    />
                    <span className="text-gray-700 leading-tight text-xs">{dt.titulo}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Recompra + Status */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
              Recompra &amp; Status
            </p>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className={labelCls}>Intervalo de recompra</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={recompra}
                    onChange={(e) => setRecomp(e.target.value)}
                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="ex: 30"
                  />
                  <span className="text-xs text-gray-400">dias</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Usado pelo motor de reativação de clientes.
                </p>
              </div>
              <div className="pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-600 font-medium">Item ativo</span>
                </label>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 justify-end border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#1B2A4A' }}
          >
            {inicial ? 'Salvar alterações' : 'Criar item'}
          </button>
        </div>
      </form>
    </div>
  );
}
