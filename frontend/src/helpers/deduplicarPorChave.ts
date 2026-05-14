export default <T>(
  list: T[] | null | undefined,
  key: keyof T | ((x: T) => unknown) = 'id' as keyof T,
): T[] => {
  const getKey = typeof key === 'function'
    ? key
    : (x: T) => x[key];
  return Array.from(
    list?.reduce((map, x) => map.set(getKey(x), x), new Map<unknown, T>())?.values()
      ?? [],
  );
};
