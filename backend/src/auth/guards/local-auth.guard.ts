import {
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {

    // apenas repassa o contexto da request pra frente
    canActivate(context: ExecutionContext) {
        console.log('LocalAuthGuard.canActivate')
        return super.canActivate(context);
    }

    // aqui da para tratar os retorno de erro customizado
    handleRequest(err: any, user: any) {
        console.log(err, user)
        if (err || !user) {
            throw new UnauthorizedException(err?.message);
        }

        return user;
    }
}