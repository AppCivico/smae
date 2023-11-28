const flatten = (data, childPropertyName = 'children') => data.reduce(
  (acc, cur) => (cur[childPropertyName]?.length
    ? acc.concat([{ ...cur, [childPropertyName]: undefined }], flatten(cur[childPropertyName]))
    : acc.concat([{ ...cur, [childPropertyName]: undefined }])),
  [],
);

export default flatten;
