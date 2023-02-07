import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { AcaoService } from './acao.service';
import { CreateAcaoDto } from './dto/acao.dto';

@ApiTags('Projeto')
@Controller('projeto/acao')
export class AcaoController {
    constructor(private readonly acaoService: AcaoService) { }

    @Patch()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    @ApiResponse({ description: 'sucesso ao executar ação', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async create(@Body() dto: CreateAcaoDto, @CurrentUser() user: PessoaFromJwt) {
        await this.acaoService.create(dto, user);

        return '';
    }

}
