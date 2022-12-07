import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PessoaModule } from '../pessoa/pessoa.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginValidationMiddleware } from './middlewares/login-validation.middleware';
import { EscreverNovaSenhaValidationMiddleware } from './middlewares/escrever-nova-senha-validation.middleware';
import { SolicitarNovaSenhaValidationMiddleware } from './middlewares/solicitar-nova-senha-validation.middleware';

@Module({
    imports: [
        PessoaModule,
        PassportModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET,
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy]
})

export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoginValidationMiddleware).forRoutes('login');
        consumer.apply(EscreverNovaSenhaValidationMiddleware).forRoutes('escrever-nova-senha');
        consumer.apply(SolicitarNovaSenhaValidationMiddleware).forRoutes('solicitar-nova-senha');
    }
}
