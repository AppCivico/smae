import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TipoProjeto } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { PROJETO_READONLY_ROLES } from '../projeto/projeto.controller';
import { ProjetoService } from '../projeto/projeto.service';
import { UpsertTermoEncerramentoDto } from './dto/termo-encerramento.dto';
import { TermoEncerramentoDetalheDto } from './dto/termo-encerramento.entity';
import { TermoEncerramentoService } from './termo-encerramento.service';

const ROLES_ESCRITA: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    'SMAE.gestor_de_projeto',
    'SMAE.colaborador_de_projeto',
];

@Controller('projeto')
@ApiTags('Projeto - Termo de Encerramento')
export class TermoEncerramentoController {
    constructor(
        private readonly termoService: TermoEncerramentoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Get(':id/termo-encerramento')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ESCRITA, ...PROJETO_READONLY_ROLES])
    @ApiOkResponse({ type: TermoEncerramentoDetalheDto })
    async buscar(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<TermoEncerramentoDetalheDto> {
        // Valida acesso ao projeto (ReadOnly é suficiente para visualizar)
        const projeto = await this.projetoService.findOne(TipoProjeto.PP, params.id, user, 'ReadOnly');

        // Verifica se usuário tem permissão de escrita para calcular flag 'pode_excluir'
        const podeEscrever = !projeto.permissoes.apenas_leitura;

        return await this.termoService.buscarOuCalcular(TipoProjeto.PP, projeto.id, user, podeEscrever);
    }

    @Patch(':id/termo-encerramento')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ESCRITA])
    async salvar(
        @Param() params: FindOneParams,
        @Body() dto: UpsertTermoEncerramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        // Exige permissão de escrita
        const projeto = await this.projetoService.findOne(TipoProjeto.PP, params.id, user, 'ReadWriteTeam');

        return await this.termoService.upsert(TipoProjeto.PP, projeto.id, dto, user);
    }

    @Delete(':id/termo-encerramento')
    @ApiBearerAuth('access-token')
    @Roles([...ROLES_ESCRITA])
    @ApiNoContentResponse({ description: 'Rascunho excluído com sucesso' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async excluir(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<void> {
        // Exige permissão de escrita
        const projeto = await this.projetoService.findOne(TipoProjeto.PP, params.id, user, 'ReadWriteTeam');

        await this.termoService.excluir(TipoProjeto.PP, projeto.id, user);
    }
}
