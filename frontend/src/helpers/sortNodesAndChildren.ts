type Sorter = (a: any, b: any) => number;

/**
 * Sort tree structure
 *
 * @param {any[]} nodes
 * @param {(Sorter | undefined)} comparador
 * @return {*}
 * @link https://stackoverflow.com/a/31598407/15425845
 */
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
