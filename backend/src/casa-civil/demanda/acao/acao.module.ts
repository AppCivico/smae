import { forwardRef, Module } from '@nestjs/common';
import { CacheKVModule } from '../../../common/services/cache-kv.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TaskModule } from '../../../task/task.module';
import { DemandaModule } from '../demanda.module';
import { DemandaAcaoController } from './acao.controller';
import { DemandaAcaoService } from './acao.service';

@Module({
    imports: [PrismaModule, forwardRef(() => DemandaModule), CacheKVModule, forwardRef(() => TaskModule)],
    controllers: [DemandaAcaoController],
    providers: [DemandaAcaoService],
    exports: [DemandaAcaoService],
})
export class DemandaAcaoModule {}
