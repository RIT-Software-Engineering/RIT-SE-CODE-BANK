import { Decode } from "./decode.js";
import { backend } from "./backend.js";

const decoder = new Decode();

const data = "   MOV R1     , R2      ; move R1 into R2\n" +
                "ADD   # 5, R3\n" +
                "\n" +
                "    ; a full-line comment\n" +
                "SUB (R2)+, R4   ; subtract\n" +
                "CLR 100(R2);"

function test(oct) {
    const instr = parseInt(oct, 8);
    const decoded = decoder.decode(instr);
    console.log(`INSTR ${oct} →`, decoded);
}

function readWordFromBytes(mem, addr) {
    const low  = mem[addr];
    const high = mem[addr + 1];
    return (high << 8) | low;
}

// --- REAL PDP‑11 INSTRUCTIONS ---

// Double operand
// test("012102");   // MOV R1,R2
// test("022304");   // CMP R3,R4
// test("032506");   // BIT R5,R6
// test("042203");   // BIC R2,R3
// test("052007");   // BIS R0,R7
// test("062102");   // ADD R1,R2
// test("163104");

// // Single operand
// test("005000");   // CLR R0
// test("005203");   // INC R3
// test("005304");   // DEC R4
// test("005707");   // TST R7
// test("000122");   // JMP R2

// // Branches
// test("000402");   // BR
// test("001406");   // BEQ
// test("001002");   // BNE
// test("000207");   // BMI

//MOV #5, R0
// CMP #10, R0
// HALT

//these currently fail, look into


const program = `
MOV #0x0001, R0
ADD #0x000F, R0
HALT
`;

backend.loadAssembly(program);
const result = backend.run();
console.log(readWordFromBytes(result.memory, 210));
console.log(result.flags);
console.log(result.registers);


