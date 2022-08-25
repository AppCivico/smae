import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Request,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiDefaultResponse, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiProperty, ApiResponse, ApiTags, ApiUnauthorizedResponse, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';
import { AuthService } from './auth.service';
import { IsPublic } from './decorators/is-public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthRequest } from './models/AuthRequest';
import { AccessToken } from './models/AccessToken';
import { LoginRequestBody } from 'src/auth/models/LoginRequestBody.dto';
import { ReducedAccessToken } from 'src/auth/models/ReducedAccessToken';
import { EscreverNovaSenhaRequestBody } from 'src/auth/models/EscreverNovaSenhaRequestBody.dto';
import { SolicitarNovaSenhaRequestBody } from 'src/auth/models/SolicitarNovaSenhaRequestBody.dto';
import { AuthRequestLogin } from 'src/auth/models/AuthRequestLogin';
import { PerfilDeAcessoLinhaDto } from 'src/auth/models/PerfilDeAcesso.dto';

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @ApiTags('publico')
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @UseGuards(LocalAuthGuard)
    @ApiBody({ type: LoginRequestBody })
    @ApiExtraModels(AccessToken, ReducedAccessToken)
    @ApiOkResponse({
        schema: { anyOf: refs(AccessToken, ReducedAccessToken) },
    })
    async login(@Request() req: AuthRequestLogin): Promise<AccessToken | ReducedAccessToken> {
        return this.authService.login(req.user);
    }

    @ApiTags('minha-conta')
    @Post('sair')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    async logout(@CurrentUser() user: Pessoa) {
        await this.authService.logout(user);
        return ''
    }

    @ApiTags('publico')
    @Post('escrever-nova-senha')
    @HttpCode(HttpStatus.OK)
    @IsPublic()
    @ApiBody({ type: EscreverNovaSenhaRequestBody })
    async escreverNovaSenha(@Body() body: EscreverNovaSenhaRequestBody) {
        return this.authService.escreverNovaSenha(body);
    }

    @ApiTags('publico')
    @Post('solicitar-nova-senha')
    @HttpCode(HttpStatus.NO_CONTENT)
    @IsPublic()
    @ApiBody({ type: SolicitarNovaSenhaRequestBody })
    async solicitaNovaSenha(@Body() body: SolicitarNovaSenhaRequestBody) {
        await this.authService.solicitarNovaSenha(body);
        return '';
    }

    @ApiTags('default')
    @Get('perfil-de-acesso')
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: PerfilDeAcessoLinhaDto, description: 'Retorna todos os perfis de acesso do sistema' })
    async perfilDeAcesso(): Promise<PerfilDeAcessoLinhaDto> {
        return {
            linhas: await this.authService.listaPerfilAcesso()
        };
    }

}
