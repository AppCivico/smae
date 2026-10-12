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
import { PipeJsonLinesToResponse } from '../../common/helpers/Streaming';

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
        PipeJsonLinesToResponse(this.projetos.streamProjetos(dto, user), res);
    }
}

