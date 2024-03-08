import { Body, Controller, Post, Res } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExtraModels,
    ApiOkResponse,
    ApiProduces,
    ApiTags,
    ApiUnauthorizedResponse,
    refs,
} from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JsonStringifyTransformStream } from '../../auth/pipe/JsonStringifyTransformStream.pipe';
import { CreateRelIndicadorDto } from './dto/create-indicadores.dto';
import { ListIndicadoresDto, RelIndicadoresDto, RelIndicadoresVariaveisDto } from './entities/indicadores.entity';
import { IndicadoresService } from './indicadores.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/indicadores')
export class IndicadoresController {
    constructor(private readonly indicadoresService: IndicadoresService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar.PDM')
    async create(@Body() dto: CreateRelIndicadorDto): Promise<ListIndicadoresDto> {
        return await this.indicadoresService.create(dto);
    }

    @Post('/stream-linhas')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar.PDM')
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
    streamLinhas(@Body() dto: CreateRelIndicadorDto, @Res() res: ExpressResponse) {
        res.setHeader('Content-Type', 'application/jsonlines+json');
        res.writeHead(200);
        res.flushHeaders();

        const stream = this.indicadoresService.streamLinhas(dto).on('error', this.processError(res));
        const transformStream = JsonStringifyTransformStream();

        stream.pipe(transformStream).pipe(res);
    }

    @Post('/stream-regioes')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Reports.executar.PDM')
    @ApiOkResponse({
        content: {
            'application/jsonlines+json': {
                schema: { oneOf: refs(RelIndicadoresVariaveisDto) },
            },
        },
    })
    @ApiExtraModels(RelIndicadoresVariaveisDto)
    @ApiProduces('application/jsonlines+json')
    streamRegioes(@Body() dto: CreateRelIndicadorDto, @Res() res: ExpressResponse) {
        res.setHeader('Content-Type', 'application/jsonlines+json');
        res.writeHead(200);
        res.flushHeaders();

        const stream = this.indicadoresService.streamRegioes(dto).on('error', this.processError(res));
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
