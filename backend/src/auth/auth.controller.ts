import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiExtraModels,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
    refs
} from '@nestjs/swagger';
import { IpAddress } from '../common/decorators/current-ip';
import { Pessoa } from '../pessoa/entities/pessoa.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { IsPublic } from './decorators/is-public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AccessToken } from './models/AccessToken';
import { AuthRequestLogin } from './models/AuthRequestLogin';
import { EscreverNovaSenhaRequestBody } from './models/EscreverNovaSenhaRequestBody.dto';
import { LoginRequestBody } from './models/LoginRequestBody.dto';
import { ReducedAccessToken } from './models/ReducedAccessToken';
import { SolicitarNovaSenhaRequestBody } from './models/SolicitarNovaSenhaRequestBody.dto';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiTags('Público')
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @UseGuards(LocalAuthGuard)
    @ApiBody({ type: LoginRequestBody })
    @ApiExtraModels(AccessToken, ReducedAccessToken)
    @ApiOkResponse({
        schema: { oneOf: refs(AccessToken, ReducedAccessToken) },
    })
    async login(
        @Request() req: AuthRequestLogin,
        @IpAddress() ipAddress: string
    ): Promise<AccessToken | ReducedAccessToken> {
        return this.authService.login(req.user, ipAddress);
    }

    @ApiTags('Minha Conta')
    @Post('sair')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    async logout(@CurrentUser() user: Pessoa, @IpAddress() ipAddress: string) {
        await this.authService.logout(user, ipAddress);
        return '';
    }

    @ApiTags('Público')
    @Post('escrever-nova-senha')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @ApiBody({ type: EscreverNovaSenhaRequestBody })
    async escreverNovaSenha(@Body() body: EscreverNovaSenhaRequestBody, @IpAddress() ipAddress: string) {
        return this.authService.escreverNovaSenha(body, ipAddress);
    }

    @ApiTags('Público')
    @Post('solicitar-nova-senha')
    @HttpCode(HttpStatus.ACCEPTED)
    @IsPublic()
    @ApiBody({ type: SolicitarNovaSenhaRequestBody })
    async solicitaNovaSenha(@Body() body: SolicitarNovaSenhaRequestBody) {
        await this.authService.solicitarNovaSenha(body);
        return '';
    }
}
