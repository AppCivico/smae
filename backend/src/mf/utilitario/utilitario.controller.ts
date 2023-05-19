import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { AutoPreencherValorDto, EnviarParaCpDto } from './dto/utilitario.dto';
import { UtilitarioService } from './utilitario.service';


@ApiTags('Monitoramento Fisico - Metas e variáveis')
@Controller('mf/utilitario')
export class UtilitarioController {
    constructor(
        private readonly utilitarioService: UtilitarioService,
    ) { }

    @ApiBearerAuth('access-token')
    @Patch('auto-preencher')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @HttpCode(HttpStatus.NO_CONTENT)
    async auto_preencher(@Body() dto: AutoPreencherValorDto, @CurrentUser() user: PessoaFromJwt): Promise<void> {
        await this.utilitarioService.auto_preencher(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Patch('enviar-para-cp')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @HttpCode(HttpStatus.NO_CONTENT)
    async enviar_cp(@Body() dto: EnviarParaCpDto, @CurrentUser() user: PessoaFromJwt): Promise<void> {
        await this.utilitarioService.enviar_cp(dto, user);
    }

}
