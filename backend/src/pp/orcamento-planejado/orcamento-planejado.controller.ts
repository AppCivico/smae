import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { ProjetoService } from '../projeto/projeto.service';
import {
    CreatePPOrcamentoPlanejadoDto,
    FilterPPOrcamentoPlanejadoDto,
    ListPPOrcamentoPlanejadoDto,
    UpdatePPOrcamentoPlanejadoDto,
} from './dto/create-orcamento-planejado.dto';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';
import { RecordWithId } from '../../common/dto/record-with-id.dto';

@ApiTags('Projeto - Orçamento (Planejado)')
@Controller('projeto')
export class OrcamentoPlanejadoController {
    constructor(
        private readonly orcamentoPlanejadoService: OrcamentoPlanejadoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/orcamento-planejado')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    async create(
        @Param() params: FindOneParams,
        @Body() createMetaDto: CreatePPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura) {
            throw new HttpException('Não é possível criar o orçamento no modo apenas leitura.', 400);
        }
        return await this.orcamentoPlanejadoService.create(+params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/orcamento-planejado')
    @Roles('Projeto.orcamento')
    async findAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterPPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPPOrcamentoPlanejadoDto> {
        const projeto = await this.projetoService.findOne(+params.id, user, 'ReadOnly');

        return {
            linhas: await this.orcamentoPlanejadoService.findAll(projeto, filters, user),
        };
    }

    @Patch(':id/orcamento-planejado/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    async update(
        @Param() params: FindTwoParams,
        @Body() createMetaDto: UpdatePPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(+params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura) {
            throw new HttpException('Não é possível editar o orçamento no modo apenas leitura.', 400);
        }

        return await this.orcamentoPlanejadoService.update(+params.id, +params.id2, createMetaDto, user);
    }

    @Delete(':id/orcamento-planejado/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura) {
            throw new HttpException('Não é possível editar o orçamento no modo apenas leitura.', 400);
        }

        await this.orcamentoPlanejadoService.remove(+params.id, +params.id2, user);
        return '';
    }
}
