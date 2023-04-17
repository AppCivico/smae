import { Module } from '@nestjs/common';
import { GraphvizService } from './graphviz.service';

@Module({
  providers: [GraphvizService],
  exports: [GraphvizService],
})
export class GraphvizModule {}