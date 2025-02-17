import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiProduces, ApiTags, refs } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JsonStringifyTransformStream } from '../../auth/pipe/JsonStringifyTransformStream.pipe';
import { CreateRelIndicadorDto, CreateRelIndicadorRegioesDto } from './dto/create-indicadores.dto';
import { ListIndicadoresDto, RelIndicadoresDto, RelIndicadoresVariaveisDto } from './entities/indicadores.entity';
import { IndicadoresService } from './indicadores.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';

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
        res.setHeader('Content-Type', 'application/jsonlines+json');
        res.writeHead(200);
        res.flushHeaders();

        const stream = this.indicadoresService.streamLinhas(dto, user).on('error', this.processError(res));
        const transformStream = JsonStringifyTransformStream();

        stream.pipe(transformStream).pipe(res);
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
        res.setHeader('Content-Type', 'application/jsonlines+json');
        res.writeHead(200);
        res.flushHeaders();

        const stream = this.indicadoresService.streamRegioes(dto, user).on('error', this.processError(res));
        const transformStream = JsonStringifyTransformStream();

        stream.pipe(transformStream).pipe(res);
    }

    private processError(res: ExpressResponse<any, Record<string, any>>): (err: Error) => void {
        return (err) => {
            console.log(err);
            res.write(JSON.stringify({ error: 'error occurred during stream processing' }));
            res.end();
        };
    }
}
