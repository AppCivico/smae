export interface StreamBatchHandler<T> {
    onBatch(batch: T[], batchIndex: number, totalBatches: number): Promise<void>;
    onComplete(): Promise<any>;
}

export class ArrayCollectorHandler<T> implements StreamBatchHandler<T> {
    private collected: T[] = [];

    async onBatch(batch: T[]): Promise<void> {
        this.collected.push(...batch);
    }

    async onComplete(): Promise<T[]> {
        return this.collected;
    }
}
