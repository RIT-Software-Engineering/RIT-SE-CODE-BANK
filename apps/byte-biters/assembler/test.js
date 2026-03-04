import {index} from "./index.js";
import {lexer} from "./lexer.js";
import {instructionLevel} from "./parser.js";

const indexOutput = index("   MOV R1     , R2      ; move R1 into R2\n" +
                "ADD   #5, R3\n" +
                "\n" +
                "    ; a full-line comment\n" +
                "SUB (R2)+, R4   ; subtract\n" +
                "CLR;");
const lexerOutput = lexer(indexOutput[1]);
const parserOutput = instructionLevel(lexerOutput);

console.log(indexOutput);
console.log(lexerOutput);
console.log(parserOutput);

