import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { ParlamentarService } from './parlamentar.service';
import { CreateAssessorDto, CreateMandatoDto, CreateParlamentarDto, CreateMandatoBancadaDto, CreateMandatoRepresentatividadeDto, CreateMandatoSuplenteDto } from './dto/create-parlamentar.dto';
import { ListParlamentarDto, ParlamentarDetailDto } from './entities/parlamentar.entity';
import { UpdateAssessorDto, UpdateMandatoDto, UpdateParlamentarDto } from './dto/update-parlamentar.dto';
import { RemoveMandatoDepsDto } from './dto/remove-mandato-deps.dto';

@ApiTags('Parlamentar')
@Controller('parlamentar')
export class ParlamentarController {
    constructor(private readonly parlamentarService: ParlamentarService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroOrgao.inserir')
    async create(@Body() dto: CreateParlamentarDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListParlamentarDto> {
        return { linhas: await this.parlamentarService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('Projeto.administrar_portfolios', 'Projeto.administrador_no_orgao', ...PROJETO_READONLY_ROLES)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ParlamentarDetailDto> {
        return await this.parlamentarService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroOrgao.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateParlamentarDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.parlamentarService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroOrgao.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.parlamentarService.remove(+params.id, user);
        return '';
    }

    // Assessores
    @Post(':id/assessor')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async createAssessor(@Param() params: FindOneParams, @Body() dto: CreateAssessorDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.createAssessor(+params.id, dto, user);
    }

    @Patch(':id/assessor/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async updateAssessor(@Param() params: FindTwoParams, @Body() dto: UpdateAssessorDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.updateAssessor(+params.id2, dto, user);
    }

    @Delete(':id/assessor/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    // @Roles('CadastroPainel.visualizar')
    async removeAssessor(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.parlamentarService.removeAssessor(+params.id2, user);
        return '';
    }

    // Mandato
    @Post(':id/mandato')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async createMandato(@Param() params: FindOneParams, @Body() dto: CreateMandatoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.createMandato(+params.id, dto, user);
    }

    @Patch(':id/mandato/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async updateMandato(@Param() params: FindTwoParams, @Body() dto: UpdateMandatoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.updateMandato(+params.id2, dto, user);
    }

    @Delete(':id/mandato/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    // @Roles('CadastroPainel.visualizar')
    async removeMandatoo(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.parlamentarService.removeMandato(+params.id2, user);
        return '';
    }

    // Mandato - Bancada
    @Post(':id/bancada')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async createMandatoBancada(@Param() params: FindOneParams, @Body() dto: CreateMandatoBancadaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.createMandatoBancada(+params.id, dto, user);
    }

    @Delete(':id/bancada/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    // @Roles('CadastroPainel.visualizar')
    async removeMandatoBancada(@Param() params: FindTwoParams, @Body() dto: RemoveMandatoDepsDto, @CurrentUser() user: PessoaFromJwt) {
        await this.parlamentarService.removeMandatoBancada(+params.id2, dto, user);
        return '';
    }

    // Mandato - Representatividade 
    @Post(':id/representatividade')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async createRepresentatividade(@Param() params: FindOneParams, @Body() dto: CreateMandatoRepresentatividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.createMandatoRepresentatividade(+params.id, dto, user);
    }

    @Patch(':id/representatividade/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async updateRepresentatividade(@Param() params: FindTwoParams, @Body() dto: UpdateAssessorDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.updateAssessor(+params.id2, dto, user);
    }

    @Delete(':id/representatividade/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    // @Roles('CadastroPainel.visualizar')
    async removeRepresentatividade(@Param() params: FindTwoParams, @Body() dto: RemoveMandatoDepsDto, @CurrentUser() user: PessoaFromJwt) {
        await this.parlamentarService.removeMandatoBancada(+params.id2, dto, user);
        return '';
    }

    // Mandato - Suplente
    @Post(':id/suplente')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroPainel.visualizar')
    async createSuplente(@Param() params: FindOneParams, @Body() dto: CreateMandatoSuplenteDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.createSuplente(+params.id, dto, user);
    }

    @Delete(':id/suplente/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    // @Roles('CadastroPainel.visualizar')
    async removeSuplente(@Param() params: FindTwoParams, @Body() dto: RemoveMandatoDepsDto, @CurrentUser() user: PessoaFromJwt) {
        await this.parlamentarService.removeSuplente(+params.id2, dto, user);
        return '';
    }
}
