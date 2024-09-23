import { Module } from '@nestjs/common';
import { ClassificacaoController } from './classificacao.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ClassificacaoService } from './classificacao.service';

@Module({
    imports: [PrismaModule,
            JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),],
    controllers: [ClassificacaoController],
    providers : [ClassificacaoService],
    exports: [ClassificacaoService],
})
export class ClassificacaoModule {}
