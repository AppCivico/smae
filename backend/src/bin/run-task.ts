import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { coletarInfoWorker, TaskService } from '../task/task.service';

// Adicione broadcast de status do worker
setTimeout(enviarStatusWorker, 100);
setInterval(enviarStatusWorker, 30 * 1000);

// Tratamento de erros
process.on('uncaughtException', async (error: Error) => {
    console.error('Exceção não capturada:', error);
});

process.on('unhandledRejection', async (reason: unknown) => {
    console.error('Rejeição não tratada:', reason);
});

async function bootstrap() {
    // desliga os crontab do 'fork'
    process.env.ENABLED_CRONTABS = '';

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });
    app.enableShutdownHooks();

    const taskService = app.get(TaskService);

    const taskId = +process.argv[2];

    if (isNaN(taskId)) throw Error(`process.argv[2] não é um número: ${process.argv[2]}`);
    try {
        app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

        const result = await taskService.runInFg(taskId, null);
        if (typeof result !== 'string' && 'error' in result) throw result.error;

        const ev = { event: 'success', result };
        if (process.send) {
            process.send(ev);
        } else {
            console.log('success', JSON.parse(result));
        }
    } catch (error) {
        const ev = { event: 'error', error };
        if (process.send) {
            process.send(ev);
        } else {
            console.log('error', error);
        }
    } finally {
        process.exit(0);
    }
}

// Função para enviar status do worker para o processo pai
function enviarStatusWorker(): void {
    if (process.send) {
        process.send({
            event: 'worker_info',
            workerInfo: coletarInfoWorker(false),
        });
    }
}

bootstrap().catch((error) => {
    console.error('Erro no bootstrap:', error);
    process.exit(1);
});
