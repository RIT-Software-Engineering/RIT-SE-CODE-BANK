import {preProcess} from "./pre_process.js";
import {lexer} from "./lexer.js";
import {parseInstruction} from "./parser.js";
import {encodeInstruction} from "./encodeInstruction.js";
import { assemble } from "./index.js";

const data = "   MOV R1     , R2      ; move R1 into R2\n" +
                "ADD   # 5, R3\n" +
                "\n" +
                "    ; a full-line comment\n" +
                "SUB (R2)+, R4   ; subtract\n" +
                "CLR 100(R2);"

const data2 = "MOV R1, R2";

// const processOutput = preProcess();
// const lexerOutput = lexer(processOutput[0]);
// // const parserOutput = instructionLevel(lexerOutput);
// const instructionOutput = parseInstruction(lexerOutput);
// const encodingOutput = encodeInstruction(instructionOutput);

// console.log(processOutput);
// console.log(lexerOutput);
// // console.log(parserOutput);
// console.log(instructionOutput);
// console.log(encodingOutput);
console.log(assemble(data));


