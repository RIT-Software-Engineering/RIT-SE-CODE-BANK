import { preProcess } from "./pre_process.js";
import { lexer } from "./lexer.js";
import { parseLine } from "./parser.js";
import { encodeLine } from "./encodeLine.js";
import { firstPass } from "./pass1.js";

/**
 * Runs the full two‑pass assembly pipeline on raw source text. Preprocesses
 * the input into cleaned lines, tokenizes and parses each line into an AST (Abstract Syntax Tree),
 * performs pass one to assign addresses and build the symbol table, and then
 * encodes all instructions and directives in pass two. Returns the final
 * flat array of machine‑code words.
 * @param {string} text The raw assembly source code.
 * @return {number[]} The complete list of encoded machine‑code words.
 */
export function assemble(text) {
    const lines = preProcess(text);
    const ast = [];

    for(let line of lines) {
        const tokens = lexer(line);
        const parsed = parseLine(tokens);
        ast.push(parsed);
    }
    
    const {symbols, annotatedAst} = firstPass(ast);

    //Works as pass two instead of creating a new file
    const words = [];
    let lc2 = 0o200;
    for(let data of annotatedAst) {
        const encoded = encodeLine(data, symbols, lc2);
        words.push(...encoded);
        lc2 += data.size;
    }

    return words;
}