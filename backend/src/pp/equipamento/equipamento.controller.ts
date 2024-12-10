import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpdateProjetoDto } from '../projeto/dto/update-projeto.dto';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { Equipamento, ListEquipamentoDto } from './entities/equipamento.entity';
import { EquipamentoService } from './equipamento.service';

@Controller('equipamento')
@ApiTags('Monitoramento de Obras, Cadastro Básico, Equipamento')
export class EquipamentoController {
    constructor(private readonly equipamentoService: EquipamentoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroEquipamentoMDO.inserir'])
    async create(
        @Body() createEquipamentoDto: CreateEquipamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.equipamentoService.create(createEquipamentoDto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListEquipamentoDto> {
        return { linhas: await this.equipamentoService.findAll(user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<Equipamento> {
        return await this.equipamentoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroEquipamentoMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.equipamentoService.update(params.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroEquipamentoMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.equipamentoService.remove(params.id, user);
        return '';
    }
}
