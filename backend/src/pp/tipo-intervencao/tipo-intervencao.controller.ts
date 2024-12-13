import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateTipoIntervencaoDto } from './dto/create-tipo-intervencao.dto';
import { UpdateTipoIntervencaoDto } from './dto/update-tipo-intervencao.dto';
import { ListTipoIntervencaoDto, TipoIntervencao } from './entities/tipo-intervencao.entity';
import { TipoIntervencaoService } from './tipo-intervencao.service';

@Controller('tipo-intervencao')
@ApiTags('Monitoramento de Obras, Cadastro Básico, Tipo de Intervenção')
export class TipoIntervencaoController {
    constructor(private readonly tipoIntervencaoService: TipoIntervencaoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['TipoIntervecaoMDO.inserir'])
    async create(
        @Body() createTipoIntervencaoDto: CreateTipoIntervencaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoIntervencaoService.create(createTipoIntervencaoDto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListTipoIntervencaoDto> {
        return { linhas: await this.tipoIntervencaoService.findAll(user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TipoIntervencao> {
        return await this.tipoIntervencaoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['TipoIntervecaoMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateTipoIntervencaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoIntervencaoService.update(params.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['TipoIntervecaoMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoIntervencaoService.remove(params.id, user);
        return '';
    }
}
