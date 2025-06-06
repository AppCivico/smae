import { Module } from '@nestjs/common';
import { PessoaModule } from '../pessoa/pessoa.module';
import { MinhaContaController } from './minha-conta.controller';
import { TransfereGovApiModule } from '../transfere-gov-api/transfere-gov-api.module';

@Module({
    controllers: [MinhaContaController],
    imports: [PessoaModule,TransfereGovApiModule],
})
export class MinhaContaModule {}
