import { readFileSync, writeFileSync } from 'fs';
import axios from 'axios';
import { setTimeout } from 'timers/promises';

interface AddressRecord {
    projeto_id: number;
    endereco: string;
    cep: string | null;
}

interface Camada {
    id: number;
    tipo_camada: string;
    codigo: string;
    titulo: string;
    nivel_regionalizacao: number;
}

interface GeocodingState {
    processed: Record<
        number,
        {
            original: AddressRecord;
            response?: any;
            error?: any;
            status?: number;
        }
    >;
    importacao_state: Record<
        string,
        {
            endereco_exibicao: string;
            token_fixed?: string;
            error?: any;
            timestamp: number;
            distrito_id?: number;
            subprefeitura_id?: number;
            projeto_updated?: boolean;
            projeto_error?: any;
        }
    >;
}

interface AddressMatch {
    similarity: number;
    full_address: string;
    endereco: any;
    camadas: Array<{
        id: number;
        codigo: string;
        titulo: string;
        descricao: string;
        nivel_regionalizacao: number;
    }>;
}
interface ProcessedProject {
    original: {
        projeto_id: number;
        endereco: string;
    };
    matches?: Array<AddressMatch>;
}

const API_URL = process.env.API_URL;
if (!API_URL) {
    console.error('API_URL environment variable is required');
    process.exit(1);
}
const API_TOKEN = process.env.API_TOKEN as string;
if (!API_TOKEN) {
    console.error('API_TOKEN environment variable is required');
    process.exit(1);
}
const STATE_FILE = process.env.STATE_FILE as string;
if (!STATE_FILE) {
    console.error('STATE_FILE environment variable is required');
    process.exit(1);
}
const SIMILARITY_FILE = process.env.SIMILARITY_FILE as string;
if (!SIMILARITY_FILE) {
    console.error('SIMILARITY_FILE environment variable is required');
    process.exit(1);
}
const LOOKUP_FILE = process.env.LOOKUP_FILE as string;
if (!LOOKUP_FILE) {
    console.error('LOOKUP_FILE environment variable is required');
    process.exit(1);
}

let APPROVED_IDS = process.env.APPROVED_IDS as string;
if (!APPROVED_IDS) {
    console.error('Missing APPROVED_IDS env variable');
    process.exit(1);
}
if (!APPROVED_IDS.startsWith(',') || !APPROVED_IDS.endsWith(',')) {
    APPROVED_IDS = ',' + APPROVED_IDS + ',';
}

const DELAY_MS = 0;

async function updateProject(projectId: string, token: string, state: GeocodingState) {
    try {
        const response = await axios.patch(
            `${API_URL}/api/projeto-mdo/${projectId}`,
            {
                geolocalizacao: [token],
            },
            {
                headers: { 'authorization': `Bearer ${API_TOKEN}` },
            }
        );

        state.importacao_state[projectId].projeto_updated = true;
        console.log(`Successfully updated project ${projectId} with geolocalization token`);
    } catch (error: any) {
        console.error(`Error updating project ${projectId}:`, error.response?.data || error.message);
        state.importacao_state[projectId].projeto_error = error.response?.data || error.message;
    }

    await saveState(state);
    await setTimeout(DELAY_MS);
}

// Read and parse the lookup file
function loadLookupData(filePath: string): Camada[] {
    const content = readFileSync(filePath, 'utf-8');
    return content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
}

// Find matching camada from lookup data
function findCamada(camadas: Camada[], titulo: string, codigo: string): Camada | undefined {
    return camadas.find((c) => c.titulo === titulo && c.codigo === codigo);
}

