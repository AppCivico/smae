import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilDeAcessoLinhaDto } from './models/PerfilDeAcesso.dto';
import { FilterPrivDto, RetornoListaPrivDto } from './models/Privilegios.dto';
import { PrivService } from './priv.service';

@ApiTags('Privilégios')
@Controller()
export class PrivController {
    constructor(private readonly authService: PrivService) {}

    @Get('perfil-de-acesso')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ type: PerfilDeAcessoLinhaDto, description: 'Retorna todos os perfis de acesso do sistema' })
    async perfilDeAcesso(@Query() filter: FilterPrivDto): Promise<PerfilDeAcessoLinhaDto> {
        return {
            linhas: await this.authService.listaPerfilAcesso(filter),
        };
    }

    @Get('privilegio')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({ type: RetornoListaPrivDto, description: 'Retorna todos os privilégios do sistema' })
    async listaPrivilegios(@Query() filter: FilterPrivDto): Promise<RetornoListaPrivDto> {
        return this.authService.listaPrivilegios(filter);
    }
}
