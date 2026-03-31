import {preProcess} from "./pre_process.js";
import {lexer} from "./lexer.js";
import {parseLine} from "./parser.js";
import {encodeLine} from "./encodeLine.js";
import { assemble } from "./index.js";
import { firstPass } from "./pass1.js";

const data = "   MOV R1     , R2      ; move R1 into R2\n" +
                ";ADD   # 5, R3\n" +
                "\n" +
                "    ; a full-line comment\n" +
                ";SUB (R2)+, R4   ; subtract\n" +
                ";CLR 100(R2);"

const data2 = `
VALUE:
MOV @#VALUE, R0
`;

assemble(data2);


