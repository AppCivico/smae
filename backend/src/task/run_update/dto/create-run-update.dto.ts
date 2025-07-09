import { ApiProperty } from '@nestjs/swagger';
import {
    getMetadataStorage,
    IsArray,
    IsDefined,
    IsEnum,
    IsInt,
    IsNumber,
    IsString,
    registerDecorator,
    ValidateNested,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { NumberArrayTransformOrUndef } from 'src/auth/transforms/number-array.transform';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { UpdateProjetoDto } from 'src/pp/projeto/dto/update-projeto.dto';
import { validate } from 'class-validator';
import { TipoAtualizacaoEmLote } from 'src/generated/prisma/client';

export enum TipoOperacao {
    Set = 'Set',
    Add = 'Add',
    Remove = 'Remove',
    CreateTarefa = 'CreateTarefa',
}

const tipoToDtoMap: Record<TipoAtualizacaoEmLote, any> = {
    [TipoAtualizacaoEmLote.ProjetoMDO]: UpdateProjetoDto,
    [TipoAtualizacaoEmLote.ProjetoPP]: UpdateProjetoDto,
} as const;

@ValidatorConstraint({ name: 'VerificaOpsParaTipo', async: true })
export class VerificaOpsParaTipoConstraint implements ValidatorConstraintInterface {
    async validate(ops: UpdateOperacaoDto[], args: ValidationArguments) {
        const dto = args.object as CreateRunUpdateDto;
        const tipo = dto.tipo;
        const colunasPermitidas = this.buscaColsPermitidas(tipo);

        // Verifica colunas válidas
        if (
            !ops
                .filter((e) => e.tipo_operacao !== TipoOperacao.CreateTarefa)
                .every((op) => colunasPermitidas.includes(op.col))
        ) {
            return false;
        }

        // **NOVOS BLOCOS DE VALIDAÇÃO CRUZADA ENTRE OPERAÇÕES**

        // 1. Verifica duplicação de operações 'Set' para a mesma coluna
        const setOperations = ops.filter((op) => op.tipo_operacao === TipoOperacao.Set);
        const setCols = setOperations.map((op) => op.col);
        const duplicatedSetCols = setCols.filter((col, index) => setCols.indexOf(col) !== index);

        if (duplicatedSetCols.length > 0) {
            args.constraints[0] = `Operação 'Substituir' duplicada para a coluna '${duplicatedSetCols[0]}'.
                Use apenas uma operação 'Substituir' por coluna em cada atualização em lote.`;
            return false;
        }

        // 2. Verifica mistura de 'Set' com 'Add' ou 'Remove' na mesma coluna
        const colsWithSetOp = new Set(setOperations.map((op) => op.col));
        const addOrRemoveOps = ops.filter(
            (op) => op.tipo_operacao === TipoOperacao.Add || op.tipo_operacao === TipoOperacao.Remove
        );

        for (const op of addOrRemoveOps) {
            if (colsWithSetOp.has(op.col)) {
                args.constraints[0] = `Não é possível usar 'Substituir' junto com 'Adicionar' ou 'Excluir'
                para a mesma coluna ('${op.col}') na mesma atualização em lote. A operação 'Substituir' sobrescreveria
                o resultado de 'Adicionar'/'Excluir'. Use operações separadas ou ajuste a lógica.`;
                return false;
            }
        }

        // 3. Verifica interação entre 'orgao_gestor_id' (Set) e 'responsaveis_no_orgao_gestor' (Add/Remove)
        const hasOrgaoGestorSet = ops.some(
            (op) => op.col === 'orgao_gestor_id' && op.tipo_operacao === TipoOperacao.Set
        );

        if (hasOrgaoGestorSet) {
            const hasResponsaveisAddOrRemove = ops.some(
                (op) =>
                    op.col === 'responsaveis_no_orgao_gestor' &&
                    (op.tipo_operacao === TipoOperacao.Add || op.tipo_operacao === TipoOperacao.Remove)
            );

            if (hasResponsaveisAddOrRemove) {
                args.constraints[0] = `Não é permitido alterar 'orgao_gestor_id' via 'Substituir' e simultaneamente usar
                'Adicionar' ou 'Excluir' em 'responsaveis_no_orgao_gestor' na mesma atualização. Se precisar definir
                novos responsáveis após alterar o órgão, use uma operação 'Substituir' para 'responsaveis_no_orgao_gestor'.`;
                return false;
            }
        }

        // 4. Verifica interação entre 'orgao_responsavel_id' (Set) e 'responsavel_id' (Set/Add/Remove)
        const hasOrgaoResponsavelSet = ops.some(
            (op) => op.col === 'orgao_responsavel_id' && op.tipo_operacao === TipoOperacao.Set
        );

        if (hasOrgaoResponsavelSet) {
            const hasResponsavelNonSet = ops.some(
                (op) => op.col === 'responsavel_id' && op.tipo_operacao !== TipoOperacao.Set
            );

            if (hasResponsavelNonSet) {
                args.constraints[0] = `Ao alterar 'orgao_responsavel_id' via 'Substituir', a única operação permitida
                 para 'responsavel_id' na mesma atualização é também 'Substituir'. Outras operações
                 ('Adicionar', 'Excluir') não são aplicáveis.`;
                return false;
            }
        }

        // Valida valores do campo 'valor' conforme o DTO alvo
        const targetDtoClass = tipoToDtoMap[tipo];
        if (!targetDtoClass) return false;

        for (const op of ops) {
            // Caso a operação seja de tipo 'CreateTarefa', pula a validação
            if (op.tipo_operacao === TipoOperacao.CreateTarefa) {
                continue;
            }

            const dummyInstance = plainToInstance(
                targetDtoClass,
                { [op.col]: op.valor }, // Mapeia o valor para a coluna
                { enableImplicitConversion: true }
            ) as object;

            const errors = await validate(dummyInstance, {
                skipMissingProperties: true,
                forbidUnknownValues: false,
            });

            if (errors.length > 0) {
                args.constraints[0] = this.formataErro(op, errors);
                return false;
            }
        }

        return true;
    }

    defaultMessage(args: ValidationArguments) {
        console.log(args);
        return args.constraints[0] || 'Uma ou mais operações possuem valores inválidos';
    }

    private buscaColsPermitidas(tipo: TipoAtualizacaoEmLote): string[] {
        const dtoClass = tipoToDtoMap[tipo];
        if (!dtoClass) return [];

        const metadataStorage = getMetadataStorage();
        const validationMetadatas = metadataStorage.getTargetValidationMetadatas(dtoClass as any, '', false, false);

        return [...new Set(validationMetadatas.map((m) => m.propertyName))];
    }

    private formataErro(op: UpdateOperacaoDto, errors: any[]): string {
        const mensagens = errors
            .map((e) => Object.values(e.constraints || {}))
            .flat()
            .join(', ');
        return `Operação na coluna "${op.col}" inválida: ${mensagens}`;
    }
}

export function VerificaOpsParaTipo() {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            validator: VerificaOpsParaTipoConstraint,
        });
    };
}

export class UpdateOperacaoDto {
    @IsString()
    col: string;

    @IsEnum(TipoOperacao)
    @ApiProperty({
        description: 'Tipo da operação.',
        enum: TipoOperacao,
        enumName: 'TipoOperacao',
    })
    tipo_operacao: TipoOperacao;

    @IsDefined()
    valor: any;
}

export class CreateRunUpdateDto {
    @ApiProperty({
        description: 'Tipo da atualização em lote.',
        enum: TipoAtualizacaoEmLote,
        enumName: 'TipoAtualizacaoEmLote',
        example: TipoAtualizacaoEmLote.ProjetoMDO,
    })
    @IsEnum(TipoAtualizacaoEmLote)
    tipo: TipoAtualizacaoEmLote;

    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    ids: number[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateOperacaoDto)
    @VerificaOpsParaTipo()
    ops: UpdateOperacaoDto[];

    @IsNumber()
    atualizacao_em_lote_id: number;
}
