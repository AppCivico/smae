import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { PainelEstrategicoListaFilterDto } from '../gestao-projetos/painel-estrategico/dto/painel-estrategico-filter.dto';
import { FindOneParams } from './decorators/find-params';

const pipe = new ValidationPipe({ transform: true, whitelist: true });
const run = (metatype: any, type: ArgumentMetadata['type'], value: any) => pipe.transform(value, { metatype, type });

describe('validação de entrada', () => {
    it(':id precisa ser inteiro', async () => {
        await expect(run(FindOneParams, 'param', { id: '1.5' })).rejects.toBeInstanceOf(BadRequestException);
        await expect(run(FindOneParams, 'param', { id: 'abc' })).rejects.toBeInstanceOf(BadRequestException);
        expect(await run(FindOneParams, 'param', { id: '7' })).toEqual({ id: 7 });
    });

    it('ipp e pagina não aceitam zero nem negativo', async () => {
        await expect(run(PainelEstrategicoListaFilterDto, 'query', { ipp: '-5' })).rejects.toBeInstanceOf(
            BadRequestException
        );
        await expect(run(PainelEstrategicoListaFilterDto, 'query', { pagina: '0' })).rejects.toBeInstanceOf(
            BadRequestException
        );
        expect((await run(PainelEstrategicoListaFilterDto, 'query', { ipp: '10' })).ipp).toBe(10);
    });
});
