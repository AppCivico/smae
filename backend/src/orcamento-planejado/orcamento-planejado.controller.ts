import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateOrcamentoPlanejadoDto, FilterOrcamentoPlanejadoDto, ListOrcamentoPlanejadoDto } from './dto/orcamento-planejado.dto';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';

@Controller('orcamento-planejado')
export class OrcamentoPlanejadoController {
  constructor(private readonly orcamentoPlanejadoService: OrcamentoPlanejadoService) {}

  @Patch()
  @ApiBearerAuth('access-token')
  @ApiUnauthorizedResponse()
  @Roles('CadastroMeta.orcamento')
  async upsert(@Body() createMetaDto: CreateOrcamentoPlanejadoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
      return await this.orcamentoPlanejadoService.create(createMetaDto, user);
  }

  @ApiBearerAuth('access-token')
  @Get()
  @Roles('CadastroMeta.orcamento')
  async findAll(@Query() filters: FilterOrcamentoPlanejadoDto): Promise<ListOrcamentoPlanejadoDto> {

      return { 'linhas': await this.orcamentoPlanejadoService.findAll(filters) };
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiUnauthorizedResponse()
  @Roles('CadastroMeta.orcamento')
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.ACCEPTED)
  async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
      await this.orcamentoPlanejadoService.remove(+params.id, user);
      return '';
  }

}
