import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { PessoaService } from '../pessoa/pessoa.service';

// Utilitário de desenvolvimento: gera um access_token (Bearer) para uma pessoa,
// para exercitar a API manualmente (curl/Swagger) sem precisar logar via senha.
//
// Uso (precisa de build, pois roda do dist — ts-node --transpile-only não elide
// imports só-de-tipo como 'geojson' e quebra no boot):
//   npm run build && npm run script:get-token -- <pessoa-id | email> [ip]
// Exemplos:
//   npm run script:get-token -- 1
//   npm run script:get-token -- admin@email.com 127.0.0.1

process.on('uncaughtException', (error: Error) => {
    Logger.error('Exceção não capturada:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    Logger.error('Rejeição não tratada:', reason);
    process.exit(1);
});

async function bootstrap(): Promise<void> {
    // não inicia crontabs ao subir o contexto da aplicação
    process.env.DISABLED_CRONTABS = 'all';

    const arg = process.argv[2];
    const ip = process.argv[3] ?? '127.0.0.1';

    if (!arg) {
        throw new Error(
            `Uso: npx ts-node -r tsconfig-paths/register src/bin/get-token.ts <pessoa-id | email> [ip]`
        );
    }

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });
    app.enableShutdownHooks();

    const authService = app.get(AuthService);
    const pessoaService = app.get(PessoaService);

    try {
        // aceita id numérico ou e-mail
        const pessoa = /^\d+$/.test(arg)
            ? await pessoaService.findById(+arg)
            : await pessoaService.findByEmail(arg);

        if (!pessoa) {
            throw new Error(`Pessoa não encontrada para "${arg}"`);
        }

        const pessoaId = pessoa.id as number;
        const { access_token } = await authService.criarSession(pessoaId, ip);

        const result = {
            success: true,
            pessoa_id: pessoaId,
            nome_exibicao: pessoa.nome_exibicao,
            email: pessoa.email,
            note: 'Use no header: Authorization: Bearer <token>',
            access_token,
        };

        if (process.send) {
            process.send({ event: 'success', result: JSON.stringify(result) });
        } else {
            console.log('\n=== ACCESS TOKEN GERADO ===');
            console.log(JSON.stringify(result, null, 2));
            console.log(`\nAuthorization: Bearer ${access_token}`);
        }
    } finally {
        await app.close();
        process.exit(0);
    }
}

bootstrap().catch((error) => {
    Logger.error('Erro no bootstrap:', error);
    process.exit(1);
});
