import { Module } from '@nestjs/common';
import { PessoaPrivilegioModule } from '../auth/pessoaPrivilegio.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EquipeRespController, } from './equipe-resp.controller';
import { EquipeRespService } from './equipe-resp.service';

@Module({
    imports: [PrismaModule, PessoaPrivilegioModule],
    controllers: [EquipeRespController],
    providers: [EquipeRespService],
    exports: [EquipeRespService],
})
export class EquipeRespModule {}
