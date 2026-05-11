import { AsyncLocalStorage } from 'async_hooks';

export type PrismaQueryLogEntry = {
    query: string;
    params: string;
    duration: number;
    timestamp: string;
    target?: string;
};

const MAX_QUERIES_PER_REQUEST = 50;

export const prismaQueryAls = new AsyncLocalStorage<PrismaQueryLogEntry[]>();

export function recordPrismaQuery(entry: PrismaQueryLogEntry): void {
    const store = prismaQueryAls.getStore();
    if (!store) return;
    store.push(entry);
    if (store.length > MAX_QUERIES_PER_REQUEST) store.shift();
}

export function getRecentPrismaQueries(): PrismaQueryLogEntry[] {
    return prismaQueryAls.getStore() ?? [];
}
