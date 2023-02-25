type Sorter = (a: any, b: any) => number;

function sortNodesAndChildren(nodes: any[], comparador: Sorter | undefined) {
  if (typeof comparador === 'function') {
    nodes.sort(comparador);
  } else {
    nodes.sort();
  }

  nodes.forEach((node) => {
    if (node.children) {
      sortNodesAndChildren(node.children, comparador);
    }
  });

  return nodes;
}

export default sortNodesAndChildren;
