import { preProcess } from "./pre_process.js";
import { lexer } from "./lexer.js";
import { parseInstruction } from "./parser.js";
import { encodeInstruction } from "./encodeInstruction.js";

export function assemble(text) {
    const lines = preProcess(text);
    const words = [];

    for(let line of lines) {
        const tokens = lexer(line);
        const parsed = parseInstruction(tokens);
        const encoded = encodeInstruction(parsed);

        words.push(...encoded);
    }

    return words;
}