import {
    Controller,
    Post,
    Body,
    Get,
    Patch,
    Param,
    Delete,
    Query,
    NotFoundException,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { WikiLinkService } from './wiki-link.service';
import { WikiLinkDto } from './dto/wiki-link.dto';
import { CreateWikiLinkDto } from './dto/create-wiki-link.dto';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { ListWikiLinkDto } from './dto/list-wiki-link.dto';
import { WikiUrlDto } from './dto/wiki-url.dto';
import { UpdateWikiLinkDto } from './dto/update-wiki-link.dto';
import { FindOneParams } from './dto/find-one-params.dto';

@ApiTags('WikiLink')
@Controller('wiki-link')
export class WikiLinkController {
    constructor(private readonly wikiLinkService: WikiLinkService) {}

    @Post()
    @ApiBearerAuth('access-token')
    async create(@Body() dto: CreateWikiLinkDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return this.wikiLinkService.create(dto, user);
    }

    @Get('url')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Obter link da Wiki para a tela atual' })
    @ApiQuery({ name: 'url', type: String, description: 'Chave da tela do SMAE (ex: /projetos/cadastro)' })
    @ApiResponse({
        status: 200,
        description: 'URL da Wiki',
        schema: { example: { url_wiki: 'https://wiki.fgv.br/smae/projetos-cadastro' } },
    })
    @ApiResponse({ status: 404, description: 'Registro de Wiki não encontrado' })
    async findByUrl(@Query() dto: WikiLinkDto): Promise<WikiUrlDto> {
        const wikiLink = await this.wikiLinkService.findByUrl(dto.url);
        if (!wikiLink) {
            throw new NotFoundException('Registro de Wiki não encontrado');
        }
        return wikiLink;
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Listar todas as url ativas da Wiki' })
    async findAll(): Promise<ListWikiLinkDto[]> {
        return this.wikiLinkService.findAll();
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Atualizar parcialmente vínculo da Wiki' })
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateWikiLinkDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return this.wikiLinkService.update(params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.wikiLinkService.remove(params.id, user);
        return '';
    }
}
