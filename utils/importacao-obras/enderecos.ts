import fs from 'fs/promises';
import axios from 'axios';
import { setTimeout } from 'timers/promises';

interface AddressRecord {
    projeto_id: number;
    endereco: string;
    cep: string | null;
}

interface ProcessingState {
    processed: Record<
        number,
        {
            original: AddressRecord;
            response?: any;
            error?: any;
            status?: number;
        }
    >;
    lastProcessedId?: number;
}

const API_URL = 'https://homol-smae-api.appcivico.com/api/geolocalizar';
const API_TOKEN = process.env.API_TOKEN;
if (!API_TOKEN) {
    console.error('API_TOKEN environment variable is required');
    process.exit(1);
}
const STATE_FILE = process.env.STATE_FILE as string;
if (!STATE_FILE) {
    console.error('STATE_FILE environment variable is required');
    process.exit(1);
}
const INPUT_FILE = process.env.INPUT_FILE as string;
if (!INPUT_FILE) {
    console.error('INPUT_FILE environment variable is required');
    process.exit(1);
}
const DELAY_MS = 10;

async function loadState(): Promise<ProcessingState> {
    try {
        const data = await fs.readFile(STATE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { processed: {} };
    }
}

async function saveState(state: ProcessingState): Promise<void> {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function processAddress(record: AddressRecord, state: ProcessingState) {
    // Skip if already processed
    if (
        state.processed[record.projeto_id] &&

        (state.processed[record.projeto_id].original.endereco == 'RUA JANE VANINE CAPOZI, S/N')
        //state.processed[record.projeto_id].response &&
        //!state.processed[record.projeto_id].error
    ) {
        return;
    }

    try {
        let cleanAddress = record.endereco.replace(/\s*\([^)]*\)/g, '');
        cleanAddress = record.endereco.replace(' S/N', '');
        if (cleanAddress !== record.endereco) {
            console.log(`Cleaning address: ${record.endereco} -> ${cleanAddress}`);
        }

        const searchAddress = cleanAddress;

        const response = await axios.post(
            API_URL,
            {
                tipo: 'Endereco',
                busca_endereco: searchAddress,
            },
            { headers: { 'authorization': `Bearer ${API_TOKEN}` } }
        );

        state.processed[record.projeto_id] = {
            original: record,
            response: response.data,
            status: response.status,
        };

        if (response.status === 201) {
            const data = response.data as any;
            if (Array.isArray(data.linhas))
                console.log(
                    `Found ${data.linhas.length} results ${data.linhas.map((l: any) => l.endereco?.properties?.rua)}`
                );
            else console.log(`Response: ${data.linhas}`);
        }
    } catch (error) {
        if (error instanceof axios.AxiosError) {
            state.processed[record.projeto_id] = {
                original: record,
                error: error.response?.data || error.message,
                status: error.response?.status,
            };
        } else {
            state.processed[record.projeto_id] = {
                original: record,
                error: `${error}`,
            };
        }
    }

    state.lastProcessedId = record.projeto_id;
    await saveState(state);
    await setTimeout(DELAY_MS);
}

async function main() {
    try {
        // Load input file
        const fileContent = await fs.readFile(INPUT_FILE, 'utf8');
        const records: AddressRecord[] = fileContent
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line));

        // Load existing state
        const state = await loadState();
        console.log(`Loaded state with ${Object.keys(state.processed).length} processed records`);

        // Process each record
        for (const record of records) {
            if (record.endereco.startsWith('Rua Entre A')) {
                console.log(`Skipping invalid address: ${record.endereco}`);
                continue;
            }
            console.log(`Processing ID: ${record.projeto_id} ${record.endereco}`);
            await processAddress(record, state);
        }

        console.log('Processing completed successfully');
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
