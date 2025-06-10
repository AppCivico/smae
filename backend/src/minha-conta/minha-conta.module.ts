import { Module } from '@nestjs/common';
import { PessoaModule } from '../pessoa/pessoa.module';
import { MinhaContaController } from './minha-conta.controller';

@Module({
    controllers: [MinhaContaController],
    imports: [PessoaModule],
})
export class MinhaContaModule {}
