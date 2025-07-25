import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiExtraModels, ApiProduces, refs } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateRelProjetosDto } from './dto/create-projetos.dto';
import { PPProjetosRelatorioDto } from './entities/projetos.entity';
import { PPProjetosStreamingDto } from './dto/streaming-projetos.dto';
import { PPProjetosService } from './pp-projetos.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JsonStringifyTransformStream } from '../../auth/pipe/JsonStringifyTransformStream.pipe';

@ApiTags('Relatórios - API')
@Controller('relatorio/projetos')
export class PPProjetosController {
    constructor(private readonly projetos: PPProjetosService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    async create(
        @Body() createProjetosDto: CreateRelProjetosDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PPProjetosRelatorioDto> {
        return await this.projetos.asJSON(createProjetosDto, user);
    }

    @Post('/stream-projetos')
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.MDO'])
    @ApiOkResponse({
        content: {
            'application/jsonlines+json': {
                schema: {
                    oneOf: refs(PPProjetosStreamingDto),
                },
            },
        },
    })
    @ApiExtraModels(PPProjetosStreamingDto)
    @ApiProduces('application/jsonlines+json')
    streamProjetos(
        @Body() dto: CreateRelProjetosDto,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: ExpressResponse
    ) {
        res.setHeader('Content-Type', 'application/jsonlines+json');
        res.writeHead(200);
        res.flushHeaders();

        const stream = this.projetos.streamProjetos(dto, user).on('error', this.processError(res));
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

