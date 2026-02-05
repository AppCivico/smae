/**
 * Simple script to parse module files and generate dependency graph
 * Usage: npx ts-node tools/graph-modules-simple.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { globSync } from 'glob';

interface ModuleNode {
    name: string;
    path: string;
    imports: string[];
    forwardRefs: string[];
}

function extractModules(): ModuleNode[] {
    const moduleFiles = globSync('src/**/*.module.ts', { absolute: true });
    const modules: ModuleNode[] = [];
    
    for (const filePath of moduleFiles) {
        const content = readFileSync(filePath, 'utf-8');
        
        // Extract module name from export class
        const nameMatch = content.match(/export class (\w+Module)/);
        if (!nameMatch) continue;
        
        const moduleName = nameMatch[1];
        
        // Extract imports from @Module({ imports: [...] })
        const importsMatch = content.match(/imports:\s*\[([^\]]+)\]/s);
        const imports: string[] = [];
        const forwardRefs: string[] = [];
        
        if (importsMatch) {
            const importsContent = importsMatch[1];
            
            // Match forwardRef(() => ModuleName)
            const forwardRefRegex = /forwardRef\s*\(\s*\(\)\s*=>\s*(\w+Module)\s*\)/g;
            let match;
            while ((match = forwardRefRegex.exec(importsContent)) !== null) {
                forwardRefs.push(match[1]);
            }
            
            // Match direct ModuleName imports (not in forwardRef)
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
            path: relative(process.cwd(), filePath),
            imports,
            forwardRefs
        });
    }
    
    return modules;
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
            // Found cycle
            const cycleStart = path.indexOf(node);
            if (cycleStart !== -1) {
                cycles.push([...path.slice(cycleStart), node]);
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

function generateMermaidDiagram(modules: ModuleNode[]): string {
    const lines = ['graph TD'];
    const addedEdges = new Set<string>();
    
    // Group modules by area
    const groups = new Map<string, string[]>();
    for (const mod of modules) {
        const area = mod.path.split('/')[1] || 'root';
        if (!groups.has(area)) groups.set(area, []);
        groups.get(area)!.push(mod.name);
    }
    
    // Add subgraphs
    for (const [area, mods] of groups) {
        lines.push(`    subgraph ${area}["📁 ${area}"]`);
        for (const mod of mods) {
            lines.push(`        ${mod}`);
        }
        lines.push('    end');
        lines.push('');
    }
    
    // Add edges
    for (const mod of modules) {
        // Regular imports (solid lines)
        for (const imp of mod.imports) {
            const edge = `${imp} --> ${mod.name}`;
            if (!addedEdges.has(edge)) {
                lines.push(`    ${edge}`);
                addedEdges.add(edge);
            }
        }
        
        // Forward refs (dashed lines in red)
        for (const imp of mod.forwardRefs) {
            const edge = `${imp} -.->|forwardRef| ${mod.name}`;
            if (!addedEdges.has(edge)) {
                lines.push(`    ${imp} -.->|forwardRef| ${mod.name}`);
                addedEdges.add(edge);
            }
        }
    }
    
    // Style forwardRef edges in red
    lines.push('');
    lines.push('    linkStyle default stroke:#666,stroke-width:2px;');
    lines.push('    classDef forwardRef stroke:#f66,stroke-width:2px,stroke-dasharray: 5 5;');
    
    return lines.join('\n');
}

function generateDotGraph(modules: ModuleNode[]): string {
    const lines = [
        'digraph NestJSModules {',
        '    rankdir=TB;',
        '    node [shape=box, style=filled, fillcolor=lightblue, fontname="Arial"];',
        '    edge [fontname="Arial", fontsize=10];',
        ''
    ];
    
    // Group modules by area for clustering
    const groups = new Map<string, string[]>();
    for (const mod of modules) {
        const area = mod.path.split('/')[1] || 'root';
        if (!groups.has(area)) groups.set(area, []);
        groups.get(area)!.push(mod.name);
    }
    
    // Add clusters
    let clusterIndex = 0;
    for (const [area, mods] of groups) {
        lines.push(`    subgraph cluster_${clusterIndex} {`);
        lines.push(`        label="${area}";`);
        lines.push('        style=filled;');
        lines.push('        fillcolor=lightyellow;');
        for (const mod of mods) {
            lines.push(`        "${mod}";`);
        }
        lines.push('    }');
        lines.push('');
        clusterIndex++;
    }
    
    // Add edges
    const addedEdges = new Set<string>();
    for (const mod of modules) {
        // Regular imports
        for (const imp of mod.imports) {
            const edge = `    "${imp}" -> "${mod.name}";`;
            if (!addedEdges.has(edge)) {
                lines.push(edge);
                addedEdges.add(edge);
            }
        }
        
        // Forward refs (dashed, red)
        for (const imp of mod.forwardRefs) {
            const edge = `    "${imp}" -> "${mod.name}" [style=dashed, color=red, label="forwardRef"];`;
            if (!addedEdges.has(edge)) {
                lines.push(edge);
                addedEdges.add(edge);
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
    
    const forwardRefCount = modules.reduce((acc, m) => acc + m.forwardRefs.length, 0);
    console.log(`🔗 Found ${forwardRefCount} forwardRef dependencies`);
    
    console.log('\n🔍 Looking for circular dependencies...');
    const cycles = findCircularDependencies(modules);
    if (cycles.length > 0) {
        console.log(`⚠️  Found ${cycles.length} circular dependency chains:`);
        for (const cycle of cycles) {
            console.log('   → ' + cycle.join(' → '));
        }
    } else {
        console.log('✅ No circular dependencies found');
    }
    
    // Generate outputs
    const outputDir = join(process.cwd(), 'dist-graph');
    try {
        mkdirSync(outputDir, { recursive: true });
    } catch (e) {
        // Directory might already exist
    }
    
    console.log('\n🎨 Generating visualizations...');
    
    const mermaid = generateMermaidDiagram(modules);
    writeFileSync(join(outputDir, 'modules.mmd'), mermaid);
    
    const dot = generateDotGraph(modules);
    writeFileSync(join(outputDir, 'modules.dot'), dot);
    
    // Generate summary report
    const report = [
        '# Module Dependency Report',
        '',
        `## Summary`,
        `- Total modules: ${modules.length}`,
        `- Regular dependencies: ${modules.reduce((acc, m) => acc + m.imports.length, 0)}`,
        `- forwardRef dependencies: ${forwardRefCount}`,
        `- Circular dependency chains: ${cycles.length}`,
        '',
        '## Modules',
        ...modules.map(m => `- **${m.name}** (${m.path})`),
        '',
        '## Circular Dependencies',
        ...(cycles.length > 0 
            ? cycles.map(c => `- ${c.join(' → ')}`)
            : ['None found']),
        '',
        '## Module Details',
        ...modules.map(m => [
            '',
            `### ${m.name}`,
            `- Path: ${m.path}`,
            `- Regular imports: ${m.imports.join(', ') || 'None'}`,
            `- Forward refs: ${m.forwardRefs.join(', ') || 'None'}`
        ].join('\n'))
    ].join('\n');
    
    writeFileSync(join(outputDir, 'report.md'), report);
    
    console.log('\n📊 Output files:');
    console.log('   - dist-graph/modules.mmd (Mermaid diagram)');
    console.log('   - dist-graph/modules.dot (Graphviz DOT)');
    console.log('   - dist-graph/report.md (Summary report)');
    console.log('\n💡 To generate PNG from DOT:');
    console.log('   # For large graphs, use sfdp instead of dot:');
    console.log('   sfdp -Tpng dist-graph/modules.dot -o dist-graph/modules.png');
    console.log('   # Alternative engines if sfdp fails:');
    console.log('   neato -Tpng dist-graph/modules.dot -o dist-graph/modules.png');
    console.log('   fdp -Tpng dist-graph/modules.dot -o dist-graph/modules.png');
    console.log('\n💡 To view Mermaid diagram:');
    console.log('   - Open https://mermaid.live');
    console.log('   - Or install the Mermaid extension in VS Code');
}

main();
