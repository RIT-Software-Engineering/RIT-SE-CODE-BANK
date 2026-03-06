import {index} from "./index.js";
import {lexer} from "./lexer.js";
import {instructionLevel, parseInstruction} from "./parser.js";
import {encodeInstruction} from "./encodeInstruction.js";

const indexOutput = index("   MOV R1     , R2      ; move R1 into R2\n" +
                "ADD   # 5, R3\n" +
                "\n" +
                "    ; a full-line comment\n" +
                "SUB (R2)+, R4   ; subtract\n" +
                "CLR 100(R5);");
const lexerOutput = lexer(indexOutput[0]);
// const parserOutput = instructionLevel(lexerOutput);
const instructionOutput = parseInstruction(lexerOutput);
const encodingOutput = encodeInstruction(instructionOutput);

console.log(indexOutput);
console.log(lexerOutput);
// console.log(parserOutput);
console.log(instructionOutput);
console.log(encodingOutput);

