import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaController } from './pessoa.controller';
import { PessoaService } from './pessoa.service';
import { PessoaResponsabilidadesMetaService } from './pessoa.responsabilidades.metas.service';
import { PessoaPrivilegioModule } from '../auth/pessoaPrivilegio.module';
import { EquipeRespModule } from '../equipe-resp/equipe-resp.module';
import { PessoaUtilsService } from './pessoa.utils.service';

@Module({
    imports: [PrismaModule, PessoaPrivilegioModule, EquipeRespModule],
    controllers: [PessoaController],
    providers: [PessoaService, PessoaResponsabilidadesMetaService, PessoaUtilsService],
    exports: [PessoaService],
})
export class PessoaModule {}
