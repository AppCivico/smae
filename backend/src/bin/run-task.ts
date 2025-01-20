import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TaskService } from '../task/task.service';

async function bootstrap() {
    // desliga os crontab do 'fork'
    process.env.ENABLED_CRONTABS = '';

    const app = await NestFactory.createApplicationContext(AppModule);
    app.enableShutdownHooks();

    const taskService = app.get(TaskService);

    const taskId = +process.argv[2];

    if (isNaN(taskId)) throw Error(`process.argv[2] is not a number: ${process.argv[2]}`);
    try {
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
    }

    await app.close();
}
bootstrap();
