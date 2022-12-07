import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { MinhaContaDto } from './models/minha-conta.dto';
import { PessoaService } from '../pessoa/pessoa.service';
import { NovaSenhaDto } from './models/nova-senha.dto';

@ApiTags('Minha Conta')
@Controller('')
export class MinhaContaController {
    constructor(private readonly pessoaService: PessoaService) { }

    @Get('minha-conta')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    getMe(@CurrentUser() user: PessoaFromJwt): MinhaContaDto {
        return { 'sessao': user };
    }

    @Post('trocar-senha')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePassword(@Body() novaSenhaDto: NovaSenhaDto, @CurrentUser() user: PessoaFromJwt) {
        await this.pessoaService.novaSenha(novaSenhaDto, user);
        return '';
    }
}
