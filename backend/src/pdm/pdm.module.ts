import { Module } from '@nestjs/common';
import { MacroTemaModule } from '../macro-tema/macro-tema.module';
import { TemaModule } from '../tema/tema.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubTemaModule } from '../subtema/subtema.module';
import { TagModule } from '../tag/tag.module';
import { UploadModule } from '../upload/upload.module';
import { VariavelModule } from '../variavel/variavel.module';
import { PdmController, PlanoSetorialController } from './pdm.controller';
import { PdmService } from './pdm.service';
import { PessoaPrivilegioModule } from '../auth/pessoaPrivilegio.module';

@Module({
    imports: [
        PrismaModule,
        SubTemaModule,
        MacroTemaModule,
        TagModule,
        TemaModule,
        VariavelModule,
        UploadModule,
        PessoaPrivilegioModule,
    ],
    controllers: [PdmController, PlanoSetorialController],
    providers: [PdmService],
})
export class PdmModule {}
