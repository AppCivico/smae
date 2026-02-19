/**
 * Generate horizontal (left-to-right) layout for module dependencies
 * Uses app.module.* files to determine architectural layers
 * Usage: npx ts-node tools/graph-horizontal.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { globSync } from 'glob';

interface ModuleNode {
    name: string;
    path: string;
    imports: string[];
    forwardRefs: string[];
    area: string;
    layer: number;
    featureGroup: string;
}

interface FeatureGroup {
    name: string;
    layer: number;
    modules: string[];
}

function extractModules(): ModuleNode[] {
    const moduleFiles = globSync('src/**/*.module.ts', { absolute: true });
    const modules: ModuleNode[] = [];
    
    for (const filePath of moduleFiles) {
        const content = readFileSync(filePath, 'utf-8');
        
        const nameMatch = content.match(/export class (\w+Module)/);
        if (!nameMatch) continue;
        
        const moduleName = nameMatch[1];
        const relativePath = filePath.replace(process.cwd(), '.');
        const area = relativePath.split('/')[2] || 'root';
        
        const importsMatch = content.match(/imports:\s*\[([^\]]+)\]/s);
        const imports: string[] = [];
        const forwardRefs: string[] = [];
        
        if (importsMatch) {
            const importsContent = importsMatch[1];
            
            const forwardRefRegex = /forwardRef\s*\(\s*\(\)\s*=>\s*(\w+Module)\s*\)/g;
            let match;
            while ((match = forwardRefRegex.exec(importsContent)) !== null) {
                forwardRefs.push(match[1]);
            }
            
            const directImportRegex = /(?<!forwardRef\s*\(\s*\(\)\s*=>\s*)(\w+Module)(?!\s*\w)/g;
            while ((match = directImportRegex.exec(importsContent)) !== null) {
                const mod = match[1];
                if (!forwardRefs.includes(mod) && 
                    !['PrismaModule', 'JwtModule', 'ScheduleModule', 'ConfigModule'].includes(mod)) {
                    imports.push(mod);
                }
            }
        }
        
        modules.push({
            name: moduleName,
            path: relativePath,
            imports,
            forwardRefs,
            area,
            layer: 0,
            featureGroup: 'unknown'
        });
    }
    
    return modules;
}

