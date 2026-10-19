import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VERSAO_SMAE } from '../common/versao';
import { VersaoDto, VersaoServicoDto } from './dto/versao.dto';

// Versão padrão dos serviços auxiliares; sobrescreva por ambiente com VERSAO_<CHAVE> (ex.: VERSAO_SOF).
const SERVICOS_AUXILIARES: VersaoServicoDto[] = [
    { chave: 'transferegov', nome: 'Transfere GOV', versao: '1.0.0' },
    { chave: 'sof', nome: 'SOF', versao: '1.0.0' },
    { chave: 'sei', nome: 'SEI', versao: '1.0.0' },
    { chave: 'email', nome: 'Serviços de e-mail', versao: '1.0.0' },
];

@ApiTags('Versão')
@Controller('versao')
export class VersaoController {
    @Get()
    @ApiBearerAuth('access-token')
    versao(): VersaoDto {
        return {
            ...VERSAO_SMAE,
            servicos: [
                { chave: 'frontend', nome: 'Interface', versao: VERSAO_SMAE.versao },
                { chave: 'backend', nome: 'Aplicação', versao: VERSAO_SMAE.versao },
                ...SERVICOS_AUXILIARES.map((s) => ({
                    ...s,
                    versao: process.env[`VERSAO_${s.chave.toUpperCase()}`] || s.versao,
                })),
            ],
        };
    }
}
