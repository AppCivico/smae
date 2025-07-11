import { Injectable } from '@nestjs/common';
import { toStream } from '@ts-graphviz/adapter';

export const GraphvizServiceFormat = {
    'png': 'png',
    'svg': 'svg',
    'json': 'json',
    'jpg': 'jpg',
    'pdf': 'pdf',
    'xdot': 'xdot',
    'dot': 'dot',
    'plain': 'plain',
    'dot_json': 'dot_json',
};

export type GraphvizServiceFormat = (typeof GraphvizServiceFormat)[keyof typeof GraphvizServiceFormat];

export const GraphvizContentTypeMap: Record<GraphvizServiceFormat, string> = {
    png: 'image/png',
    svg: 'image/svg+xml',
    json: 'application/json',
    jpg: 'image/jpeg',
    pdf: 'application/pdf',
    xdot: 'text/vnd.graphviz',
    dot: 'text/vnd.graphviz',
    plain: 'text/vnd.graphviz',
    dot_json: 'application/vnd.graphviz.json',
};

@Injectable()
export class GraphvizService {
    async generateImage(input: string, format: GraphvizServiceFormat): Promise<NodeJS.ReadableStream> {
        return await toStream(input, { format: format as any });
    }
}
