import { Decode } from "./decode.js";

const decoder = new Decode();

function test(oct) {
    const instr = parseInt(oct, 8);
    const decoded = decoder.decode(instr);
    console.log(`INSTR ${oct} →`, decoded);
}

// --- REAL PDP‑11 INSTRUCTIONS ---

// Double operand
test("012102");   // MOV R1,R2
test("022304");   // CMP R3,R4
test("032506");   // BIT R5,R6
test("042203");   // BIC R2,R3
test("052007");   // BIS R0,R7
test("062102");   // ADD R1,R2
test("163104");

// Single operand
test("005000");   // CLR R0
test("005203");   // INC R3
test("005304");   // DEC R4
test("005707");   // TST R7
test("000122");   // JMP R2

// Branches
test("000402");   // BR
test("001406");   // BEQ
test("001002");   // BNE
test("000207");   // BMI
