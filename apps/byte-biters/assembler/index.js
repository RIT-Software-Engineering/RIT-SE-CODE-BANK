import { preProcess } from "./pre_process.js";
import { lexer } from "./lexer.js";
import { parseLine } from "./parser.js";
import { encodeLine } from "./encodeInstruction.js";

export function assemble(text) {
    const lines = preProcess(text);
    const words = [];

    for(let line of lines) {
        const tokens = lexer(line);
        const parsed = parseLine(tokens);
        console.log(parsed);
        const encoded = encodeLine(parsed);

        words.push(...encoded);
    }

    return words;
}