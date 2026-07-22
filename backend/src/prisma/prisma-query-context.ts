import { AsyncLocalStorage } from 'async_hooks';

export type PrismaQueryLogEntry = {
    query: string;
    params: string;
    duration: number;
    timestamp: string;
    target?: string;
};

type PrismaQueryLogEntryInternal = PrismaQueryLogEntry & { seq: number };

export type PrismaQueryRequestContext = {
    // Sequência global no momento em que a requisição começou; usada como corte
    // no fallback do ring buffer quando o ALS não propaga para o callback do engine.
    startSeq: number;
    entries: PrismaQueryLogEntry[];
};

const MAX_QUERIES_PER_REQUEST = 50;
const MAX_QUERIES_GLOBAL = 200;

export const prismaQueryAls = new AsyncLocalStorage<PrismaQueryRequestContext>();

// Contador monotônico global: cada query recebe um seq crescente, permitindo
// recortar "queries a partir do início desta requisição" mesmo sem propagação do ALS.
let globalSeq = 0;

// Global ring buffer as a fallback when ALS context doesn't propagate through
// the Prisma engine's N-API callback (which can happen with the library engine).
const globalRing: PrismaQueryLogEntryInternal[] = [];

/** Sequência atual; capture no início da requisição para recortar apenas as queries dela. */
export function currentPrismaQuerySeq(): number {
    return globalSeq;
}

export function recordPrismaQuery(entry: PrismaQueryLogEntry): void {
    const store = prismaQueryAls.getStore();
    if (store) {
        store.entries.push(entry);
        if (store.entries.length > MAX_QUERIES_PER_REQUEST) store.entries.shift();
    }
    globalRing.push({ ...entry, seq: globalSeq++ });
    if (globalRing.length > MAX_QUERIES_GLOBAL) globalRing.shift();
}

export function getRecentPrismaQueries(): PrismaQueryLogEntry[] {
    const store = prismaQueryAls.getStore();
    if (store) {
        // Caso o ALS propague até o callback do engine, temos as queries exatas da requisição.
        if (store.entries.length > 0) return store.entries;
        // Fallback: apenas as queries registradas desde o início desta requisição
        // (não uma janela de tempo, que misturaria queries de outras requisições/tarefas).
        return globalRing.filter((e) => e.seq >= store.startSeq).map(stripSeq);
    }
    // Sem contexto de requisição algum: melhor esforço com todo o ring buffer.
    return globalRing.map(stripSeq);
}

function stripSeq(e: PrismaQueryLogEntryInternal): PrismaQueryLogEntry {
    const { seq: _seq, ...rest } = e;
    return rest;
}
