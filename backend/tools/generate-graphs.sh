#!/bin/bash
# Script to generate module dependency graphs
# Usage: ./tools/generate-graphs.sh [options]
#
# Options:
#   --full       Generate full module graph (default)
#   --circular   Generate circular dependency focused graph
#   --horizontal Generate horizontal (left-to-right) layout
#   --html       Generate interactive HTML viewer
#   --all        Generate all graphs
#   --help       Show this help message

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/dist-graph"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    grep '^#' "$0" | cut -c4-
    exit 0
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check dependencies
check_deps() {
    if ! command -v npx &> /dev/null; then
        log_error "npx not found. Please install Node.js"
        exit 1
    fi

    # Check for graphviz
    if command -v sfdp &> /dev/null; then
        GRAPHVIZ_ENGINE="sfdp"
        log_info "Using graphviz engine: sfdp"
    elif command -v dot &> /dev/null; then
        GRAPHVIZ_ENGINE="dot"
        log_warning "sfdp not found, falling back to dot (may fail on large graphs)"
    else
        log_error "Graphviz not found. Install with: sudo apt-get install graphviz"
        exit 1
    fi
}

# Generate PNG from DOT file
generate_png() {
    local dot_file="$1"
    local png_file="${dot_file%.dot}.png"
    local engine="${2:-sfdp}"

    if [[ ! -f "$dot_file" ]]; then
        log_error "DOT file not found: $dot_file"
        return 1
    fi

    log_info "Generating PNG: $png_file (using $engine)..."

    if "$engine" -Tpng "$dot_file" -o "$png_file" 2>&1; then
        log_success "Created: $png_file"
        return 0
    else
        # Try fallback engines
        if [[ "$engine" != "neato" ]] && command -v neato &> /dev/null; then
            log_warning "$engine failed, trying neato..."
            if neato -Tpng "$dot_file" -o "$png_file" 2>&1; then
                log_success "Created: $png_file (using neato)"
                return 0
            fi
        fi

        if [[ "$engine" != "fdp" ]] && command -v fdp &> /dev/null; then
            log_warning "Trying fdp..."
            if fdp -Tpng "$dot_file" -o "$png_file" 2>&1; then
                log_success "Created: $png_file (using fdp)"
                return 0
            fi
        fi

        log_error "Failed to generate PNG from: $dot_file"
        return 1
    fi
}

# Generate full module graph
generate_full() {
    log_info "Generating full module dependency graph..."

    cd "$PROJECT_DIR"
    npx ts-node tools/graph-modules-simple.ts

    if [[ -f "$OUTPUT_DIR/modules.dot" ]]; then
        generate_png "$OUTPUT_DIR/modules.dot" "$GRAPHVIZ_ENGINE"
    fi
}

# Generate circular dependency graph
generate_circular() {
    log_info "Generating circular dependency focused graph..."

    cd "$PROJECT_DIR"
    npx ts-node tools/graph-circular-only.ts

    if [[ -f "$OUTPUT_DIR/circular-focused.dot" ]]; then
        generate_png "$OUTPUT_DIR/circular-focused.dot" "$GRAPHVIZ_ENGINE"
    fi
}

generate_horizontal() {
    log_info "Generating horizontal layout..."

    cd "$PROJECT_DIR"
    npx ts-node tools/graph-horizontal.ts

    if [[ -f "$OUTPUT_DIR/modules-horizontal.dot" ]]; then
        # Horizontal layout often works better with dot
        generate_png "$OUTPUT_DIR/modules-horizontal.dot" "dot"
    fi
}

generate_html() {
    log_info "Generating interactive HTML viewer..."

    cd "$PROJECT_DIR"
    npx ts-node tools/graph-html-viewer.ts

    log_success "HTML viewer generated at: $OUTPUT_DIR/modules-viewer.html"
}

# Main
main() {
    local mode="full"

    case "${1:-}" in
        --help|-h)
            show_help
            ;;
        --full)
            mode="full"
            ;;
        --circular)
            mode="circular"
            ;;
        --horizontal)
            mode="horizontal"
            ;;
        --html)
            mode="html"
            ;;
        --all)
            mode="all"
            ;;
        "")
            mode="full"
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac

    check_deps

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    case "$mode" in
        full)
            generate_full
            ;;
        circular)
            generate_circular
            ;;
        all)
            generate_full
            generate_circular
            generate_horizontal
            generate_html
            ;;
    esac

    log_success "Done! Output files in: $OUTPUT_DIR/"
    ls -lh "$OUTPUT_DIR/" 2>/dev/null | grep -E '\.(dot|png|mmd|md)$' || true
}

main "$@"
