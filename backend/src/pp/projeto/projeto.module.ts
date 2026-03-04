import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UploadModule } from 'src/upload/upload.module';
import { PessoaPrivilegioModule } from '../../auth/pessoaPrivilegio.module';
import { BlocoNotaModule } from '../../bloco-nota/bloco-nota/bloco-nota.module';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';
import { MetaModule } from '../../meta/meta.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { EquipamentoModule } from '../equipamento/equipamento.module';
import { GrupoTematicoModule } from '../grupo-tematico/grupo-tematico.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { TarefaModule } from '../tarefa/tarefa.module';
import { TipoIntervencaoModule } from '../tipo-intervencao/tipo-intervencao.module';
import { ProjetoController, ProjetoMDOController } from './projeto.controller';
import {
    ProjetoMDOProxyPdmMetasController,
    ProjetoProxyPdmMetasController,
} from './projeto.proxy-pdm-metas.controller';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';
import { ProjetoSeiService } from './projeto.sei.service';
import { ProjetoService } from './projeto.service';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => GeoLocModule),
        forwardRef(() => MetaModule),
        UploadModule,
        forwardRef(() => PortfolioModule),
        BlocoNotaModule,
        forwardRef(() => TarefaModule),
        EquipamentoModule,
        GrupoTematicoModule,
        TipoIntervencaoModule,
        PessoaPrivilegioModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [
        ProjetoController,
        ProjetoProxyPdmMetasController,
        ProjetoMDOProxyPdmMetasController,
        ProjetoMDOController,
    ],
    providers: [ProjetoService, ProjetoProxyPdmMetasService, ProjetoSeiService],
    exports: [ProjetoService],
})
export class ProjetoModule {}
