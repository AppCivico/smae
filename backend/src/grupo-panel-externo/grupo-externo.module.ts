import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GrupoPainelExternoController } from './grupo-externo.controller';
import { GrupoPainelExternoService } from './grupo-externo.service';
import { PessoaPrivilegioModule } from '../auth/pessoaPrivilegio.module';

@Module({
    imports: [PrismaModule, PessoaPrivilegioModule],
    controllers: [GrupoPainelExternoController],
    providers: [GrupoPainelExternoService],
})
export class GrupoPainelExternoModule {}
