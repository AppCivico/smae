export type ReadOnlyBooleanType<T extends boolean> = T extends true ? 'ReadOnly' : 'ReadWrite';
