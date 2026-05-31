'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { ClienteInput, ClienteFormErrors } from '@/lib/types';

export type { ClienteInput, ClienteFormErrors };

export type ClienteActionResult =
  | { success: true; id: string }
  | { success: false; errors: ClienteFormErrors };

// ─── Validação ────────────────────────────────────────────────────────────────

function validarCPF(cpf: string): boolean {
  const s = cpf.replace(/\D/g, '');
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  const dig = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(s[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  return dig(9) === parseInt(s[9]) && dig(10) === parseInt(s[10]);
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function criarCliente(
  data: ClienteInput,
): Promise<ClienteActionResult> {
  const errors: ClienteFormErrors = {};

  if (!data.nome.trim()) errors.nome = ['Campo obrigatório'];

  const cpfDigits = data.cpf.replace(/\D/g, '');
  if (!cpfDigits) errors.cpf = ['Campo obrigatório'];
  else if (!validarCPF(data.cpf)) errors.cpf = ['CPF inválido — verifique os dígitos'];

  if (!data.rg?.trim()) errors.rg = ['Campo obrigatório'];
  if (!data.rgOrgaoEmissor?.trim()) errors.rgOrgaoEmissor = ['Campo obrigatório'];
  if (!data.dataNascimento) errors.dataNascimento = ['Campo obrigatório'];
  if (!data.sexo) errors.sexo = ['Campo obrigatório'];
  if (!data.estadoCivil) errors.estadoCivil = ['Campo obrigatório'];
  if (!data.profissao?.trim()) errors.profissao = ['Campo obrigatório'];
  if (!data.nacionalidade?.trim()) errors.nacionalidade = ['Campo obrigatório'];
  if (!data.whatsapp.replace(/\D/g, '')) errors.whatsapp = ['Campo obrigatório'];
  if (!data.email?.trim()) errors.email = ['Campo obrigatório'];
  if (!data.cep?.replace(/\D/g, '')) errors.cep = ['Campo obrigatório'];
  if (!data.rua?.trim()) errors.rua = ['Campo obrigatório'];
  if (!data.numero?.trim()) errors.numero = ['Campo obrigatório'];
  if (!data.bairro?.trim()) errors.bairro = ['Campo obrigatório'];
  if (!data.cidade?.trim()) errors.cidade = ['Campo obrigatório'];
  if (!data.uf) errors.uf = ['Campo obrigatório'];
  if (!data.nomeEmergencia?.trim()) errors.nomeEmergencia = ['Campo obrigatório'];
  if (!data.telefoneEmergencia?.replace(/\D/g, '')) errors.telefoneEmergencia = ['Campo obrigatório'];

  if (data.menorDeIdade) {
    if (!data.nomeResponsavel.trim())
      errors.nomeResponsavel = ['Campo obrigatório'];
    const cpfRespDigits = data.cpfResponsavel.replace(/\D/g, '');
    if (!cpfRespDigits)
      errors.cpfResponsavel = ['Campo obrigatório'];
    else if (!validarCPF(data.cpfResponsavel))
      errors.cpfResponsavel = ['CPF inválido'];
    if (!data.rgResponsavel?.trim()) errors.rgResponsavel = ['Campo obrigatório'];
    if (!data.parentescoResponsavel) errors.parentescoResponsavel = ['Campo obrigatório'];
    if (!data.whatsappResponsavel.replace(/\D/g, ''))
      errors.whatsappResponsavel = ['Campo obrigatório'];
    if (!data.enderecoIgual) {
      if (!data.cepResponsavel?.replace(/\D/g, '')) errors.cepResponsavel = ['Campo obrigatório'];
      if (!data.ruaResponsavel?.trim()) errors.ruaResponsavel = ['Campo obrigatório'];
      if (!data.numeroResponsavel?.trim()) errors.numeroResponsavel = ['Campo obrigatório'];
      if (!data.bairroResponsavel?.trim()) errors.bairroResponsavel = ['Campo obrigatório'];
      if (!data.cidadeResponsavel?.trim()) errors.cidadeResponsavel = ['Campo obrigatório'];
      if (!data.ufResponsavel) errors.ufResponsavel = ['Campo obrigatório'];
    }
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  // ── Persistência (Prisma) ─────────────────────────────────────────────────
  const str = (v: string) => v.trim() || null;
  const dig = (v: string) => v.replace(/\D/g, '') || null;

  try {
    const cliente = await prisma.cliente.create({
      data: {
        nome: data.nome.trim(),
        cpf: cpfDigits,
        rg: str(data.rg),
        rgOrgaoEmissor: str(data.rgOrgaoEmissor),
        dataNascimento: new Date(data.dataNascimento),
        sexo: str(data.sexo),
        estadoCivil: str(data.estadoCivil),
        profissao: str(data.profissao),
        nacionalidade: str(data.nacionalidade),
        whatsapp: data.whatsapp.replace(/\D/g, ''),
        telefoneFix: dig(data.telefoneFix),
        email: str(data.email.toLowerCase()),
        cep: dig(data.cep),
        rua: str(data.rua),
        numero: str(data.numero),
        complemento: str(data.complemento),
        bairro: str(data.bairro),
        cidade: str(data.cidade),
        uf: str(data.uf),
        nomeEmergencia: str(data.nomeEmergencia),
        parentescoEmergencia: str(data.parentescoEmergencia),
        telefoneEmergencia: dig(data.telefoneEmergencia),
        menorDeIdade: data.menorDeIdade,
        nomeResponsavel: data.menorDeIdade ? str(data.nomeResponsavel) : null,
        cpfResponsavel: data.menorDeIdade
          ? data.cpfResponsavel.replace(/\D/g, '') || null
          : null,
        rgResponsavel: data.menorDeIdade ? str(data.rgResponsavel) : null,
        dataNascResponsavel:
          data.menorDeIdade && data.dataNascResponsavel
            ? new Date(data.dataNascResponsavel)
            : null,
        parentescoResponsavel: data.menorDeIdade
          ? str(data.parentescoResponsavel)
          : null,
        whatsappResponsavel: data.menorDeIdade
          ? data.whatsappResponsavel.replace(/\D/g, '') || null
          : null,
        emailResponsavel: data.menorDeIdade
          ? str(data.emailResponsavel.toLowerCase())
          : null,
        enderecoResponsavelIgual: data.menorDeIdade ? data.enderecoIgual : true,
        cepResponsavel:
          data.menorDeIdade && !data.enderecoIgual ? dig(data.cepResponsavel) : null,
        ruaResponsavel:
          data.menorDeIdade && !data.enderecoIgual ? str(data.ruaResponsavel) : null,
        numeroResponsavel:
          data.menorDeIdade && !data.enderecoIgual ? str(data.numeroResponsavel) : null,
        complementoResponsavel:
          data.menorDeIdade && !data.enderecoIgual
            ? str(data.complementoResponsavel)
            : null,
        bairroResponsavel:
          data.menorDeIdade && !data.enderecoIgual ? str(data.bairroResponsavel) : null,
        cidadeResponsavel:
          data.menorDeIdade && !data.enderecoIgual ? str(data.cidadeResponsavel) : null,
        ufResponsavel:
          data.menorDeIdade && !data.enderecoIgual ? str(data.ufResponsavel) : null,
        comoConheceu: str(data.comoConheceu),
        aniversarioMensagem: data.aniversarioMensagem ?? true,
        mensagemAniversario: str(data.mensagemAniversario),
      },
    });
    revalidatePath('/clientes');
    return { success: true, id: cliente.id };
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === 'P2002')
      return { success: false, errors: { cpf: ['CPF já cadastrado no sistema'] } };
    return {
      success: false,
      errors: { _form: ['Erro ao salvar. Tente novamente.'] },
    };
  }
}

export async function deletarCliente(id: string): Promise<void> {
  await prisma.cliente.delete({ where: { id } });
  revalidatePath('/clientes');
  redirect('/clientes');
}
