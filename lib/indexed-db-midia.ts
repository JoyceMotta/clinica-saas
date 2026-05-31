// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TipoMidia =
  | 'foto_antes'
  | 'foto_depois'
  | 'foto_durante'
  | 'video'
  | 'exame'
  | 'documento'
  | 'outro';

export type RolePerfil = 'admin' | 'profissional' | 'recepcao';

export interface MidiaMetadata {
  id: string;
  clienteId: string;
  tipo: TipoMidia;
  dataRegistro: string;   // YYYY-MM-DD
  procedimento?: string;
  observacao?: string;
  nomeOriginal: string;
  tamanho: number;        // bytes
  mimeType: string;
  uploadadoPor: string;
  uploadadoEm: string;    // ISO
}

export interface MidiaRecord extends MidiaMetadata {
  blob: Blob;
}

// ─── Labels / Helpers ─────────────────────────────────────────────────────────

export const TIPO_LABELS: Record<TipoMidia, string> = {
  foto_antes:   'Foto Antes',
  foto_depois:  'Foto Depois',
  foto_durante: 'Foto Durante',
  video:        'Vídeo',
  exame:        'Exame',
  documento:    'Documento',
  outro:        'Outro',
};

export const ROLE_LABELS: Record<RolePerfil, string> = {
  admin:        '👑 Admin',
  profissional: '🩺 Profissional',
  recepcao:     '📋 Recepção',
};

export const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function isImagem(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}
export function isPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export function gerarId(): string {
  return `mid_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────

const DB_NAME    = 'clinica_midia_v1';
const DB_VERSION = 1;
const STORE      = 'midia';

function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('clienteId', 'clienteId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function salvarMidia(record: MidiaRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function listarMidiaCliente(clienteId: string): Promise<MidiaMetadata[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(STORE, 'readonly')
      .objectStore(STORE)
      .index('clienteId')
      .getAll(clienteId);
    req.onsuccess = () => {
      const records = (req.result ?? []) as MidiaRecord[];
      resolve(
        records.map((r): MidiaMetadata => ({
          id: r.id,
          clienteId: r.clienteId,
          tipo: r.tipo,
          dataRegistro: r.dataRegistro,
          procedimento: r.procedimento,
          observacao: r.observacao,
          nomeOriginal: r.nomeOriginal,
          tamanho: r.tamanho,
          mimeType: r.mimeType,
          uploadadoPor: r.uploadadoPor,
          uploadadoEm: r.uploadadoEm,
        })),
      );
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getBlobMidia(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    req.onsuccess = () =>
      resolve((req.result as MidiaRecord | undefined)?.blob ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deletarMidia(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function atualizarMidiaMetadata(
  id: string,
  patch: Partial<Pick<MidiaMetadata, 'tipo' | 'dataRegistro' | 'procedimento' | 'observacao'>>,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req   = store.get(id);
    req.onsuccess = () => {
      const record = req.result as MidiaRecord | undefined;
      if (!record) { reject(new Error('Mídia não encontrada')); return; }
      store.put({ ...record, ...patch });
    };
    req.onerror   = () => reject(req.error);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}
