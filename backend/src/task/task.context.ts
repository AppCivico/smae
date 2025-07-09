import { task_type } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export class TaskContext {
    private prisma: PrismaService;
    private task_id: number;
    public readonly type: task_type;

    constructor(prisma: PrismaService, task_id: number, type: task_type) {
        this.prisma = prisma;
        this.task_id = task_id;
        this.type = type;
    }

    /**
     * Armazena dados no buffer de tarefa para recuperação posterior
     */
    async stashData<T>(data: T): Promise<void> {
        try {
            // Create a fresh copy using JSON methods to ensure no frozen objects
            const cleanData = JSON.parse(JSON.stringify(data));

            await this.prisma.task_buffer.upsert({
                where: {
                    task_id: this.task_id,
                },
                update: {
                    data: cleanData as any,
                    criado_em: new Date(),
                },
                create: {
                    task_id: this.task_id,
                    data: cleanData as any,
                },
            });
        } catch (error) {
            console.error('Erro ao salvar dados no buffer da tarefa', error);
            throw new Error('Falha ao armazenar dados temporários da tarefa');
        }
    }

    /**
     * Recupera dados previamente guardados do buffer de tarefa
     */
    async loadStashedData<T>(def: T): Promise<T> {
        try {
            const buffer = await this.prisma.task_buffer.findUnique({
                where: {
                    task_id: this.task_id,
                },
            });
            return JSON.parse(JSON.stringify(buffer ? (buffer.data?.valueOf() as unknown as T) : def));
        } catch (error) {
            console.error('Erro ao carregar dados do buffer da tarefa', error);
            return def;
        }
    }

    async removeStashedData(): Promise<void> {
        try {
            await this.prisma.task_buffer.deleteMany({
                where: {
                    task_id: this.task_id,
                },
            });
        } catch (error) {
            console.error('Erro ao remover dados do buffer da tarefa', error);
        }
    }
}
