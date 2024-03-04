import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPessoaPayload } from '../models/JwtPessoaPayload';
import { PessoaFromJwt } from '../models/PessoaFromJwt';
import { AuthService } from './../auth.service';
import { Request } from 'express';
import { ModuloSistema } from '@prisma/client';
import { ValidateModuloSistema } from '../models/Privilegios.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            passReqToCallback: true,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SESSION_JWT_SECRET,
            audience: 'l',
        });
    }

    async validate(req: Request, payload: JwtPessoaPayload): Promise<PessoaFromJwt> {
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

        return await this.authService.pessoaJwtFromSessionId(payload.sid, validSistemas);
    }
}
