import { OPCODES } from "./opcodes.js";

/**
 * Performs the first pass of assembly. Assigns addresses to each parsed line,
 * computes the size of every instruction or directive, updates the location
 * counter, and builds the symbol table for all labels encountered. Returns
 * both the completed symbol table and the annotated AST for use in pass two.
 * @param {object[]} parsedData The parsed assembly lines from the lexer.
 * @return {{symbols: object, annotatedAst: object[]}} The symbol table and
 *         address‑annotated AST.
 */
export function firstPass(parsedData) {
    let lc = 0;
    const symbols = {};

    for(const data of parsedData) {
        data.address = lc;
        data.size = computeSize(data);
        lc += data.size;

        if(data.label != null) {
            symbols[data.label] = data.address;
        }
    }
    return {symbols, annotatedAst: parsedData};
}

/**
 * Computes the size in bytes of a parsed line based on whether it is an
 * instruction, directive, or label‑only line. Delegates to the appropriate
 * size helper for instructions and directives.
 * @param {object} data A single parsed AST node.
 * @return {number} The size in bytes contributed by this line.
 */
function computeSize(data) {
    let size = 0;

    if(data.type == "instruction") {
        size = computeInstructionSize(data);
    } 
    else if(data.type == "directive") {
        size = computeDirectiveSize(data);
    } else { //used for label-only lines
        size = 0;
    }

    return size;
}

/**
 * Computes the size of an instruction in bytes. All PDP‑11 instructions are
 * at least one word (2 bytes). Additional words are added for source or
 * destination operands that require an extra offset word.
 * @param {object} data The parsed instruction node.
 * @return {number} The total size of the instruction in bytes.
 */
function computeInstructionSize(data) {
    let size = 2;

    if(data.src != null && data.src.offset != null) {
        size += 2;
    }
    if(data.dst != null && data.dst.offset != null) {
        size += 2;
    }
    return size;
}

/**
 * Computes the size in bytes of an assembler directive.
 * @param {object} data The parsed directive node.
 * @return {number} The size in bytes allocated or emitted by the directive.
 */
function computeDirectiveSize(data) {
    switch(data.directive) {
        case(".WORD"):
            return 2 * data.args.length;
        case(".BYTE"):
            return 1 * data.args.length;
        case(".ASCIZ"):
            return data.args.length + 1;
        case(".ASCII"):
            return data.args.length;
        case(".BLKW"):
            return 2 * parseInt(data.args[0]);
        case(".BLKB"):
            return parseInt(data.args[0]);
        case(".END"):
            return 0;
        default:
            return 0;
    }
}