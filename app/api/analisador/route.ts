import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Informações regulatórias por conselho ────────────────────────────────────

const REGRAS: Record<string, string> = {
  CRM: `
Conselho Regional de Medicina (CRM) — Resolução CFM 2.336/2023:
- PROIBIDO: garantir resultados de tratamentos ou procedimentos.
- PROIBIDO: usar superlativos ("o melhor médico", "o único que faz", "resultado garantido").
- PROIBIDO: comparar serviços ou depreciar outros profissionais.
- PROIBIDO: divulgar preços, promoções ou descontos para procedimentos médicos.
- PROIBIDO: usar imagens de antes/depois de forma sensacionalista ou que distorçam a realidade.
- PROIBIDO: usar depoimentos de pacientes como forma de publicidade.
- PROIBIDO: títulos e especialidades não reconhecidos pelo CFM.
- PERMITIDO: informar nome, CRM, especialidade reconhecida, endereço e telefone.
- PERMITIDO: conteúdo educativo sobre saúde, prevenção e procedimentos médicos em geral.
- PERMITIDO: imagens ilustrativas sem sensacionalismo.
- OBRIGATÓRIO: incluir o número do CRM no material publicitário.
`,
  CRO: `
Conselho Regional de Odontologia (CRO) — Resolução CFO 118/2012 e atualizações:
- PROIBIDO: garantir resultados estéticos ou funcionais de tratamentos odontológicos.
- PROIBIDO: usar termos como "especialista" sem título reconhecido pelo CFO.
- PROIBIDO: divulgar preços ou promoções que induzam à escolha por fatores econômicos.
- PROIBIDO: comparar qualidade de serviços com outros profissionais.
- PROIBIDO: afirmações sensacionalistas sobre resultados.
- PERMITIDO: antes/depois com representação fiel e autorização do paciente.
- PERMITIDO: conteúdo educativo sobre saúde bucal.
- OBRIGATÓRIO: incluir o número do CRO no material.
`,
  CFBio: `
Conselho Federal de Biomedicina (CFBio) — Resolução CFBio 280/2019:
- PROIBIDO: anunciar procedimentos fora do escopo da biomedicina estética.
- PROIBIDO: garantir resultados de procedimentos estéticos.
- PROIBIDO: anunciar como médico ou usar terminologia exclusiva da medicina.
- PERMITIDO: procedimentos estéticos dentro do escopo: preenchimentos, fios, toxina botulínica, lasers (conforme habilitação).
- OBRIGATÓRIO: deixar claro que é biomédico(a) e incluir número do CFBio.
- ATENÇÃO: alguns procedimentos têm disputa de escopo com o CFM; evitar linguagem médica.
`,
  COREN: `
Conselho Regional de Enfermagem (COREN):
- PROIBIDO: anunciar procedimentos fora do escopo de enfermagem estética.
- PROIBIDO: garantir resultados.
- PROIBIDO: usar terminologia exclusiva de médicos.
- PERMITIDO: procedimentos estéticos de enfermagem habilitados: limpeza de pele, peelings superficiais, laser de baixa intensidade, crioterapia, aplicação de substâncias conforme protocolos.
- OBRIGATÓRIO: incluir número do COREN e deixar claro que é enfermeiro(a).
`,
  CRN: `
Conselho Regional de Nutrição (CRN):
- PROIBIDO: prometer cura de doenças por meio de dieta.
- PROIBIDO: garantir perda de peso em tempo determinado.
- PROIBIDO: recomendar suplementos sem avaliação individualizada.
- PROIBIDO: associar alimentos à cura ou tratamento de patologias sem base científica.
- PERMITIDO: conteúdo educativo sobre alimentação saudável.
- PERMITIDO: informar sobre consultas e acompanhamento nutricional.
- OBRIGATÓRIO: número do CRN no material.
`,
  CRP: `
Conselho Regional de Psicologia (CRP) — Resolução CFP 11/2012 e Código de Ética:
- PROIBIDO: usar depoimentos de pacientes/clientes.
- PROIBIDO: anunciar técnicas psicológicas como superiores a outras.
- PROIBIDO: prometer resultados terapêuticos específicos.
- PROIBIDO: divulgar informações que violem o sigilo profissional.
- PROIBIDO: anunciar diagnósticos ou laudos em conteúdo público.
- PERMITIDO: conteúdo psicoeducativo sem identificar pacientes.
- PERMITIDO: informar especialidades e abordagens de forma neutra.
- OBRIGATÓRIO: número do CRP no material.
`,
  CREFITO: `
Conselho Regional de Fisioterapia e Terapia Ocupacional (CREFITO):
- PROIBIDO: garantir resultados de procedimentos fisioterapêuticos.
- PROIBIDO: anunciar procedimentos fora do escopo (cirurgias, diagnósticos médicos).
- PROIBIDO: usar títulos não reconhecidos pelo COFFITO.
- PERMITIDO: fisioterapia dermato-funcional, drenagem linfática, RPG, pilates clínico, entre outros habilitados.
- PERMITIDO: conteúdo educativo sobre saúde, postura e reabilitação.
- OBRIGATÓRIO: número do CREFITO no material.
`,
};

