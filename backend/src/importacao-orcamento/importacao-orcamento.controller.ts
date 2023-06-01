import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { ImportacaoOrcamentoService } from './importacao-orcamento.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListImportacaoOrcamentoDto } from './entities/importacao-orcamento.entity';

@Controller('importacao-orcamento')
@ApiTags('Importação')
export class ImportacaoOrcamentoController {
    constructor(private readonly importacaoOrcamentoService: ImportacaoOrcamentoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'Projeto.orcamento')
    async create(@Body() dto: CreateImportacaoOrcamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return this.importacaoOrcamentoService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'Projeto.orcamento')
    async findAll(@Query() filters: FilterImportacaoOrcamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListImportacaoOrcamentoDto> {
        return {
            linhas: await this.importacaoOrcamentoService.findAll(filters, user)
        };
    }


}