function parseAppModuleLayers(modules: ModuleNode[]): Map<string, FeatureGroup> {
    const featureGroups = new Map<string, FeatureGroup>();
    
    // Parse main app.module.ts to get layer order
    const mainAppModulePath = './src/app.module.ts';
    let mainContent: string;
    try {
        mainContent = readFileSync(mainAppModulePath, 'utf-8');
    } catch (e) {
        console.warn('Could not read main app.module.ts');
        return featureGroups;
    }
    
    // Layer definitions based on app.module.ts structure
    const layerDefinitions: { pattern: RegExp; layer: number; name: string }[] = [
        // Layer 0: Core Infrastructure
        { pattern: /ConfigModule|PrismaModule|RequestLogModule/, layer: 0, name: 'Core Infrastructure' },
        
        // Layer 1: Common/Foundation
        { pattern: /AppModuleCommon|CommonBaseModule|PessoaPrivilegioModule/, layer: 1, name: 'Common/Foundation' },
        
        // Layer 2: Supporting Services
        { pattern: /AppModuleGeo|AppModuleIntegrations/, layer: 2, name: 'Supporting Services' },
        
        // Layer 3: Domain Modules
        { pattern: /AppModulePdm|AppModuleProjeto|AppModuleWorkflow|AppModuleCasaCivil|AppModuleOrcamento/, layer: 3, name: 'Domain Modules' },
        
        // Layer 4: Cross-cutting
        { pattern: /AppModuleReports|AppModuleTasks/, layer: 4, name: 'Cross-cutting' },
        
        // Layer 5: Supporting Features
        { pattern: /AppModuleSupporting/, layer: 5, name: 'Supporting Features' },
        
        // Layer 6: Analytics
        { pattern: /DuckDBModule/, layer: 6, name: 'Analytics' },
    ];
    
    // Parse individual app.module.* files
    const appModuleFiles = globSync('src/app.module.*.ts', { absolute: false });
    
    for (const appModuleFile of appModuleFiles) {
        const content = readFileSync(appModuleFile, 'utf-8');
        const groupName = basename(appModuleFile, '.ts').replace('app.module.', '');
        
        // Determine layer from main app.module.ts import order
        let layer = 3; // Default to domain layer
        for (const def of layerDefinitions) {
            if (def.pattern.test(content) || def.pattern.test(groupName)) {
                layer = def.layer;
                break;
            }
        }
        
        // Extract module names from imports
        const importedModules: string[] = [];
        const importRegex = /import\s+\{\s*(\w+Module)\s*\}/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            importedModules.push(match[1]);
        }
        
        featureGroups.set(groupName, {
            name: groupName,
            layer,
            modules: importedModules
        });
        
        // Assign feature group and layer to modules
        for (const mod of modules) {
            if (importedModules.includes(mod.name)) {
                mod.featureGroup = groupName;
                mod.layer = layer;
            }
        }
    }
    
    // Handle core modules not in any app.module.*
    const coreModules = ['PrismaModule', 'ConfigModule', 'RequestLogModule'];
    for (const mod of modules) {
        if (coreModules.includes(mod.name)) {
            mod.layer = 0;
            mod.featureGroup = 'core';
        }
    }
    
    // Handle common modules
    const commonModules = ['AuthModule', 'PessoaModule', 'OrgaoModule', 'UploadModule', 'ScheduleModule'];
    for (const mod of modules) {
        if (commonModules.includes(mod.name) && mod.featureGroup === 'unknown') {
            mod.layer = 1;
            mod.featureGroup = 'common';
        }
    }
    
    // Calculate layers for remaining modules based on dependencies
    calculateLayersFromDeps(modules);
    
    return featureGroups;
}

function calculateLayersFromDeps(modules: ModuleNode[]): void {
    // Iterate to propagate layer info through dependencies
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;
    
    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        
        for (const mod of modules) {
            if (mod.layer === 0) continue; // Core stays at 0
            
            // Find all dependencies
            const deps = [...mod.imports, ...mod.forwardRefs];
            const depModules = deps
                .map(d => modules.find(m => m.name === d))
                .filter((m): m is ModuleNode => m !== undefined);
            
            if (depModules.length === 0) {
                // No deps = foundation layer
                if (mod.layer !== 1 && mod.featureGroup === 'unknown') {
                    mod.layer = 1;
                    changed = true;
                }
            } else {
                // Layer = max(dep layers) + 1, but respect feature group if set
                const maxDepLayer = Math.max(...depModules.map(d => d.layer), 0);
                const targetLayer = Math.min(maxDepLayer + 1, 6);
                
                if (mod.featureGroup === 'unknown' && mod.layer < targetLayer) {
                    mod.layer = targetLayer;
                    changed = true;
                }
            }
        }
    }
}

function findCircularDependencies(modules: ModuleNode[]): string[][] {
    const graph = new Map<string, Set<string>>();
    
    for (const mod of modules) {
        const deps = new Set([...mod.imports, ...mod.forwardRefs]);
        graph.set(mod.name, deps);
    }
    
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    function dfs(node: string): void {
        if (recursionStack.has(node)) {
            const cycleStart = path.indexOf(node);
            if (cycleStart !== -1) {
                const cycle = [...path.slice(cycleStart), node];
                const cycleKey = cycle.join(',');
                
                if (!cycles.some(c => [...c, c[0]].join(',') === cycleKey)) {
                    cycles.push([...path.slice(cycleStart), node]);
                }
            }
            return;
        }
        
        if (visited.has(node)) return;
        
        visited.add(node);
        recursionStack.add(node);
        path.push(node);
        
        const deps = graph.get(node) || new Set();
        for (const dep of deps) {
            if (graph.has(dep)) {
                dfs(dep);
            }
        }
        
        path.pop();
        recursionStack.delete(node);
    }
    
    for (const mod of modules) {
        if (!visited.has(mod.name)) {
            dfs(mod.name);
        }
    }
    
    return cycles;
}

