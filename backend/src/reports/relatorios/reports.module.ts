import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrcamentoModule } from '../orcamento/orcamento.module';
import { UploadModule } from 'src/upload/upload.module';
import { JwtModule } from '@nestjs/jwt';
import { IndicadoresModule } from '../indicadores/indicadores.module';
import { PaineisModule } from '../paineis/paineis.module';

@Module({
    imports: [
        PrismaModule,
        OrcamentoModule,
        UploadModule,
        IndicadoresModule,
        PaineisModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [ReportsController],
    providers: [ReportsService]
})
export class ReportsModule { }
