import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PessoaModule } from './pessoa/pessoa.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MinhaContaController } from './minha-conta/minha-conta.controller';
import { MinhaContaModule } from './minha-conta/minha-conta.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { OrgaoModule } from './orgao/orgao.module';
import { TipoOrgaoModule } from './tipo-orgao/tipo-orgao.module';
import { OdsModule } from './ods/ods.module';
import { EixoModule } from './eixo/eixo.module';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: '/public',
        }),
        PrismaModule, PessoaModule, AuthModule, MinhaContaModule, OrgaoModule, TipoOrgaoModule, OdsModule, EixoModule
    ],
    controllers: [AppController, MinhaContaController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes({
                path: '*',
                method: RequestMethod.ALL
            });
    }

}
