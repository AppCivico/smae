import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';
import { PessoaModule } from '../pessoa/pessoa.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EscreverNovaSenhaValidationMiddleware } from './middlewares/escrever-nova-senha-validation.middleware';
import { LoginValidationMiddleware } from './middlewares/login-validation.middleware';
import { SolicitarNovaSenhaValidationMiddleware } from './middlewares/solicitar-nova-senha-validation.middleware';
import { PerfilAcessoController } from './perfilAcesso.controller';
import { PerfilAcessoService } from './perfilAcesso.service';
import { PrivController } from './priv.controller';
import { PrivService } from './priv.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
    imports: [
        PrismaModule,
        PessoaModule,
        PassportModule,
        FeatureFlagModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET,
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [AuthController, PrivController, PerfilAcessoController],
    providers: [AuthService, LocalStrategy, JwtStrategy, PrivService, PerfilAcessoService],
    exports: [AuthService],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoginValidationMiddleware).forRoutes('login');
        consumer.apply(EscreverNovaSenhaValidationMiddleware).forRoutes('escrever-nova-senha');
        consumer.apply(SolicitarNovaSenhaValidationMiddleware).forRoutes('solicitar-nova-senha');
    }
}
