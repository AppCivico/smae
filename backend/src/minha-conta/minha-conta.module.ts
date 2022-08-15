import { Module } from '@nestjs/common';
import { MinhaContaController } from './minha-conta.controller';

@Module({
  controllers: [MinhaContaController]
})
export class MinhaContaModule {}
