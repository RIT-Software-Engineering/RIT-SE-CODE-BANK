import { preProcess } from "./pre_process.js";
import { lexer } from "./lexer.js";
import { parseLine } from "./parser.js";
import { encodeLine } from "./encodeLine.js";
import { firstPass } from "./pass1.js";

export function assemble(text) {
    const lines = preProcess(text);
    const ast = [];

    for(let line of lines) {
        const tokens = lexer(line);
        const parsed = parseLine(tokens);
        ast.push(parsed);
    }

    //console.log(ast);
    
    const {symbols, annotatedAst} = firstPass(ast);

    //Works as pass two instead of creating a new file
    const words = [];
    let lc2 = 0;
    for(let data of annotatedAst) {
        const encoded = encodeLine(data, symbols, lc2);
        words.push(...encoded);
        lc2 += data.size;
    }

    return words;
}