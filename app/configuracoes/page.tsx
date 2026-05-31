'use client';

import { useState } from 'react';
import TabEspecialidades  from '@/components/configuracoes/TabEspecialidades';
import TabServicos        from '@/components/configuracoes/TabServicos';
import TabDocumentosConfig from '@/components/configuracoes/TabDocumentosConfig';
import TabVinculos        from '@/components/configuracoes/TabVinculos';
import TabProfissionais   from '@/components/configuracoes/TabProfissionais';
import TabAuditoria       from '@/components/configuracoes/TabAuditoria';

type TabId = 'profissionais' | 'especialidades' | 'servicos' | 'documentos' | 'vinculos' | 'auditoria';

const TABS: { id: TabId; label: string; icon: string; desc: string }[] = [
  { id: 'profissionais',  label: 'Profissionais',      icon: '👨‍⚕️', desc: 'Cadastro e serviços por profissional' },
  { id: 'especialidades', label: 'Especialidades',     icon: '🏥', desc: 'Especialidades e conselhos profissionais' },
  { id: 'servicos',       label: 'Serviços',           icon: '🔧', desc: 'Catálogo de serviços da clínica' },
  { id: 'documentos',     label: 'Documentos',         icon: '📄', desc: 'Templates de documentos e TCLEs' },
  { id: 'vinculos',       label: 'Vínculos',           icon: '🔗', desc: 'Quais documentos pertencem a cada serviço' },
  { id: 'auditoria',      label: 'Auditoria',          icon: '🔍', desc: 'Log imutável de todas as ações do sistema' },
];

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<TabId>('profissionais');

  const tabAtual = TABS.find((t) => t.id === aba)!;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie profissionais, serviços e o sistema dinâmico de documentos clínicos.
        </p>
      </div>

      {/* Barra de abas */}
      <div className="flex overflow-x-auto border-b border-gray-200 -mb-px gap-0">
        {TABS.map(({ id, label, icon }) => {
          const active = aba === id;
          return (
            <button
              key={id}
              onClick={() => setAba(id)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0"
              style={
                active
                  ? { borderColor: '#1B2A4A', color: '#1B2A4A' }
                  : { borderColor: 'transparent', color: '#9CA3AF' }
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Descrição da aba */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
        style={{ backgroundColor: 'rgba(27,42,74,0.05)' }}
      >
        <span className="text-lg">{tabAtual.icon}</span>
        <div>
          <span className="font-semibold" style={{ color: '#1B2A4A' }}>{tabAtual.label}</span>
          <span className="text-gray-500 ml-2">{tabAtual.desc}</span>
        </div>
      </div>

      {/* Conteúdo */}
      <div>
        {aba === 'profissionais'  && <TabProfissionais />}
        {aba === 'especialidades' && <TabEspecialidades />}
        {aba === 'servicos'       && <TabServicos />}
        {aba === 'documentos'     && <TabDocumentosConfig />}
        {aba === 'vinculos'       && <TabVinculos />}
        {aba === 'auditoria'      && <TabAuditoria />}
      </div>
    </div>
  );
}
