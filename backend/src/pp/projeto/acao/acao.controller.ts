import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { AcaoService } from './acao.service';
import { CreateAcaoDto } from './dto/acao.dto';

@ApiTags('Projeto')
@Controller('projeto-acao')
export class AcaoController {
    constructor(private readonly acaoService: AcaoService) {}

    @Patch()
    @ApiBearerAuth('access-token')
    @Roles([
        'Projeto.administrador',
        'Projeto.administrador_no_orgao',
        'SMAE.gestor_de_projeto',
        'SMAE.colaborador_de_projeto',
    ])
    @ApiResponse({ description: 'sucesso ao executar ação', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async create(@Body() dto: CreateAcaoDto, @CurrentUser() user: PessoaFromJwt) {
        await this.acaoService.create('PP', dto, user);

        return '';
    }
}

@ApiTags('Projeto MDO')
@Controller('projeto-acao-mdo')
export class AcaoMDOController {
    constructor(private readonly acaoService: AcaoService) {}

    @Patch()
    @ApiBearerAuth('access-token')
    @Roles([
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        'MDO.gestor_de_projeto',
        'MDO.colaborador_de_projeto',
    ])
    @ApiResponse({ description: 'sucesso ao executar ação', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async create(@Body() dto: CreateAcaoDto, @CurrentUser() user: PessoaFromJwt) {
        await this.acaoService.create('MDO', dto, user);

        return '';
    }
}