function generateHorizontalDot(modules: ModuleNode[], cycles: string[][]): string {
    const modulesInCycles = new Set<string>();
    for (const cycle of cycles) {
        for (const mod of cycle) modulesInCycles.add(mod);
    }

    // Group modules by layer
    const layers = new Map<number, ModuleNode[]>();
    for (const mod of modules) {
        if (!layers.has(mod.layer)) layers.set(mod.layer, []);
        layers.get(mod.layer)!.push(mod);
    }

    // Color scheme for feature groups
    const groupColors: Record<string, string> = {
        'core': '#ffebee',           // red
        'common': '#e3f2fd',         // blue
        'geo': '#e8f5e9',            // green
        'integrations': '#fff3e0',   // orange
        'pdm': '#f3e5f5',            // purple
        'projeto': '#e0f2f1',        // teal
        'casa-civil': '#fce4ec',     // pink
        'orcamento': '#fff8e1',      // amber
        'reports': '#efebe9',        // brown
        'tasks': '#e1f5fe',          // cyan
        'supporting': '#fbe9e7',     // deep orange
        'workflow': '#e8eaf6',       // indigo
        'unknown': '#fafafa'         // gray
    };

    const lines = [
        'digraph NestJSModulesHorizontal {',
        '    rankdir=LR;',
        '    node [shape=box, style=filled, fontname="Arial", fontsize=9, margin="0.2,0.1"];',
        '    edge [fontname="Arial", fontsize=8, arrowsize=0.7, color="#666666"];',
        '    splines=line;',
        '    nodesep=0.5;',
        '    ranksep=2.5;',
        '    overlap=false;',
        '    pack=false;',
        '    concentrate=false;',
        ''
    ];

    // Create subgraph clusters for each layer
    const layerNames = [
        'Core Infrastructure',
        'Common/Foundation', 
        'Supporting Services',
        'Domain: PDM',
        'Domain: Projeto',
        'Domain: Casa Civil',
        'Domain: Workflow',
        'Domain: Orcamento',
        'Cross-cutting: Reports',
        'Cross-cutting: Tasks',
        'Supporting Features',
        'Analytics'
    ];

    for (let layerNum = 0; layerNum <= 6; layerNum++) {
        const layerMods = layers.get(layerNum) || [];
        if (layerMods.length === 0) continue;

        lines.push(`    subgraph cluster_layer${layerNum} {`);
        lines.push(`        label="${layerNames[layerNum] || `Layer ${layerNum}`}";`);
        lines.push('        style=filled;');
        lines.push('        fillcolor=gray95;');
        lines.push('        color=gray60;');
        lines.push('        penwidth=2;');
        lines.push('        labelloc=t;');
        lines.push('        labeljust=center;');
        lines.push('        fontsize=11;');
        lines.push('        fontname="Arial Bold";');
        lines.push('');

        // Group by feature group within layer
        const groupsInLayer = new Map<string, ModuleNode[]>();
        for (const mod of layerMods) {
            if (!groupsInLayer.has(mod.featureGroup)) groupsInLayer.set(mod.featureGroup, []);
            groupsInLayer.get(mod.featureGroup)!.push(mod);
        }

        // Create subgraphs for each feature group within the layer
        let groupIdx = 0;
        for (const [group, mods] of groupsInLayer) {
            if (mods.length > 0) {
                lines.push(`        // ${group}`);
                for (const mod of mods) {
                    const color = modulesInCycles.has(mod.name) ? '#ffccbc' : (groupColors[group] || groupColors.unknown);
                    const penwidth = modulesInCycles.has(mod.name) ? '2' : '1';
                    const shape = mod.forwardRefs.length > 0 ? 'box, peripheries=2' : 'box';
                    lines.push(`        "${mod.name}" [fillcolor="${color}", penwidth=${penwidth}, shape=${shape}];`);
                }
                lines.push('');
            }
            groupIdx++;
        }

        lines.push('    }');
        lines.push('');
    }

    // Add invisible edges to enforce layer ordering
    const layerModules = [...layers.entries()].sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < layerModules.length - 1; i++) {
        const currentLayer = layerModules[i][1];
        const nextLayer = layerModules[i + 1][1];
        if (currentLayer.length > 0 && nextLayer.length > 0) {
            // Connect first node of current layer to first node of next layer
            lines.push(`    "${currentLayer[0].name}" -> "${nextLayer[0].name}" [style=invis, weight=100];`);
        }
    }
    lines.push('');

    // Add regular edges
    const addedEdges = new Set<string>();
    for (const mod of modules) {
        for (const imp of mod.imports) {
            if (modules.find(m => m.name === imp)) {
                const edgeKey = `"${imp}" -> "${mod.name}"`;
                if (!addedEdges.has(edgeKey)) {
                    lines.push(`    ${edgeKey};`);
                    addedEdges.add(edgeKey);
                }
            }
        }
        
        // Forward refs (dashed, red)
        for (const imp of mod.forwardRefs) {
            if (modules.find(m => m.name === imp)) {
                const edgeKey = `"${imp}" -> "${mod.name}"`;
                if (!addedEdges.has(edgeKey)) {
                    lines.push(`    "${imp}" -> "${mod.name}" [style=dashed, color="#d32f2f", penwidth=1.5];`);
                    addedEdges.add(edgeKey);
                }
            }
        }
    }

    // Highlight cycle edges
    for (const cycle of cycles) {
        if (cycle.length <= 15) { // Only show shorter cycles
            for (let i = 0; i < cycle.length - 1; i++) {
                const from = cycle[i];
                const to = cycle[i + 1];
                lines.push(`    "${from}" -> "${to}" [color=red, penwidth=3, constraint=false];`);
            }
        }
    }

    lines.push('}');
    return lines.join('\n');
}

