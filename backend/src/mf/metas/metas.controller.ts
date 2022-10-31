import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { MfService } from '../mf.service';
import { FilterMfMetaDto as ParamsMfMetaDto, ListMfMetasAgrupadasDto } from './dto/mf-meta.dto';

import { MetasService } from './metas.service';

@Controller('metas')
export class MetasController {
    constructor(
        private readonly metasService: MetasService,
        private readonly mfService: MfService
    ) { }


    @ApiBearerAuth('access-token')
    @Get('')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    async metasCronograma(
        @Query() params: ParamsMfMetaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfMetasAgrupadasDto> {

        const config = await this.mfService.pessoaAcessoPdm(user);
        const ids: number[] = [
            ...(params.via_cronograma ? config.metas_cronograma : []),
            ...(params.via_variaveis ? config.metas_variaveis : []),
        ];

        return {
            'linhas': await this.metasService.metasPorPlano({
                ids: ids,
            })
        };
    }

}
