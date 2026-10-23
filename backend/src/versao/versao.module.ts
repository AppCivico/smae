import { Module } from '@nestjs/common';
import { VersaoController } from './versao.controller';

@Module({
    controllers: [VersaoController],
})
export class VersaoModule {}
