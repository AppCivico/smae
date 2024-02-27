import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { EleicaoService } from './eleicao.service';


@ApiTags('Eleição')
@Controller('eleicao')
export class EleicaoController {
    constructor(private readonly eleicaoService: EleicaoService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async getList( @CurrentUser() user: PessoaFromJwt ) {
        return await this.eleicaoService.findAll();
    }
}
