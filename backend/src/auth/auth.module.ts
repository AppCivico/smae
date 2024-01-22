import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PessoaModule } from '../pessoa/pessoa.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EscreverNovaSenhaValidationMiddleware } from './middlewares/escrever-nova-senha-validation.middleware';
import { LoginValidationMiddleware } from './middlewares/login-validation.middleware';
import { SolicitarNovaSenhaValidationMiddleware } from './middlewares/solicitar-nova-senha-validation.middleware';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { FeatureFlagModule } from '../feature-flag/feature-flag.module';

@Module({
    imports: [
        PessoaModule,
        PassportModule,
        FeatureFlagModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET,
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoginValidationMiddleware).forRoutes('login');
        consumer.apply(EscreverNovaSenhaValidationMiddleware).forRoutes('escrever-nova-senha');
        consumer.apply(SolicitarNovaSenhaValidationMiddleware).forRoutes('solicitar-nova-senha');
    }
}
