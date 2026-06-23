export default (obj: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(
  Object.entries(obj).filter(
    ([, valor]) => valor !== undefined && valor !== '' && valor !== null,
  ),
);
