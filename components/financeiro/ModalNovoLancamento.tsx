'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import {
  criarVenda,
  FormaPagamentoFin,
  FORMA_LABELS_FIN,
  parseMoney,
  formatCentavos,
  today,
} from '@/lib/financeiro-modulo';
import { listarClientesLocal, type ClienteLocal } from '@/lib/local-storage-clientes';
import { listarProfissionais, listarServicos, type Profissional, type Servico } from '@/lib/local-storage-configuracoes';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const FORMAS: FormaPagamentoFin[] = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'outro'];

export default function ModalNovoLancamento({ onClose, onSaved }: Props) {
  // Dados externos
  const [clientes, setClientes]           = useState<ClienteLocal[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [servicos, setServicos]           = useState<Servico[]>([]);

  // Busca de cliente
  const [buscaCliente, setBuscaCliente]   = useState('');
  const [clienteSel, setClienteSel]       = useState<ClienteLocal | null>(null);
  const [showSugest, setShowSugest]       = useState(false);
  const buscaRef = useRef<HTMLInputElement>(null);

  // Campos do formulário
  const [profissionalId, setProfissionalId] = useState('');
  const [procedimento, setProcedimento]     = useState('');
  const [procedimentoCustom, setProcedimentoCustom] = useState('');
  const [valorRaw, setValorRaw]             = useState('');
  const [forma, setForma]                   = useState<FormaPagamentoFin>('pix');
  const [parcelas, setParcelas]             = useState(1);
  const [primeiroVenc, setPrimeiroVenc]     = useState(today());
  const [obs, setObs]                       = useState('');
  const [error, setError]                   = useState('');
  const [saving, setSaving]                 = useState(false);

  useEffect(() => {
    setClientes(listarClientesLocal());
    setProfissionais(listarProfissionais().filter((p) => p.ativo));
    setServicos(listarServicos().filter((s) => s.ativo));
  }, []);

  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const sugestoes = buscaCliente.trim().length >= 2
    ? clientes.filter((c) => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6)
    : [];

  function selecionarCliente(c: ClienteLocal) {
    setClienteSel(c);
    setBuscaCliente(c.nome);
    setShowSugest(false);
  }

  const valorCentavos = parseMoney(valorRaw);
  const valorParcela  = parcelas > 0 && valorCentavos > 0
    ? Math.floor(valorCentavos / parcelas)
    : 0;

  const procedimentoFinal = procedimento === '__custom' ? procedimentoCustom.trim() : procedimento;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!clienteSel)              { setError('Selecione um cliente.'); return; }
    if (!procedimentoFinal)       { setError('Selecione ou informe o procedimento.'); return; }
    if (valorCentavos <= 0)       { setError('Informe um valor válido.'); return; }

    const profObj = profissionais.find((p) => p.id === profissionalId);

    setSaving(true);
    criarVenda({
      clienteId:        clienteSel.id,
      clienteNome:      clienteSel.nome,
      clienteWhatsapp:  clienteSel.whatsapp,
      profissionalId:   profissionalId,
      profissionalNome: profObj?.nome ?? '',
      procedimento:     procedimentoFinal,
      valorTotal:       valorCentavos,
      formaPagamento:   forma,
      numeroParcelas:   parcelas,
      primeiroVencimento: primeiroVenc,
      observacoes:      obs,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>Novo Lançamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {/* Cliente */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
              Cliente <span className="text-red-500">*</span>
            </label>
            <input
              ref={buscaRef}
              type="text"
              value={buscaCliente}
              onChange={(e) => { setBuscaCliente(e.target.value); setClienteSel(null); setShowSugest(true); }}
              onFocus={() => setShowSugest(true)}
              placeholder="Digite o nome do cliente..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
            {showSugest && sugestoes.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {sugestoes.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={() => selecionarCliente(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors"
                    >
                      <span className="font-medium">{c.nome}</span>
                      {c.whatsapp && <span className="ml-2 text-gray-400 text-xs">{c.whatsapp}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {clienteSel && (
              <p className="mt-1 text-xs text-green-600 font-medium">✓ {clienteSel.nome} selecionado</p>
            )}
          </div>

          {/* Profissional */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
              Profissional
            </label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">Sem profissional / clínica</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Procedimento */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
              Procedimento <span className="text-red-500">*</span>
            </label>
            <select
              value={procedimento}
              onChange={(e) => setProcedimento(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecione...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.nome}>{s.nome}</option>
              ))}
              <option value="__custom">Outro (digitar)</option>
            </select>
            {procedimento === '__custom' && (
              <input
                type="text"
                value={procedimentoCustom}
                onChange={(e) => setProcedimentoCustom(e.target.value)}
                placeholder="Descreva o procedimento..."
                className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          {/* Valor + Forma */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                Valor total (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={valorRaw}
                onChange={(e) => setValorRaw(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                Forma de pagamento
              </label>
              <select
                value={forma}
                onChange={(e) => setForma(e.target.value as FormaPagamentoFin)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              >
                {FORMAS.map((f) => (
                  <option key={f} value={f}>{FORMA_LABELS_FIN[f]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Parcelas + Vencimento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                Nº de parcelas
              </label>
              <input
                type="number"
                min={1}
                max={36}
                value={parcelas}
                onChange={(e) => setParcelas(Math.max(1, Math.min(36, Number(e.target.value))))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                1º vencimento
              </label>
              <input
                type="date"
                value={primeiroVenc}
                onChange={(e) => setPrimeiroVenc(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Cálculo automático */}
          {valorCentavos > 0 && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <span className="font-semibold" style={{ color: '#92400E' }}>
                {parcelas}× de {formatCentavos(valorParcela)}
              </span>
              {valorCentavos % parcelas !== 0 && (
                <span className="ml-2 text-xs text-amber-700">
                  (última: {formatCentavos(valorCentavos - valorParcela * (parcelas - 1))})
                </span>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
              Observações
            </label>
            <textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              rows={2}
              placeholder="Opcional..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
            >
              {saving ? 'Salvando…' : 'Criar lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
