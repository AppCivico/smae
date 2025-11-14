import { BadRequestException, ValidationError } from '@nestjs/common';

// Fábrica de exceções para validação usada pelo ValidationPipe
// Mantém o formato de erro anterior e adiciona o campo "fields".
// Recebe um array de ValidationError do class-validator e lança BadRequestException
// com a estrutura: { statusCode, message: string[], fields: string[], error }
export function exceptionFactory(validationErrors: ValidationError[] = []) {
    // Extrai mensagens e campos (comportamento antigo)
    const messages: string[] = [];
    const fields: string[] = [];

    for (const err of validationErrors) {
        const constraints = err.constraints ? Object.values(err.constraints) : [];

        // Adiciona mensagens diretas (formato antigo)
        messages.push(...(constraints as string[]));

        // Adiciona a chave do campo quando houver mensagens
        if ((constraints as any[]).length > 0) {
            fields.push(err.property);
        }

        // Trata validação aninhada
        const collectChildren = (parent: string, children: any[]) => {
            for (const child of children) {
                const childPath = `${parent}.${child.property}`;

                const childConstraints = child.constraints ? Object.values(child.constraints) : ([] as any[]);

                if (childConstraints.length > 0) {
                    messages.push(...(childConstraints as string[]));
                    fields.push(childPath);
                }

                if (child.children?.length) {
                    collectChildren(childPath, child.children);
                }
            }
        };

        if (err.children?.length) {
            collectChildren(err.property, err.children);
        }
    }

    // Lança BadRequestException preservando 100% do formato anterior
    throw new BadRequestException({
        statusCode: 400,
        message: messages,
        fields,
        error: 'Bad Request',
    });
}
