// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CategoriaModelo = 'tcle' | 'anamnese' | 'contrato' | 'termo' | 'aviso' | 'outro';

export const CATEGORIA_MODELOS_LABELS: Record<CategoriaModelo, string> = {
  tcle:     'TCLE — Consentimento',
  anamnese: 'Ficha de Anamnese',
  contrato: 'Contrato / Política',
  termo:    'Termo de Responsabilidade',
  aviso:    'Aviso Pós-Procedimento',
  outro:    'Outro',
};

export const CATEGORIA_MODELOS_CORES: Record<CategoriaModelo, { bg: string; text: string }> = {
  tcle:     { bg: '#EFF6FF', text: '#1D4ED8' },
  anamnese: { bg: '#F0FDF4', text: '#16A34A' },
  contrato: { bg: '#FEF3C7', text: '#D97706' },
  termo:    { bg: '#FDF4FF', text: '#9333EA' },
  aviso:    { bg: '#FFF7ED', text: '#EA580C' },
  outro:    { bg: '#F9FAFB', text: '#6B7280' },
};

export const CONSELHOS_OPTS = ['Todos', 'CRM', 'CRO', 'CFBio', 'COREN', 'CRN', 'CRP', 'CREFITO'];

// Variáveis disponíveis no editor
export const VARIAVEIS: { key: string; label: string; exemplo: string }[] = [
  { key: '{{nome_paciente}}',   label: 'Nome do paciente',     exemplo: 'Ana Beatriz Santos' },
  { key: '{{cpf_paciente}}',    label: 'CPF do paciente',      exemplo: '000.000.000-00' },
  { key: '{{data_nascimento}}', label: 'Data de nascimento',   exemplo: '01/01/1990' },
  { key: '{{telefone}}',        label: 'Telefone/WhatsApp',    exemplo: '(11) 99999-0000' },
  { key: '{{email_paciente}}',  label: 'E-mail do paciente',   exemplo: 'paciente@email.com' },
  { key: '{{data}}',            label: 'Data atual',           exemplo: '05/06/2026' },
  { key: '{{procedimento}}',       label: 'Procedimento',              exemplo: 'Toxina Botulínica' },
  { key: '{{titulo_profissional}}', label: 'Título + nome do profissional', exemplo: 'Dra. Joyce Motta' },
  { key: '{{conselho}}',           label: 'Conselho',                  exemplo: 'CRM' },
  { key: '{{numero_registro}}', label: 'Nº de registro',       exemplo: '123456' },
  { key: '{{clinica}}',         label: 'Nome da clínica',      exemplo: 'Clínica Estética' },
];

