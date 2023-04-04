const flatten = (data) => data.reduce(
  (acc, cur) => (cur.children?.length
    ? acc.concat([{ ...cur, children: undefined }], flatten(cur.children))
    : acc.concat([{ ...cur, children: undefined }])),
  [],
);

export default flatten;
