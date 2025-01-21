import { Module, forwardRef } from '@nestjs/common';
import { PessoaPrivilegioModule } from '../auth/pessoaPrivilegio.module';
import { MacroTemaModule } from '../macro-tema/macro-tema.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubTemaModule } from '../subtema/subtema.module';
import { TagModule } from '../tag/tag.module';
import { TemaModule } from '../tema/tema.module';
import { UploadModule } from '../upload/upload.module';
import { VariavelModule } from '../variavel/variavel.module';
import { PdmController, PlanoSetorialController } from './pdm.controller';
import { PdmService } from './pdm.service';
import { EquipeRespModule } from '../equipe-resp/equipe-resp.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => SubTemaModule),
        forwardRef(() => MacroTemaModule),
        forwardRef(() => TagModule),
        forwardRef(() => TemaModule),
        forwardRef(() => VariavelModule),
        forwardRef(() => UploadModule),
        forwardRef(() => PessoaPrivilegioModule),
        forwardRef(() => EquipeRespModule),
    ],
    controllers: [PdmController, PlanoSetorialController],
    providers: [PdmService],
    exports: [PdmService],
})
export class PdmModule {}
