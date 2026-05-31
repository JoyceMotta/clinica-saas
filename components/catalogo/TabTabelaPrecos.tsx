'use client';

import { useEffect, useState } from 'react';
import {
  listarItens,
  formatReais,
  type ItemCatalogo,
  type CategoriaItem,
  CATEGORIA_LABELS,
} from '@/lib/local-storage-catalogo';

const ORDEM_CATEGORIAS: CategoriaItem[] = ['consulta', 'procedimento', 'pacote_sessoes', 'produto_fisico'];

const CATEGORIA_CORES_BG: Record<CategoriaItem, string> = {
  consulta:       '#EFF6FF',
  procedimento:   '#FDF4FF',
  pacote_sessoes: '#FEF3C7',
  produto_fisico: '#F0FDF4',
};

const CATEGORIA_CORES_TEXT: Record<CategoriaItem, string> = {
  consulta:       '#1D4ED8',
  procedimento:   '#9333EA',
  pacote_sessoes: '#D97706',
  produto_fisico: '#16A34A',
};

export default function TabTabelaPrecos({ refreshKey }: { refreshKey: number }) {
  const [itens, setItens] = useState<ItemCatalogo[]>([]);

  useEffect(() => {
    setItens(listarItens().filter((i) => i.ativo));
  }, [refreshKey]);

  function handlePrint() {
    window.print();
  }

  const porCategoria = ORDEM_CATEGORIAS.reduce<Partial<Record<CategoriaItem, ItemCatalogo[]>>>(
    (acc, cat) => {
      const lista = itens.filter((i) => i.categoria === cat);
      if (lista.length > 0) acc[cat] = lista;
      return acc;
    },
    {},
  );

  const temItens = Object.keys(porCategoria).length > 0;

  return (
    <div className="space-y-5">

      {/* Controles */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Exibe apenas itens <span className="font-semibold text-green-600">ativos</span> agrupados por categoria.
        </p>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
          style={{ borderColor: '#1B2A4A', color: '#1B2A4A' }}
        >
          🖨️ Imprimir tabela
        </button>
      </div>

      {!temItens ? (
        <div className="p-12 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-100 shadow-sm">
          Nenhum item ativo no catálogo.
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(porCategoria) as [CategoriaItem, ItemCatalogo[]][]).map(([cat, lista]) => (
            <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Cabeçalho da categoria */}
              <div
                className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"
                style={{ backgroundColor: CATEGORIA_CORES_BG[cat] }}
              >
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: CATEGORIA_CORES_TEXT[cat] }}
                >
                  {CATEGORIA_LABELS[cat]}
                </span>
                <span className="text-xs text-gray-400">
                  {lista.length} item{lista.length !== 1 ? 'ns' : ''}
                </span>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 text-left">
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Item</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 text-right">Valor unitário</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 text-right">Valor pacote</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 text-right">Com PIX</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Parcelamento</th>
                      <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Fiscal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lista.map((item) => {
                      const comPix = item.descontoPix
                        ? Math.round(item.valorUnitario * (1 - item.descontoPix / 100))
                        : null;
                      const maxParcCredito = item.parcelamentoMaximo['credito'];
                      const maxParcBoleto  = item.parcelamentoMaximo['boleto'];

                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
                              {item.nome}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-sm font-bold" style={{ color: '#1B2A4A' }}>
                              {formatReais(item.valorUnitario)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {item.valorPacote ? (
                              <span className="text-sm font-semibold text-purple-700">
                                {formatReais(item.valorPacote)}
                              </span>
                            ) : (
                              <span className="text-gray-200 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {comPix ? (
                              <div>
                                <span className="text-sm font-semibold text-green-600">
                                  {formatReais(comPix)}
                                </span>
                                <span className="block text-[10px] text-green-500">
                                  -{item.descontoPix}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-200 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              {maxParcCredito && (
                                <span className="text-xs text-gray-500">
                                  Crédito: até {maxParcCredito}x
                                </span>
                              )}
                              {maxParcBoleto && (
                                <span className="text-xs text-gray-500">
                                  Boleto: até {maxParcBoleto}x
                                </span>
                              )}
                              {!maxParcCredito && !maxParcBoleto && (
                                <span className="text-gray-300 text-xs">À vista</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              {item.tipoFiscal === 'servico' ? 'NFS-e' : 'NF-e'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rodapé para impressão */}
      <div className="text-xs text-gray-400 text-center pt-2">
        Tabela gerada em {new Date().toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric',
        })}. Valores sujeitos a alteração sem aviso prévio.
      </div>
    </div>
  );
}
