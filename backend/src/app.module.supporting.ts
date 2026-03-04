import { Module } from '@nestjs/common';
import { AtualizacaoEmLoteModule } from './atualizacao-em-lote/atualizacao-em-lote.module';
import { AvisoEmailModule } from './aviso-email/aviso-email.module';
import { BancadaModule } from './bancada/bancada.module';
import { BlocoNotasModule } from './bloco-nota/bloco-notas.module';
import { BuscaGlobalModule } from './busca-global/busca-global.module';
import { CategoriaAssuntoVariavelModule } from './categoria-assunto-variavel/categoria-assunto-variavel.module';
import { CTPConfigModule } from './cronograma-termino-planejado-config/ctp-config.module';
import { EleicaoModule } from './eleicao/eleicao.module';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { PartidoModule } from './partido/partido.module';
import { ParlamentarModule } from './parlamentar/parlamentar.modules';
import { PortfolioTagModule } from './pp/portfolio-tag/portfolio-tag.module';
import { SyncCadastroBasicoModule } from './sync-cadastro-basico/sync-cadastro-basico.module';
import { TermoEncerramentoModule } from './pp/termo-encerramento/termo-encerramento.module';
import { TipoEncerramentoModule } from './projeto-tipo-encerramento/tipo-encerramento.module';
import { ClassificacaoModule } from './transferencias-voluntarias/classificacao/classificacao.module';
import { WikiLinkModule } from './wiki-link/wiki-link.module';
import { DashboardModule } from './dashboard/dashboard.module';

/**
 * Supporting modules aggregation
 * Consolidates supporting/auxiliary feature modules that don't fit into other groups:
 * - User account management (MinhaConta)
 * - Notifications (AvisoEmail)
 * - Notes (BlocoNotas)
 * - Parliamentary data (Bancada, Partido, Parlamentar)
 * - Configuration modules
 * - Search (BuscaGlobal)
 * - Sync and utilities
 */
@Module({
    imports: [
        MinhaContaModule,
        AvisoEmailModule,
        BlocoNotasModule,
        BancadaModule,
        PartidoModule,
        ParlamentarModule,
        EleicaoModule,
        CTPConfigModule,
        TipoEncerramentoModule,
        TermoEncerramentoModule,
        CategoriaAssuntoVariavelModule,
        SyncCadastroBasicoModule,
        BuscaGlobalModule,
        AtualizacaoEmLoteModule,
        WikiLinkModule,
        ClassificacaoModule,
        PortfolioTagModule,
        DashboardModule
    ],
})
export class AppModuleSupporting {}
