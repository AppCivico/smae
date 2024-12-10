import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateEmpreendimentoDto } from './dto/create-empreendimento.dto';
import { UpdateEmpreendimentoDto } from './dto/update-empreendimento.dto';
import { EmpreendimentoService } from './empreendimento.service';
import { EmpreendimentoDto, ListEmpreendimentoDto } from './entities/empreendimento.entity';

@Controller('empreendimento')
@ApiTags('Monitoramento de Obras, Cadastro Básico, Empreendimento')
export class EmpreendimentoController {
    constructor(private readonly empreendimentoService: EmpreendimentoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroEmpreendimentoMDO.inserir'])
    async create(
        @Body() createEquipamentoDto: CreateEmpreendimentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.empreendimentoService.create(createEquipamentoDto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListEmpreendimentoDto> {
        return { linhas: await this.empreendimentoService.findAll(user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<EmpreendimentoDto> {
        return await this.empreendimentoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroEmpreendimentoMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateEmpreendimentoDto: UpdateEmpreendimentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.empreendimentoService.update(params.id, updateEmpreendimentoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroEmpreendimentoMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.empreendimentoService.remove(params.id, user);
        return '';
    }
}
