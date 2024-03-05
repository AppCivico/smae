import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreatePainelExternoDto } from './dto/create-painel-externo.dto';
import { FilterPainelExternoDto } from './dto/filter-painel-externo.dto';
import { ListPainelExternoDto } from './dto/list-painel-externo.dto';
import { UpdatePainelExternoDto } from './dto/update-painel-externo.dto';
import { PainelExternoDto } from './entities/painel-externo.entity';
import { PainelExternoService } from './painel-externo.service';

@ApiTags('Painel Externo')
@Controller('painel-externo')
export class PainelExternoController {
    constructor(private readonly painelService: PainelExternoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainelExterno.inserir')
    async create(
        @Body() createPainelDto: CreatePainelExternoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.painelService.create(createPainelDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles('CadastroPainelExterno.inserir', 'CadastroPainelExterno.editar', 'CadastroPainelExterno.remover')
    async findAll(
        @Query() filters: FilterPainelExternoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPainelExternoDto> {
        return { linhas: await this.painelService.findAll(filters, user) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    @Roles('CadastroPainelExterno.editar', 'CadastroPainelExterno.inserir', 'CadastroPainelExterno.remover')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<PainelExternoDto> {
        const item = await this.painelService.findAll({ id: +params.id }, user);

        if (!item[0]) throw new NotFoundException('Item not found');
        return item[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainelExterno.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() updatePainelDto: UpdatePainelExternoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.painelService.update(+params.id, updatePainelDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainelExterno.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.painelService.remove(+params.id, user);
        return '';
    }
}
