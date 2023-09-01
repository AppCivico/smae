import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MetaModule } from '../meta/meta.module';
import { ProjetoModule } from '../pp/projeto/projeto.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
    imports: [PrismaModule, forwardRef(() => ProjetoModule), forwardRef(() => MetaModule)],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
