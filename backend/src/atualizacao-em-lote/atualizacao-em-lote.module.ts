import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AtualizacaoEmLoteController } from './atualizacao-em-lote.controller';
import { AtualizacaoEmLoteService } from './atualizacao-em-lote.service';
import { TaskModule } from '../task/task.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '1d' },
        }),
        forwardRef(() => TaskModule),
    ],
    controllers: [AtualizacaoEmLoteController],
    providers: [AtualizacaoEmLoteService],
})
export class AtualizacaoEmLoteModule {}
