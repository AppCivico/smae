import { describe, expect, it } from 'vitest';
import createDataTree from './createDataTree.ts';

describe('createDataTree', () => {
  it('should create a tree structure from flat data', () => {
    const flatData = [
      { id: 0, parentId: null },
      { id: 1, parentId: 0 },
      { id: 2, parentId: 0 },
      { id: 3, parentId: 1 },
      { id: 4, parentId: 1 },
      { id: 5, parentId: null },
      { id: 6, parentId: 5 },
      { id: 7, parentId: 5 },
    ];

    const expectedTree = [
      {
        id: 0,
        parentId: null,
        children: [
          {
            id: 1,
            parentId: 0,
            children: [
              { id: 3, parentId: 1, children: [] },
              { id: 4, parentId: 1, children: [] },
            ],
          },
          { id: 2, parentId: 0, children: [] },
        ],
      },
      {
        id: 5,
        parentId: null,
        children: [
          { id: 6, parentId: 5, children: [] },
          { id: 7, parentId: 5, children: [] },
        ],
      },
    ];

    const result = createDataTree(flatData);
    expect(result).toEqual(expectedTree);
  });

  it('should create a tree structure from flat data customizing the reference properties', () => {
    const flatData = [
      { key: 1, parent: null },
      { key: 2, parent: 1 },
      { key: 3, parent: 1 },
      { key: 4, parent: 2 },
      { key: 5, parent: 2 },
    ];

    const expectedTree = [
      {
        key: 1,
        parent: null,
        nodes: [
          {
            key: 2,
            parent: 1,
            nodes: [
              { key: 4, parent: 2, nodes: [] },
              { key: 5, parent: 2, nodes: [] },
            ],
          },
          { key: 3, parent: 1, nodes: [] },
        ],
      },
    ];

    const result = createDataTree(flatData, { parentPropertyName: 'parent', childrenPropertyName: 'nodes', idPropertyName: 'key' });
    expect(result).toEqual(expectedTree);
  });

  it('should handle invalid custom properties', () => {
    const flatData = [
      { key: 1, parent: null },
      { key: 2, parent: 1 },
      { key: 3, parent: 1 },
      { key: 4, parent: 2 },
      { key: 5, parent: 2 },
      { id: 6, parentId: null },
      { id: 7, parentId: 6 },
      { id: 8, parentId: 6 },
    ];

    const expectedTree = [
      {
        key: 1,
        parent: null,
        nodes: [
          {
            key: 2,
            parent: 1,
            nodes: [
              { key: 4, parent: 2, nodes: [] },
              { key: 5, parent: 2, nodes: [] },
            ],
          },
          { key: 3, parent: 1, nodes: [] },
        ],
      },
      { id: 6, parentId: null, nodes: [] },
      { id: 7, parentId: 6, nodes: [] },
      { id: 8, parentId: 6, nodes: [] },
    ];

    const result = createDataTree(flatData, { parentPropertyName: 'parent', childrenPropertyName: 'nodes', idPropertyName: 'key' });
    expect(result).toEqual(expectedTree);
  });

  it('should return an empty array if no data is provided', () => {
    const result = createDataTree([]);
    expect(result).toEqual([]);
  });

  it('should handle data with no parent-child relationships', () => {
    const flatData = [
      { id: 1, parentId: null },
      { id: 2, parentId: null },
      { id: 3, parentId: null },
    ];

    const expectedTree = [
      { id: 1, parentId: null, children: [] },
      { id: 2, parentId: null, children: [] },
      { id: 3, parentId: null, children: [] },
    ];

    const result = createDataTree(flatData);
    expect(result).toEqual(expectedTree);
  });

  it('should handle deeply nested data', () => {
    const flatData = [
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
      { id: 3, parentId: 2 },
      { id: 4, parentId: 3 },
    ];

    const expectedTree = [
      {
        id: 1,
        parentId: null,
        children: [
          {
            id: 2,
            parentId: 1,
            children: [
              {
                id: 3,
                parentId: 2,
                children: [
                  { id: 4, parentId: 3, children: [] },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = createDataTree(flatData);
    expect(result).toEqual(expectedTree);
  });
});
