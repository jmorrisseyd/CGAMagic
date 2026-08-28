/**
 * Blob storage for pictures and sounds, backed by IndexedDB.
 *
 * localStorage tops out around 5MB and stores strings, so a dozen photos
 * as data URLs would fill it. IndexedDB stores Blobs natively and gets a
 * far larger quota, so sets keep only a mediaId and the bytes live here.
 */

const DB_NAME = "cgamagic";
const DB_VERSION = 1;
const STORE = "media";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const req = run(transaction.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export function putMedia(id: string, blob: Blob): Promise<void> {
  return tx("readwrite", (store) => store.put(blob, id)).then(() => undefined);
}

export function getMedia(id: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>("readonly", (store) => store.get(id));
}

export function deleteMedia(id: string): Promise<void> {
  return tx("readwrite", (store) => store.delete(id)).then(() => undefined);
}

export function listMediaIds(): Promise<string[]> {
  return tx<IDBValidKey[]>("readonly", (store) => store.getAllKeys()).then(
    (keys) => keys.map(String),
  );
}

/**
 * Object URLs for the same blob are cached so that re-rendering a card
 * doesn't leak a new URL every time. Cleared wholesale on revokeAllUrls().
 */
const urlCache = new Map<string, string>();

export async function getMediaUrl(id: string): Promise<string | undefined> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const blob = await getMedia(id);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export function revokeAllUrls(): void {
  for (const url of urlCache.values()) URL.revokeObjectURL(url);
  urlCache.clear();
}

/** Drops blobs no set references any more. Returns how many were removed. */
export async function pruneMedia(referencedIds: Set<string>): Promise<number> {
  const all = await listMediaIds();
  const orphans = all.filter((id) => !referencedIds.has(id));
  await Promise.all(orphans.map(deleteMedia));
  for (const id of orphans) {
    const url = urlCache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlCache.delete(id);
    }
  }
  return orphans.length;
}

/** Base64 round-trip, so media can ride along in JSON export/import files. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${blob.type};base64,${btoa(binary)}`;
}

export function base64ToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
