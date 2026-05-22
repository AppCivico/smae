import { AsyncLocalStorage } from 'async_hooks';

export type PrismaQueryLogEntry = {
    query: string;
    params: string;
    duration: number;
    timestamp: string;
    target?: string;
};

const MAX_QUERIES_PER_REQUEST = 50;
const MAX_QUERIES_GLOBAL = 200;
const GLOBAL_RECENT_WINDOW_MS = 5_000;

export const prismaQueryAls = new AsyncLocalStorage<PrismaQueryLogEntry[]>();

// Global ring buffer as a fallback when ALS context doesn't propagate through
// the Prisma engine's N-API callback (which can happen with the library engine).
const globalRing: PrismaQueryLogEntry[] = [];

export function recordPrismaQuery(entry: PrismaQueryLogEntry): void {
    const store = prismaQueryAls.getStore();
    if (store) {
        store.push(entry);
        if (store.length > MAX_QUERIES_PER_REQUEST) store.shift();
    }
    globalRing.push(entry);
    if (globalRing.length > MAX_QUERIES_GLOBAL) globalRing.shift();
}

export function getRecentPrismaQueries(): PrismaQueryLogEntry[] {
    const store = prismaQueryAls.getStore();
    if (store && store.length > 0) return store;
    // Fallback: queries from the last few seconds, ordered oldest → newest.
    const cutoff = Date.now() - GLOBAL_RECENT_WINDOW_MS;
    return globalRing.filter((e) => Date.parse(e.timestamp) >= cutoff);
}
