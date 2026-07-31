import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IpAddress } from '../common/decorators/current-ip';
import { CurrentUser } from './decorators/current-user.decorator';
import { IsPublic } from './decorators/is-public.decorator';
import { Roles } from './decorators/roles.decorator';
import { ImpersonacaoService } from './impersonacao.service';
import { AccessToken } from './models/AccessToken';
import { CriarImpersonacaoDto, ImpersonacaoCriadaDto, LoginPorTokenDto } from './models/Impersonacao.dto';
import { PessoaFromJwt } from './models/PessoaFromJwt';

// O rate limit global (1500/min) é alto demais para um endpoint que troca token por sessão,
// e a chave dele é o IP, que o cliente consegue forjar via X-Client-IP. Apertamos aqui, mas
// quem de fato protege é o token: 32 bytes aleatórios, uso único, 120s de validade.
const THROTTLE_IMPERSONACAO = { default: { limit: 10, ttl: 60 * 1000 }, burst: { limit: 2, ttl: 1000 } };

@Controller()
export class ImpersonacaoController {
    constructor(private readonly impersonacaoService: ImpersonacaoService) {}

    @ApiTags('Impersonação')
    @Post('impersonacao')
    @HttpCode(HttpStatus.OK)
    @Roles(['SMAE.sysadmin'], 'Cria um token de uso único para logar como outra pessoa')
    @Throttle(THROTTLE_IMPERSONACAO)
    @ApiOkResponse({ type: ImpersonacaoCriadaDto })
    async criar(
        @Body() dto: CriarImpersonacaoDto,
        @CurrentUser() user: PessoaFromJwt,
        @IpAddress() ipAddress: string
    ): Promise<ImpersonacaoCriadaDto> {
        return await this.impersonacaoService.criarToken(dto, user, ipAddress);
    }

    // Público de propósito: do ponto de vista do frontend isto é só um "login por token",
    // sem nenhuma noção de personificação. Quem apresenta um token válido recebe a sessão.
    @ApiTags('Público')
    @Post('login-por-token')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @Throttle(THROTTLE_IMPERSONACAO)
    @ApiOkResponse({ type: AccessToken })
    async loginPorToken(@Body() dto: LoginPorTokenDto, @IpAddress() ipAddress: string): Promise<AccessToken> {
        return await this.impersonacaoService.loginPorToken(dto.token, ipAddress);
    }
}
