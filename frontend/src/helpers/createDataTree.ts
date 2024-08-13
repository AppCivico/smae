/**
 * Build tree array from flat array in javascript
 *
 * @param {*} dataset
 * @param {string} [parentPropertyName='parentId']
 * @param {string} [childrenPropertyName='children']
 * @return {*}
 * @link https://stackoverflow.com/a/40732240/15425845
 */
export default (dataset: any[], parentPropertyName = 'parentId', childrenPropertyName = 'children') => {
  const hashTable = Object.create(null);
  dataset.forEach((aData: { id: string | number }) => {
    hashTable[aData.id] = { ...aData, [childrenPropertyName]: [] };
  });

  const dataTree: any[] = [];
  dataset.forEach((aData: { [x: string]: any; id: string | number }) => {
    if (aData[parentPropertyName] && hashTable[aData[parentPropertyName]]) {
      hashTable[aData[parentPropertyName]][childrenPropertyName].push(hashTable[aData.id]);
    } else {
      dataTree.push(hashTable[aData.id]);
    }
  });
  return dataTree;
};
