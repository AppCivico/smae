import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PessoaService } from '../pessoa/pessoa.service';
import { MinhaContaDto, SessaoDto } from './models/minha-conta.dto';
import { NovaSenhaDto } from './models/nova-senha.dto';
import { ModuloSistema } from '@prisma/client';

@ApiTags('Minha Conta')
@Controller('')
export class MinhaContaController {
    constructor(private readonly pessoaService: PessoaService) {}

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

        console.log(sistemas_disponiveis)
        let sistemas: ModuloSistema[] = user.sistemas;
        let modulos_sobrescritos = false;

        if (!user.sobreescrever_modulos) {
            let hasPS = false;
            let hasPDM = false;
            if (
                user.hasSomeRoles(['CadastroPS.administrador_no_orgao', 'CadastroPS.administrador']) ||
                (user.equipe_pdm_tipos && user.equipe_pdm_tipos.includes('PS'))
            )
                hasPS = true;
            if (
                user.hasSomeRoles(['CadastroPDM.administrador_no_orgao', 'CadastroPDM.administrador']) ||
                (user.equipe_pdm_tipos && user.equipe_pdm_tipos.includes('PDM'))
            )
                hasPDM = true;

            sistemas = sistemas.filter((sistema) => {
                if (sistema === 'ProgramaDeMetas' && !hasPDM) {
                    return false;
                }
                if (sistema === 'PlanoSetorial' && !hasPS) {
                    return false;
                }
                return true;
            });
        } else {
            modulos_sobrescritos = !user.sistemas.every((sistema) => sistemas.includes(sistema));
            sistemas = user.modulos_permitidos;
        }

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
