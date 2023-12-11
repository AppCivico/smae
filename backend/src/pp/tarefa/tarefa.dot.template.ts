import { Injectable } from '@nestjs/common';
import { SplitString } from 'src/common/SplitString';

interface Row {
    id: number;
    tarefa: string;
    nivel: number;
    tarefa_pai_id: number | null;
    numero: number;
}

type TarefaRows = Row[];

function escapeDotLabel(inputString: string): string {
    const escapeCharacters: { [key: string]: string } = {
        '\\': '\\\\',
        '"': '\\"',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
        '{': '\\{',
        '}': '\\}',
        '<': '\\<',
        '>': '\\>',
        '|': '\\|',
    };

    // usando regexp, sorry, vim do perl!
    const escapeRegex = /([\\\"\n\r\t\{\}<>|])/g;

    return inputString.replace(escapeRegex, (match: string) => {
        return escapeCharacters[match] || match;
    });
}

@Injectable()
export class TarefaDotTemplate {
    _generateNode(id: number, label: string, fillColor: string, fontcolor: string, color: string, fontname: string) {
        return `node${id} [label="${escapeDotLabel(
            label
        )}", fillcolor="${fillColor}", fontcolor="${fontcolor}", color="${color}", style="rounded,filled", fontname="${fontname}"]`;
    }

    _createEdge(fromId: string, toId: string) {
        return `node${fromId} -> node${toId}`;
    }

    _getLevel1Nodes(rows: TarefaRows) {
        return rows.filter((r) => r.nivel === 1);
    }

    _getLevel2Nodes(rows: TarefaRows) {
        return rows.filter((r) => r.nivel === 2);
    }

    buildGraphvizString(projetoLabel: string, rows: TarefaRows) {
        const graphvizString = `
            digraph G {
              // Set default node and edge styles
              node [shape=rectangle, style=filled, fillcolor="#ffffff", fontname="Roboto", margin="0.18"];
              edge [color="#00000010", fontname="Roboto", arrowhead="none"];

              splines="polyline";
              nodesep=0.5;           // Adjust the distance between nodes within the same rank

              // Set layout to vertical
              rankdir=TB;

              // Set distance between nodes on the same rank
              ranksep=0.2;

              nodeX [label="${escapeDotLabel(
                  projetoLabel
              )}", fillcolor="#152741" color="transparent" fontcolor="#F7C234", style="rounded,filled", fontname="Roboto Bold"]
              // Define nodes
              ${this._getLevel1Nodes(rows)
                  .map((row) =>
                      this._generateNode(
                          row.id,
                          SplitString.splitString(row.tarefa, 20),
                          '#E3E5E8',
                          '#000000BB',
                          '#E3E5E8',
                          'Roboto Bold'
                      )
                  )
                  .join('\n')}
              ${this._getLevel2Nodes(rows)
                  .map((row) =>
                      this._generateNode(
                          row.id,
                          SplitString.splitString(row.tarefa, 20),
                          '#ffffff',
                          '#000000',
                          '#E3E5E8',
                          'Roboto'
                      )
                  )
                  .join('\n')}

              // Define edges for level 1
              ${this._getLevel1Nodes(rows)
                  .map((row) => this._createEdge('X', row.id.toString()))
                  .join('\n')}

              // Define edges for level 1 to the first row of level 2
              ${this._getLevel1Nodes(rows)
                  .flatMap((row) => {
                      const firstLevel2Row = this._getLevel2Nodes(rows).find(
                          (r2) => r2.tarefa_pai_id === row.id && r2.numero === 1
                      );
                      if (firstLevel2Row) {
                          return this._createEdge(row.id.toString(), firstLevel2Row.id.toString());
                      } else {
                          return [];
                      }
                  })
                  .join('\n')}

              // Define the edges for level 2 nodes
              ${this._getLevel2Nodes(rows)
                  .map((row) => {
                      const prevRow = this._getLevel2Nodes(rows).find(
                          (r2) => r2.tarefa_pai_id === row.tarefa_pai_id && r2.numero === row.numero - 1
                      );
                      if (prevRow) {
                          return this._createEdge(prevRow.id.toString(), row.id.toString());
                      } else {
                          return '';
                      }
                  })
                  .join('\n')}
            }
          `;

        return graphvizString;
    }
}