// ─── Helpers de prompt ────────────────────────────────────────────────────────

function systemPrompt(conselho: string): string {
  const regras = REGRAS[conselho] ?? '';
  return `Você é um especialista em marketing para saúde no Brasil, com profundo conhecimento nas regulamentações éticas dos conselhos profissionais de saúde. Sua função é ajudar profissionais da saúde a criar posts para redes sociais que estejam 100% em conformidade com as normas do seu conselho.

REGRAS ESPECÍFICAS PARA ${conselho}:
${regras}

DIRETRIZES GERAIS DE LINGUAGEM:
- Linguagem humanizada, próxima e profissional.
- Evitar jargão médico excessivo quando o público é leigo.
- Para Instagram/TikTok: tom mais leve, emojis moderados, CTAs claros.
- Para LinkedIn: tom mais formal e técnico.
- Sempre priorizar a segurança do paciente e a ética profissional.

Responda SEMPRE em português brasileiro.`;
}

function analyzePrompt(post: string, conselho: string, redeSocial: string): string {
  return `Analise o seguinte post para ${redeSocial} de um(a) profissional com registro no ${conselho}:

---
${post}
---

Forneça sua análise EXATAMENTE neste formato JSON (sem markdown, sem explicações fora do JSON):

{
  "correto": ["item 1", "item 2"],
  "ajustar": ["item 1 com explicação do ajuste", "item 2"],
  "proibido": ["item 1 com referência à norma", "item 2"],
  "versaoCorrigida": "versão completa e corrigida do post aqui"
}

Se não houver itens em alguma categoria, use array vazio [].
A "versaoCorrigida" deve ser o post completo, pronto para publicar no ${redeSocial}, respeitando todas as normas do ${conselho}.`;
}

function generatePrompt(descricao: string, conselho: string, redeSocial: string): string {
  return `Crie um post para ${redeSocial} para um(a) profissional com registro no ${conselho} com base na seguinte descrição do serviço/conteúdo:

---
${descricao}
---

Forneça o resultado EXATAMENTE neste formato JSON (sem markdown, sem explicações fora do JSON):

{
  "postGerado": "post completo aqui, otimizado para ${redeSocial}",
  "observacoes": ["observação 1 sobre o post", "observação 2"],
  "correto": [],
  "ajustar": [],
  "proibido": [],
  "versaoCorrigida": ""
}

O post deve:
- Estar 100% em conformidade com as normas do ${conselho}.
- Ser otimizado para o formato do ${redeSocial} (tamanho, hashtags, emojis se adequado).
- Incluir call-to-action (CTA) adequado.
- Ser atraente e humano, não genérico.`;
}

function parseResponse(text: string): Record<string, unknown> {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
  }
  // Fallback: return raw text as versaoCorrigida
  return {
    correto: [],
    ajustar: [],
    proibido: [],
    versaoCorrigida: text,
    postGerado: text,
    observacoes: [],
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function GET() {
  return Response.json({ hasEnvKey: !!process.env.ANTHROPIC_API_KEY });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    mode: 'analisar' | 'gerar';
    conselho: string;
    redeSocial: string;
    conteudo: string;
    apiKey?: string;
  };

  const { mode, conselho, redeSocial, conteudo, apiKey } = body;

  const key = process.env.ANTHROPIC_API_KEY || apiKey;
  if (!key) {
    return Response.json({ error: 'Chave da API não configurada.' }, { status: 401 });
  }
  if (!conteudo?.trim()) {
    return Response.json({ error: 'Conteúdo não informado.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: key });

  const userMessage = mode === 'analisar'
    ? analyzePrompt(conteudo, conselho, redeSocial)
    : generatePrompt(conteudo, conselho, redeSocial);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt(conselho),
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseResponse(text);
    return Response.json({ ...parsed, mode });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return Response.json({ error: msg }, { status: 500 });
  }
}
