type IdPropertyName = string;
type ParentPropertyName = string;
type ChildrenPropertyName = string;
type Options = {
  parentPropertyName?: ParentPropertyName;
  childrenPropertyName?: ChildrenPropertyName;
  idPropertyName?: IdPropertyName;
};

type DataSetItem = Record<string, unknown> & {
  [key: IdPropertyName | ParentPropertyName]: string | number;
};

export type DataTreeItem = DataSetItem & {
  [key: ChildrenPropertyName]: DataTreeItem[];
};

type HashTable = {
  [key: string | number]: DataTreeItem;
};

export type DataSet = DataSetItem[];
export type DataTree = DataTreeItem[];

/**
 * Build tree array from flat array in javascript
 *
 * @link https://stackoverflow.com/a/40732240/15425845
 */
export default (dataset: DataSet, {
  parentPropertyName = 'parentId',
  childrenPropertyName = 'children',
  idPropertyName = 'id',
}:Options = {}) => {
  const hashTable:HashTable = Object.create({});

  if (!dataset.length) {
    return [];
  }

  dataset.forEach((dataItem: DataSetItem) => {
    if (dataItem[idPropertyName] !== undefined) {
      hashTable[dataItem[idPropertyName]] = {
        ...dataItem,
        [childrenPropertyName]: [],
      } as DataTreeItem;
    }
  });

  const dataTree: DataTree = [];
  dataset.forEach((dataItem: DataSetItem) => {
    if (
      dataItem[parentPropertyName] !== undefined
      && hashTable[dataItem[parentPropertyName]]
      && dataItem[idPropertyName] !== undefined
    ) {
      hashTable[dataItem[parentPropertyName]][childrenPropertyName]
        .push(hashTable[dataItem[idPropertyName]]);
    } else if (hashTable[dataItem[idPropertyName]]) {
      dataTree.push(hashTable[dataItem[idPropertyName]]);
    } else {
      dataTree.push({ ...dataItem, [childrenPropertyName]: [] } as DataTreeItem);
    }
  });
  return dataTree;
};
