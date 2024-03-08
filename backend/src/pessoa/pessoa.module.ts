import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoaController } from './pessoa.controller';
import { PessoaService } from './pessoa.service';
import { PessoaResponsabilidadesMetaService } from './pessoa.responsabilidades.metas.service';

@Module({
    imports: [PrismaModule],
    controllers: [PessoaController],
    providers: [PessoaService,PessoaResponsabilidadesMetaService],
    exports: [PessoaService],
})
export class PessoaModule {}
