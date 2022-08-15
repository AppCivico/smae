import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MinhaContaController } from './minha-conta/minha-conta.controller';
import { MinhaContaModule } from './minha-conta/minha-conta.module';

@Module({
    imports: [PrismaModule, PessoaModule, AuthModule, MinhaContaModule],
    controllers: [AppController, MinhaContaController],
    providers: [AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        }
    ],
})
export class AppModule { }
