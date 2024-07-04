import { Module } from '@nestjs/common';
import { PessoaPrivilegioModule } from '../auth/pessoaPrivilegio.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GrupoRespVariavelController, } from './grupo-resp-variavel.controller';
import { GrupoRespVariavelService } from './grupo-resp-variavel.service';

@Module({
    imports: [PrismaModule, PessoaPrivilegioModule],
    controllers: [GrupoRespVariavelController],
    providers: [GrupoRespVariavelService],
})
export class GrupoRespVariavelModule {}
