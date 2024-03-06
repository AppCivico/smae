import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerfilDeAcessoLinhaDto } from './models/PerfilDeAcesso.dto';
import { FilterPrivDto, RetornoListaPrivDto } from './models/Privilegios.dto';
import { PrivService } from './priv.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { PessoaFromJwt } from './models/PessoaFromJwt';

@ApiTags('Privilégios')
@Controller()
export class PrivController {
    constructor(private readonly authService: PrivService) {}

    @Get('perfil-de-acesso')
    @ApiBearerAuth('access-token')
    @HttpCode(HttpStatus.OK)
    @ApiResponse({
        type: PerfilDeAcessoLinhaDto,
        description:
            'Retorna todos os perfis de acesso do sistema (pelo header) exceto se sobre-escrito pelo parâmetro. Usuários com Privilégio CadastroPessoa.administrador retornam tudo sempre, no caso de não enviar o paramento, para conseguir editar os usuários em qualquer sistema.',
    })
    async perfilDeAcesso(
        @Query() filter: FilterPrivDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PerfilDeAcessoLinhaDto> {
        return {
            linhas: await this.authService.listaPerfilAcesso(filter, user),
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
