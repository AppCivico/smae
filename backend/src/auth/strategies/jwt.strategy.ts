import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ModuloSistema } from 'src/generated/prisma/client';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { extractIpAddress } from '../../common/decorators/current-ip';
import { JwtPessoaPayload } from '../models/JwtPessoaPayload';
import { PessoaFromJwt } from '../models/PessoaFromJwt';
import { ValidateModuloSistema } from '../models/Privilegios.dto';
import { AuthService } from './../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        const secret = process.env.SESSION_JWT_SECRET;
        if (!secret) throw new Error('SESSION_JWT_SECRET environment variable is required');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            audience: 'l',
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPessoaPayload): Promise<PessoaFromJwt> {
        const validSistemas = ExtractValidSistemas(req);
        //console.log('JwtStrategy', req);

        const user = await this.authService.pessoaJwtFromSessionId(payload.sid, validSistemas);
        console.log('pessoaJwtFromSessionId' ,user);
        user.ip = extractIpAddress(req);
        return user;
    }
}

export function ExtractValidSistemas(req: Request) {
    let xSistemas = req.query['smae-sistemas'] || req.headers['smae-sistemas'];
    if (xSistemas && typeof xSistemas !== 'string') throw new BadRequestException('query smae-sistemas invalid');

    let validSistemas: ModuloSistema[] | undefined = undefined;
    if (xSistemas) {
        if (!Array.isArray(xSistemas)) xSistemas = xSistemas.split(',');

        validSistemas = [];
        for (const v of xSistemas) {
            validSistemas.push(ValidateModuloSistema(v));
        }
    }
    return validSistemas;
}
