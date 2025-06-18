import { Module } from '@nestjs/common';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';
import { PessoaModule } from '../pessoa/pessoa.module';
import { MinhaContaController } from './minha-conta.controller';

@Module({
    imports: [PessoaModule, FeatureFlagModule],
    controllers: [MinhaContaController],
})
export class MinhaContaModule {}