async function loadState(): Promise<GeocodingState> {
    try {
        const data = readFileSync(STATE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { importacao_state: {}, processed: {} };
    }
}

async function saveState(state: GeocodingState): Promise<void> {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function createGeolocalization(
    bestMatch: AddressMatch,
    state: GeocodingState,
    projectId: string,
    lookupData: Camada[]
) {
    // Skip if already processed successfully
    if (!state.importacao_state) state.importacao_state = {};
    if (state.importacao_state[projectId]?.token_fixed) {
        console.log(`Project ${projectId} already processed, skipping`);
        return;
    }

    // Find distrito and subprefeitura IDs from lookup
    let distritoId: number | undefined;
    let subprefeituraId: number | undefined;

    bestMatch.camadas.forEach((camada: any) => {
        const lookupCamada = findCamada(lookupData, camada.titulo, camada.codigo);
        if (!lookupCamada) return;

        if (camada.descricao === 'Distrito Municipal') {
            distritoId = lookupCamada.id;
        } else if (camada.descricao === 'Subprefeitura') {
            subprefeituraId = lookupCamada.id;
        }
    });

    try {
        const payload = {
            endereco_exibicao: bestMatch.full_address,
            tipo: 'Endereco',
            endereco: bestMatch.endereco,
            camadas: [distritoId, subprefeituraId].filter((c) => c !== undefined),
        };
        console.log(payload);

        const response = await axios.post(API_URL + '/api/geolocalizacao', payload, {
            headers: { 'authorization': `Bearer ${API_TOKEN}` },
            validateStatus: (status) => status === 201,
        });

        state.importacao_state[projectId] = {
            endereco_exibicao: bestMatch.full_address,
            token_fixed: response.data.token,
            timestamp: Date.now(),
            distrito_id: distritoId,
            subprefeitura_id: subprefeituraId,
        };

        console.log(`Successfully processed project ${projectId}:`);
        console.log(`  Similarity: ${(bestMatch.similarity * 100).toFixed(1)}%`);
        console.log(`  Match: ${bestMatch.full_address}`);
        console.log(`  Distrito ID: ${distritoId || 'not found'}`);
        console.log(`  Subprefeitura ID: ${subprefeituraId || 'not found'}`);
        await setTimeout(DELAY_MS);
    } catch (error: any) {
        console.error(`Error processing project ${projectId}:`, error.response?.data || error.message);

        state.importacao_state[projectId] = {
            endereco_exibicao: bestMatch.full_address,
            error: error.response?.data || error.message,
            timestamp: Date.now(),
            distrito_id: distritoId,
            subprefeitura_id: subprefeituraId,
        };
    }

    await saveState(state);
}

async function main() {
    try {
        // Parse approved IDs
        const approvedIdSet = new Set(
            APPROVED_IDS.split(',')
                .filter((id) => id)
                .map((id) => id.trim())
        );

        // Load data
        const similarityData = JSON.parse(readFileSync(SIMILARITY_FILE, 'utf-8'));
        const lookupData = loadLookupData(LOOKUP_FILE);
        const state = await loadState();

        console.log(`Loaded state with ${Object.keys(state.processed).length} processed items`);

        // Process each approved project
        for (const [projectId, data] of Object.entries(similarityData)) {
            if (!approvedIdSet.has(projectId)) continue;

            const project = data as ProcessedProject;
            if (!project.matches || project.matches.length === 0) {
                console.log(`Project ${projectId} has no matches, skipping`);
                continue;
            }

            console.log(`Processing project ${projectId}`);
            const bestMatch = project.matches[0];

            await createGeolocalization(bestMatch, state, projectId, lookupData);
        }

        // Phase 2: Update Projects with Tokens
        console.log('\nPhase 2: Updating Projects with Geolocalization Tokens');
        for (const [projectId, importData] of Object.entries(state.importacao_state)) {
            if (!importData.token_fixed) {
                console.log(`Project ${projectId} has no token, skipping update`);
                continue;
            }

            if (importData.projeto_updated) {
                console.log(`Project ${projectId} already updated, skipping`);
                continue;
            }

            console.log(`Updating project ${projectId}`);
            await updateProject(projectId, importData.token_fixed, state);
        }

        // Final Summary
        console.log('\nProcessing Summary:');
        for (const [projectId, result] of Object.entries(state.importacao_state)) {
            console.log(`Project ${projectId}:`);
            if (result.token_fixed) {
                console.log(`  Geolocalization - Success`);
                console.log(`  Distrito ID: ${result.distrito_id || 'not found'}`);
                console.log(`  Subprefeitura ID: ${result.subprefeitura_id || 'not found'}`);
                if (result.projeto_updated) {
                    console.log('  Project Update - Success');
                } else if (result.projeto_error) {
                    console.log(`  Project Update - Failed: ${result.projeto_error}`);
                }
            } else {
                console.log(`  Failed - ${result.error}`);
            }
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
