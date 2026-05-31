import { prisma } from './prisma';

// ─── Queries Prisma (usadas após configurar o banco) ──────────────────────────

export async function buscarClientes(query = '') {
  const q = query.trim();
  return prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: 'insensitive' } },
            { cpf: { contains: q.replace(/\D/g, '') } },
            { email: { contains: q, mode: 'insensitive' } },
            { whatsapp: { contains: q.replace(/\D/g, '') } },
          ],
        }
      : undefined,
    orderBy: { nome: 'asc' },
  });
}

export async function buscarClientePorId(id: string) {
  return prisma.cliente.findUnique({ where: { id } });
}
