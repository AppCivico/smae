import { Injectable } from '@nestjs/common';
import { toStream } from 'ts-graphviz/adapter';

export type GraphvizServiceFormat = 'png' | 'svg' | 'json' | 'jpg' | 'pdf' | 'xdot' | 'dot' | 'plain' | 'dot_json';

@Injectable()
export class GraphvizService {
    async generateImage(input: string, format: GraphvizServiceFormat): Promise<NodeJS.ReadableStream> {
        return await toStream(input, { format: format });
    }
}