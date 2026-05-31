/**
 * Tipos compartilhados entre cliente e servidor.
 */

export type ClienteInput = {
  nome: string;
  cpf: string;
  rg: string;
  rgOrgaoEmissor: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  profissao: string;
  nacionalidade: string;
  whatsapp: string;
  telefoneFix: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  nomeEmergencia: string;
  parentescoEmergencia: string;
  telefoneEmergencia: string;
  menorDeIdade: boolean;
  nomeResponsavel: string;
  cpfResponsavel: string;
  rgResponsavel: string;
  dataNascResponsavel: string;
  parentescoResponsavel: string;
  whatsappResponsavel: string;
  emailResponsavel: string;
  enderecoIgual: boolean;
  cepResponsavel: string;
  ruaResponsavel: string;
  numeroResponsavel: string;
  complementoResponsavel: string;
  bairroResponsavel: string;
  cidadeResponsavel: string;
  ufResponsavel: string;
  comoConheceu: string;
  // Aniversário
  aniversarioMensagem: boolean;
  mensagemAniversario: string;
};

export type ClienteFormErrors = {
  // Dados pessoais
  nome?: string[];
  cpf?: string[];
  rg?: string[];
  rgOrgaoEmissor?: string[];
  dataNascimento?: string[];
  sexo?: string[];
  estadoCivil?: string[];
  profissao?: string[];
  nacionalidade?: string[];
  // Contato
  whatsapp?: string[];
  email?: string[];
  // Endereço
  cep?: string[];
  rua?: string[];
  numero?: string[];
  bairro?: string[];
  cidade?: string[];
  uf?: string[];
  // Emergência
  nomeEmergencia?: string[];
  telefoneEmergencia?: string[];
  // Responsável
  nomeResponsavel?: string[];
  cpfResponsavel?: string[];
  rgResponsavel?: string[];
  parentescoResponsavel?: string[];
  whatsappResponsavel?: string[];
  cepResponsavel?: string[];
  ruaResponsavel?: string[];
  numeroResponsavel?: string[];
  bairroResponsavel?: string[];
  cidadeResponsavel?: string[];
  ufResponsavel?: string[];
  // Global
  _form?: string[];
};