function main() {
    console.log('🔍 Parsing module files...');
    const modules = extractModules();
    
    console.log(`📦 Found ${modules.length} modules`);
    
    console.log('📚 Parsing app.module.* files for layer structure...');
    const featureGroups = parseAppModuleLayers(modules);
    console.log(`   Found ${featureGroups.size} feature groups`);
    for (const [name, group] of featureGroups) {
        console.log(`   - ${name}: Layer ${group.layer}, ${group.modules.length} modules`);
    }
    
    const forwardRefCount = modules.reduce((acc, m) => acc + m.forwardRefs.length, 0);
    console.log(`🔗 Found ${forwardRefCount} forwardRef dependencies`);
    
    console.log('\n📊 Layer distribution:');
    const layerCounts = new Map<number, number>();
    for (const mod of modules) {
        layerCounts.set(mod.layer, (layerCounts.get(mod.layer) || 0) + 1);
    }
    for (const [layer, count] of [...layerCounts.entries()].sort((a, b) => a[0] - b[0])) {
        console.log(`   Layer ${layer}: ${count} modules`);
    }
    
    console.log('\n🔍 Looking for circular dependencies...');
    const cycles = findCircularDependencies(modules);
    console.log(`⚠️  Found ${cycles.length} circular dependency chains`);
    
    // Generate output
    const outputDir = join(process.cwd(), 'dist-graph');
    try {
        mkdirSync(outputDir, { recursive: true });
    } catch (e) {}
    
    console.log('\n🎨 Generating horizontal layout...');
    
    const dot = generateHorizontalDot(modules, cycles);
    writeFileSync(join(outputDir, 'modules-horizontal.dot'), dot);
    
    console.log('\n📊 Output files:');
    console.log('   - dist-graph/modules-horizontal.dot');
    console.log('\n💡 To generate PNG:');
    console.log('   dot -Tpng dist-graph/modules-horizontal.dot -o dist-graph/modules-horizontal.png');
    console.log('   # For larger output:');
    console.log('   dot -Tpng -Gsize="50,30!" -Gdpi=150 dist-graph/modules-horizontal.dot -o dist-graph/modules-horizontal.png');
}

main();
