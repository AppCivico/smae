import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiProduces, ApiTags, refs } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelIndicadorDto, CreateRelIndicadorRegioesDto } from './dto/create-indicadores.dto';
import { ListIndicadoresDto, RelIndicadoresDto, RelIndicadoresVariaveisDto } from './entities/indicadores.entity';
import { IndicadoresService } from './indicadores.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PipeJsonLinesToResponse } from '../../common/helpers/Streaming';

@ApiTags('Relatórios - API')
@Controller('relatorio/indicadores')
export class IndicadoresController {
    constructor(private readonly indicadoresService: IndicadoresService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PDM'])
    async create(
        @Body() dto: CreateRelIndicadorDto,
        @CurrentUser() user: PessoaFromJwt | null
    ): Promise<ListIndicadoresDto> {
        return await this.indicadoresService.asJSON(dto, user);
    }

    @Post('/stream-linhas')
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PDM'])
    @ApiOkResponse({
        content: {
            'application/jsonlines+json': {
                schema: {
                    oneOf: refs(RelIndicadoresDto),
                },
            },
        },
    })
    @ApiExtraModels(RelIndicadoresDto)
    streamLinhas(
        @Body() dto: CreateRelIndicadorDto,

        @CurrentUser() user: PessoaFromJwt | null,
        @Res() res: ExpressResponse
    ) {
        PipeJsonLinesToResponse(this.indicadoresService.streamLinhas(dto, user), res);
    }

    @Post('/stream-regioes')
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PDM'])
    @ApiOkResponse({
        content: {
            'application/jsonlines+json': {
                schema: { oneOf: refs(RelIndicadoresVariaveisDto) },
            },
        },
    })
    @ApiExtraModels(RelIndicadoresVariaveisDto)
    @ApiProduces('application/jsonlines+json')
    streamRegioes(
        @Body() dto: CreateRelIndicadorRegioesDto,
        @CurrentUser() user: PessoaFromJwt | null,
        @Res() res: ExpressResponse
    ) {
        PipeJsonLinesToResponse(this.indicadoresService.streamRegioes(dto, user), res);
    }
}
