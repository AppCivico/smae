import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PessoaService } from '../pessoa/pessoa.service';
import { MinhaContaDto, SessaoDto, TesteDataDto } from './models/minha-conta.dto';
import { NovaSenhaDto } from './models/nova-senha.dto';
import { Date2YMD } from '../common/date2ymd';

@ApiTags('Minha Conta')
@Controller('')
export class MinhaContaController {
    constructor(private readonly pessoaService: PessoaService) {}

    @Post('teste-sistema')
    @ApiBearerAuth('access-token')
    postData(@CurrentUser() user: PessoaFromJwt, @Body() filter: TesteDataDto): string {
        return `
        ${user.nome_exibicao} - toISOString = ${filter.data.toISOString()} - Date2YMD.toString = ${Date2YMD.toString(
            filter.data
        )}
        `;
    }

    @Get('minha-conta')
    @ApiBearerAuth('access-token')
    getMe(@CurrentUser() user: PessoaFromJwt): MinhaContaDto {
        const sistemas_disponiveis: (ModuloSistema | undefined)[] = [
            'PDM',
            user.hasSomeRoles(['SMAE.liberar_pdm_as_ps']) ? 'ProgramaDeMetas' : undefined,
            'Projetos',
            'CasaCivil',
            'MDO',
            'PlanoSetorial',
        ];

        let sistemas: ModuloSistema[] = user.sistemas;
        let modulos_sobrescritos = false;

        // deixa o sistema agir naturalmente se não tiver marcado para sobrescrever
        if (user.sobreescrever_modulos) {
            sistemas = user.modulos_permitidos;
            modulos_sobrescritos = !user.sistemas.every((sistema) => sistemas.includes(sistema));
        }

        sistemas = sistemas.filter((sistema) => sistema != 'SMAE');

        return {
            sessao: {
                id: user.id,
                nome_exibicao: user.nome_exibicao,
                session_id: user.session_id,
                privilegios: user.privilegios,
                sistemas: sistemas,
                sistemas_disponiveis: sistemas_disponiveis.filter((sistema) => sistema !== undefined),
                orgao_id: user.orgao_id,
                flags: user.flags,
                modulos_sobrescritos,
            } satisfies SessaoDto,
        };
    }

    @Post('trocar-senha')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async updatePassword(@Body() novaSenhaDto: NovaSenhaDto, @CurrentUser() user: PessoaFromJwt) {
        await this.pessoaService.novaSenha(novaSenhaDto, user);
        return '';
    }
}
