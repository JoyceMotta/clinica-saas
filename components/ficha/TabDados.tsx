'use client';

import Link from 'next/link';
import type { ClienteLocal } from '@/lib/local-storage-clientes';
import {
  displayCPF,
  displayTelefone,
  formatData,
  calcularIdade,
} from '@/lib/formatters';
import { montarMensagem, abrirWhatsApp, isAniversarioHoje } from '@/lib/aniversarios';

// ─── Helpers visuais ──────────────────────────────────────────────────────────

export function FichaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-3.5 border-b border-gray-50">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h2>
      </div>
      <dl className="divide-y divide-gray-50">{children}</dl>
    </section>
  );
}

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-6 py-3">
      <dt className="w-44 flex-shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-navy break-all">{value}</dd>
    </div>
  );
}

// ─── Aba Dados Cadastrais ─────────────────────────────────────────────────────

export default function TabDados({ cliente }: { cliente: ClienteLocal }) {
  const idade = calcularIdade(cliente.dataNascimento);
  const querMsg = cliente.aniversarioMensagem !== false;
  const ehAniversario = isAniversarioHoje(cliente.dataNascimento);

  return (
    <div className="space-y-5">

      {/* ── Dados pessoais ── */}
      <FichaSection title="Dados Pessoais">
        <DataRow label="CPF" value={displayCPF(cliente.cpf)} />
        {cliente.rg && <DataRow label="RG" value={cliente.rg} />}
        {cliente.rgOrgaoEmissor && (
          <DataRow label="Órgão Emissor" value={cliente.rgOrgaoEmissor} />
        )}
        <DataRow
          label="Data de Nascimento"
          value={`${formatData(cliente.dataNascimento)} — ${idade} ano${idade !== 1 ? 's' : ''}`}
        />
        {cliente.sexo && <DataRow label="Sexo" value={cliente.sexo} />}
        {cliente.estadoCivil && <DataRow label="Estado Civil" value={cliente.estadoCivil} />}
        {cliente.profissao && <DataRow label="Profissão" value={cliente.profissao} />}
        {cliente.nacionalidade && <DataRow label="Nacionalidade" value={cliente.nacionalidade} />}
      </FichaSection>

      {/* ── Contato ── */}
      <FichaSection title="Contato">
        <DataRow label="WhatsApp" value={displayTelefone(cliente.whatsapp)} />
        {cliente.telefoneFix && (
          <DataRow label="Telefone Fixo" value={displayTelefone(cliente.telefoneFix)} />
        )}
        {cliente.email && <DataRow label="Email" value={cliente.email} />}
      </FichaSection>

      {/* ── Endereço ── */}
      {(cliente.rua || cliente.cidade) && (
        <FichaSection title="Endereço">
          {cliente.rua && (
            <DataRow
              label="Logradouro"
              value={[cliente.rua, cliente.numero, cliente.complemento]
                .filter(Boolean)
                .join(', ')}
            />
          )}
          {cliente.bairro && <DataRow label="Bairro" value={cliente.bairro} />}
          {cliente.cidade && (
            <DataRow
              label="Cidade / UF"
              value={[cliente.cidade, cliente.uf].filter(Boolean).join(' — ')}
            />
          )}
          {cliente.cep && (
            <DataRow
              label="CEP"
              value={`${cliente.cep.slice(0, 5)}-${cliente.cep.slice(5)}`}
            />
          )}
        </FichaSection>
      )}

      {/* ── Contato de emergência ── */}
      {cliente.nomeEmergencia && (
        <FichaSection title="Contato de Emergência">
          <DataRow label="Nome" value={cliente.nomeEmergencia} />
          {cliente.parentescoEmergencia && (
            <DataRow label="Parentesco" value={cliente.parentescoEmergencia} />
          )}
          {cliente.telefoneEmergencia && (
            <DataRow label="Telefone" value={displayTelefone(cliente.telefoneEmergencia)} />
          )}
        </FichaSection>
      )}

      {/* ── Responsável legal ── */}
      {cliente.menorDeIdade && cliente.nomeResponsavel && (
        <FichaSection title="Responsável Legal">
          <DataRow label="Nome" value={cliente.nomeResponsavel} />
          {cliente.cpfResponsavel && (
            <DataRow label="CPF" value={displayCPF(cliente.cpfResponsavel)} />
          )}
          {cliente.rgResponsavel && <DataRow label="RG" value={cliente.rgResponsavel} />}
          {cliente.dataNascResponsavel && (
            <DataRow label="Nascimento" value={formatData(cliente.dataNascResponsavel)} />
          )}
          {cliente.parentescoResponsavel && (
            <DataRow label="Parentesco" value={cliente.parentescoResponsavel} />
          )}
          {cliente.whatsappResponsavel && (
            <DataRow label="WhatsApp" value={displayTelefone(cliente.whatsappResponsavel)} />
          )}
          {cliente.emailResponsavel && (
            <DataRow label="Email" value={cliente.emailResponsavel} />
          )}
        </FichaSection>
      )}

      {/* ── Como conheceu ── */}
      {cliente.comoConheceu && (
        <FichaSection title="Como nos Conheceu">
          <DataRow label="Canal" value={cliente.comoConheceu} />
        </FichaSection>
      )}

      {/* ── Aniversário ── */}
      <FichaSection title="Mensagem de Aniversário">
        <DataRow
          label="Receber parabéns"
          value={querMsg ? 'Sim — via WhatsApp' : 'Não'}
        />
        {querMsg && (
          <DataRow
            label="Mensagem"
            value={
              cliente.mensagemAniversario?.trim()
                ? montarMensagem(cliente)
                : '(mensagem padrão da clínica)'
            }
          />
        )}
        {querMsg && (
          <div className="flex items-center gap-4 px-6 py-3 border-t border-gray-50">
            <button
              type="button"
              onClick={() => abrirWhatsApp(cliente)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={
                ehAniversario
                  ? { backgroundColor: '#C9A84C', color: '#1B2A4A' }
                  : { backgroundColor: '#1B2A4A', color: 'white' }
              }
            >
              <span>📱</span>
              {ehAniversario ? '🎂 Enviar parabéns agora!' : 'Enviar parabéns via WhatsApp'}
            </button>
            <p className="text-xs text-gray-400">Abre o WhatsApp com a mensagem pré-preenchida</p>
          </div>
        )}
      </FichaSection>

      {/* ── Histórico ── */}
      <FichaSection title="Histórico do Cadastro">
        <DataRow label="Cadastrado em" value={formatData(cliente.createdAt)} />
        <DataRow label="Última atualização" value={formatData(cliente.updatedAt)} />
      </FichaSection>

    </div>
  );
}
