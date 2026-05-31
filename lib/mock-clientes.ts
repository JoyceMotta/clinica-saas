/**
 * Arquivo mantido por compatibilidade — sem dados fictícios.
 * Clientes são salvos via localStorage até o Supabase ser configurado.
 */

export type MockCliente = {
  id: string;
  nome: string;
  cpf: string;
  rg: string | null;
  dataNascimento: Date;
  sexo: string | null;
  estadoCivil: string | null;
  profissao: string | null;
  nacionalidade: string | null;
  whatsapp: string;
  telefoneFix: string | null;
  email: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  nomeEmergencia: string | null;
  parentescoEmergencia: string | null;
  telefoneEmergencia: string | null;
  menorDeIdade: boolean;
  nomeResponsavel: string | null;
  cpfResponsavel: string | null;
  rgResponsavel: string | null;
  dataNascResponsavel: Date | null;
  parentescoResponsavel: string | null;
  whatsappResponsavel: string | null;
  emailResponsavel: string | null;
  enderecoResponsavelIgual: boolean;
  cepResponsavel: string | null;
  ruaResponsavel: string | null;
  numeroResponsavel: string | null;
  complementoResponsavel: string | null;
  bairroResponsavel: string | null;
  cidadeResponsavel: string | null;
  ufResponsavel: string | null;
  comoConheceu: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const MOCK_CLIENTES: MockCliente[] = [];
