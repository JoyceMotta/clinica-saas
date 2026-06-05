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

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function listarModelos(): ModeloDocumento[] {
  return todos().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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

export function imprimirDocumento(titulo: string, conteudo: string): void {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Popups bloqueados. Permita popups para imprimir.'); return; }
  const escaped = conteudo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;line-height:1.8;color:#000;padding:2cm;max-width:21cm;margin:0 auto}
  h1{font-size:15pt;text-align:center;margin-bottom:1.5cm;padding-bottom:0.5cm;border-bottom:2px solid #1B2A4A;color:#1B2A4A}
  pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;font-size:11pt}
  .footer{margin-top:2cm;padding-top:0.5cm;border-top:1px solid #ccc;font-size:9pt;color:#666;text-align:center}
  @media print{body{padding:0}@page{margin:2cm size:A4}}
</style>
</head>
<body>
<h1>${titulo}</h1>
<pre>${escaped}</pre>
<div class="footer">Documento gerado em ${new Date().toLocaleDateString('pt-BR', { day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit' })}</div>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
</body>
</html>`);
  w.document.close();
}
