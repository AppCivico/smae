import { Module, forwardRef } from '@nestjs/common';
import { UploadModule } from 'src/upload/upload.module';
import { MetaModule } from '../../meta/meta.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { ProjetoController, ProjetoMDOController } from './projeto.controller';
import {
    ProjetoMDOProxyPdmMetasController,
    ProjetoProxyPdmMetasController,
} from './projeto.proxy-pdm-metas.controller';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';
import { ProjetoSeiService } from './projeto.sei.service';
import { ProjetoService } from './projeto.service';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';
import { BlocoNotaModule } from '../../bloco-nota/bloco-nota/bloco-nota.module';
import { TarefaModule } from '../tarefa/tarefa.module';
import { EquipamentoModule } from '../equipamento/equipamento.module';
import { GrupoTematicoModule } from '../grupo-tematico/grupo-tematico.module';
import { TipoIntervencaoModule } from '../tipo-intervencao/tipo-intervencao.module';
import { PessoaPrivilegioModule } from '../../auth/pessoaPrivilegio.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        GeoLocModule,
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