export interface ModeloDocumento {
  id: string;
  titulo: string;
  categoria: CategoriaModelo;
  conselho: string;      // 'Todos', 'CRM', etc.
  versao: string;        // '1.0'
  conteudo: string;      // texto com {{variaveis}}
  tipoArquivo: 'texto' | 'pdf' | 'docx';
  arquivoBase64?: string;
  arquivoNome?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY = 'clinica_documentos_modelos_v1';

function todos(): ModeloDocumento[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function salvar(items: ModeloDocumento[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function genId(): string {
  return `mod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const TCLE_TOXINA_SEED: ModeloDocumento = {
  id: 'mod_tcle_toxina_v1',
  titulo: 'TCLE — Aplicação de Toxina Botulínica',
  categoria: 'tcle',
  conselho: 'CRM, CFBio, CRO',
  versao: '1.0',
  tipoArquivo: 'texto',
  ativo: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  conteudo: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
<h2 style="text-align:center">TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)</h2>
<h3 style="text-align:center">PROCEDIMENTO: APLICAÇÃO DE TOXINA BOTULÍNICA</h3>

<p><strong>Profissional responsável:</strong> {{titulo_profissional}}</p>
<p><strong>Local de atendimento:</strong> {{clinica}}</p>
<p><strong>Nome do paciente:</strong> {{nome_paciente}}</p>
<p><strong>CPF:</strong> {{cpf_paciente}}</p>
<p><strong>Data:</strong> {{data}}</p>

<table border="1" style="width:100%; margin: 20px 0; padding: 10px; border-collapse:collapse;">
<tr><td style="padding:10px"><strong>Os dados abaixo visam orientá-lo(a), fornecendo informações importantes sobre o procedimento indicado pelo(a) profissional que lhe assiste e os possíveis riscos, insucessos e complicações associados a este procedimento.</strong></td></tr>
</table>

<h4>1. COMO É FEITO O PROCEDIMENTO?</h4>
<p>O procedimento é feito no consultório através da aplicação da substância em pontos escolhidos de acordo com cada paciente. A aplicação é rápida, dura em média 45 minutos.</p>
<p>A Toxina botulínica é uma proteína produzida pela bactéria <em>Clostridium botulinum</em>. Quando aplicada por injeção, em quantidades muito pequenas, em um músculo facial específico, o impulso que orienta este músculo será bloqueado, causando o relaxamento local. Deste modo, a toxina botulínica atua como um bloqueio da musculatura subjacente das linhas indesejadas.</p>
<p>São realizadas aplicações superficiais por meio de uma agulha pequena e fina, gerando pouca dor no paciente tratado. Geralmente não há necessidade de anestesia, nem repouso. O possível resultado será percebido após 48h da aplicação da toxina, e com 15 dias atingirá seu efeito máximo. Geralmente, a toxina botulínica dura de 4 a 6 meses.</p>

<h4>2. DAS INDICAÇÕES PARA O PROCEDIMENTO:</h4>
<p>A toxina botulínica é indicada para amenizar linhas de expressão e rugas profundas: linhas verticais entre as sobrancelhas; pés-de-galinha nos cantos dos olhos; linhas horizontais na testa e nas bandas do músculo platisma.</p>

<h4>3. ESCLARECIMENTOS QUANTO AO MATERIAL UTILIZADO:</h4>
<p>A quantidade de proteína utilizada depende muito dos pontos escolhidos e dos objetivos de cada paciente. De acordo com o plano de tratamento, será aplicado na região: _____________, na quantidade de: _____________.</p>

<h4>4. DA REGIÃO QUE SERÁ APLICADA:</h4>
<p>As principais áreas de aplicação para fins estéticos são: testa, glabela (entre as sobrancelhas), área lateral externa dos olhos (pés-de-galinha), acima dos lábios, ponta do nariz e queixo.</p>
<p>No caso do seu plano de tratamento, a toxina botulínica será aplicada na região: _____________, com o seguinte objetivo: _____________.</p>

<h4>5. DOS RISCOS, POSSÍVEIS INSUCESSOS E COMPLICAÇÕES:</h4>

<h5>5.1. RISCOS GERAIS (frequentes ou esperados):</h5>
<ul>
<li><strong>Eritema (vermelhidão local):</strong> desaparece em 30 minutos até algumas horas.</li>
<li><strong>Dor:</strong> desconforto ou queimação durante ou após a aplicação; melhora em poucas horas.</li>
<li><strong>Equimose (roxos):</strong> regride em até 7 dias.</li>
<li><strong>Edema (inchaço):</strong> desaparece em até 48 horas.</li>
<li><strong>Assimetria:</strong> avaliação após 15 dias e possível retoque.</li>
</ul>

<h5>5.2. RISCOS ESPECÍFICOS (menos comuns):</h5>
<ul>
<li><strong>Ptose palpebral (pálpebra caída):</strong> duração de 2 a 6 semanas; tratável com colírios.</li>
<li><strong>Ptose labial ou sorriso assimétrico:</strong> autolimitado, melhora progressivamente.</li>
<li><strong>Infecção local:</strong> requer antibioticoterapia.</li>
<li><strong>Reação alérgica:</strong> antialérgicos; em caso grave, atendimento emergencial.</li>
</ul>

<h5>5.3. BOTULISMO IATROGÊNICO:</h5>
<p>Risco raro de disseminação da toxina além do local da injeção. Sintomas: visão borrada, pálpebras caídas, dificuldade de engolir e respirar. Em caso de suspeita: atendimento médico imediato.</p>

<h5>5.4. USO DE MEDICAMENTOS GLP-1 (semaglutida, tirzepatida e similares):</h5>
<p>O(a) paciente declara estar: ( ) em uso &nbsp;&nbsp; ( ) sem uso de medicamentos agonistas GLP-1.</p>
<p>Pacientes em uso desses medicamentos podem apresentar redução da eficácia e/ou duração do efeito da toxina botulínica. O(a) profissional não poderá ser responsabilizado(a) por resultado inferior ao esperado decorrente do uso desses medicamentos, conforme art. 14, §3º, II e III do CDC e art. 945 do Código Civil.</p>

<h4>6. DAS RECOMENDAÇÕES PÓS-PROCEDIMENTO:</h4>
<ul>
<li>Repouso de 24 horas após o procedimento;</li>
<li>Evitar exposição ao sol ou temperaturas extremas nos primeiros dias;</li>
<li>Evitar massagear ou levar a mão ao rosto;</li>
<li>Não realizar limpeza profunda ou com produtos adstringentes;</li>
<li>Não realizar exercícios físicos no dia da sessão;</li>
<li>Evitar se deitar por no mínimo 4 horas após a aplicação.</li>
</ul>
<p>Recomendações adicionais da profissional: _____________________________________________</p>

<table border="1" style="width:100%; margin: 20px 0; border-collapse:collapse;">
<tr><td style="padding:12px">
<strong>DIREITOS DO(A) PACIENTE — Lei nº 15.378/2026 (Estatuto dos Direitos do Paciente)</strong><br><br>
<strong>Art. 14, §1º — Revogação do consentimento:</strong> O(a) paciente tem o direito de retirar este consentimento a qualquer momento, sem sofrer qualquer represália.<br>
<strong>Art. 6º — Representante:</strong> O(a) paciente pode indicar livremente um representante para decisões em saúde.<br>
<strong>Art. 13 — Caráter não experimental:</strong> O procedimento utiliza produtos regularizados pela ANVISA.<br>
<strong>Art. 15 — Confidencialidade:</strong> As informações são sigilosas e tratadas conforme a LGPD (Lei nº 13.709/2018).<br>
<strong>Art. 18 — Segunda opinião:</strong> O(a) paciente tem direito de buscar parecer de outro profissional antes de consentir.<br>
<strong>Art. 19 — Acesso ao prontuário:</strong> O(a) paciente tem direito de acessar seu prontuário a qualquer momento.
</td></tr>
</table>

<p>Eu, <strong>{{nome_paciente}}</strong>, portador(a) do CPF nº <strong>{{cpf_paciente}}</strong>, declaro que recebi explicações e entendi sobre o procedimento de <strong>APLICAÇÃO DE TOXINA BOTULÍNICA</strong>, e após os devidos esclarecimentos, de forma livre e esclarecida, optei por realizá-lo.</p>

<p>DECLARO que compreendi detalhadamente o procedimento proposto, os riscos, benefícios, complicações, insucessos, contraindicações e alternativas, bem como fui informado(a) sobre a possibilidade de modificações na conduta durante o procedimento.</p>

<p>Em pleno gozo das minhas faculdades mentais, declaro meu consentimento e autorização para a realização do procedimento de <strong>APLICAÇÃO DE TOXINA BOTULÍNICA</strong>.</p>

<p>{{clinica}}, {{data}}.</p>

<br><br>
<div style="display:flex; justify-content:space-between; margin-top: 40px;">
<div style="text-align:center; width:45%">
<div style="border-top: 1px solid #000; padding-top: 5px;">Assinatura do(a) Paciente</div>
</div>
<div style="text-align:center; width:45%">
<div style="border-top: 1px solid #000; padding-top: 5px;">{{titulo_profissional}}</div>
</div>
</div>
</div>`,
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function listarModelos(): ModeloDocumento[] {
  const items = todos();
  // Injeta seed TCLE se ainda não existir
  if (!items.some(m => m.id === TCLE_TOXINA_SEED.id)) {
    const comSeed = [...items, TCLE_TOXINA_SEED];
    salvar(comSeed);
    return comSeed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function buscarModeloPorId(id: string): ModeloDocumento | null {
  return todos().find(m => m.id === id) ?? null;
}

export function criarModelo(data: Omit<ModeloDocumento, 'id' | 'createdAt' | 'updatedAt'>): ModeloDocumento {
  const agora = new Date().toISOString();
  const novo: ModeloDocumento = { ...data, id: genId(), createdAt: agora, updatedAt: agora };
  salvar([...todos(), novo]);
  return novo;
}

export function atualizarModelo(id: string, patch: Partial<Omit<ModeloDocumento, 'id' | 'createdAt'>>): ModeloDocumento | null {
  const all = todos();
  const idx = all.findIndex(m => m.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  all[idx] = updated;
  salvar(all);
  return updated;
}

export function deletarModelo(id: string): void {
  salvar(todos().filter(m => m.id !== id));
}

// ─── Preenchimento de variáveis ───────────────────────────────────────────────

export function preencherTemplate(conteudo: string, vars: Record<string, string>): string {
  let result = conteudo;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replaceAll(key, val);
  }
  return result;
}

// ─── Impressão via janela do navegador ────────────────────────────────────────

/** Detecta se o conteúdo é HTML (começa com tag) */
export function isHtmlContent(conteudo: string): boolean {
  return conteudo.trimStart().startsWith('<');
}

export function imprimirDocumento(titulo: string, conteudo: string): void {
  const w = window.open('', '_blank', 'width=960,height=760');
  if (!w) { alert('Popups bloqueados. Permita popups para imprimir.'); return; }

  const isHtml = isHtmlContent(conteudo);
  const body = isHtml
    ? conteudo
    : `<pre style="white-space:pre-wrap;word-wrap:break-word;font-family:inherit;font-size:11pt">${
        conteudo.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      }</pre>`;

  w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.7;color:#000;max-width:21cm;margin:0 auto;padding:1.5cm}
  h2,h3{margin:0.8em 0 0.4em}
  h4{margin:1em 0 0.3em;font-size:11pt}
  h5{margin:0.7em 0 0.2em;font-size:10.5pt}
  p{margin:0.4em 0}
  ul,ol{margin:0.4em 0 0.4em 1.5em}
  li{margin:0.15em 0}
  table{border-collapse:collapse;width:100%;margin:0.8em 0}
  td,th{padding:8px 10px;border:1px solid #666;vertical-align:top}
  .footer{margin-top:1.5cm;padding-top:0.4cm;border-top:1px solid #ccc;font-size:9pt;color:#666;text-align:center}
  @media print{body{padding:0}@page{margin:2cm;size:A4}}
</style>
</head>
<body>
${body}
<div class="footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body>
</html>`);
  w.document.close();
}
