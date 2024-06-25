import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaController } from './pessoa.controller';
import { PessoaService } from './pessoa.service';
import { PessoaResponsabilidadesMetaService } from './pessoa.responsabilidades.metas.service';
import { PessoaPrivilegioModule } from '../auth/pessoaPrivilegio.module';

@Module({
    imports: [PrismaModule, PessoaPrivilegioModule],
    controllers: [PessoaController],
    providers: [PessoaService, PessoaResponsabilidadesMetaService],
    exports: [PessoaService],
})
export class PessoaModule {}
