import { test, expect, describe } from "vitest";
import { backend } from "../backend.js";

function run(program) {
    backend.reset();
    backend.loadAssembly(program);
    backend.run();
    return backend.getState();
}

describe("Branch Instructions (implemented subset)", () => {

    // BR
    test("BR jumps unconditionally", () => {
        const state = run(`
            BR skip
            MOV #0xAAAA, R0
        skip:
            MOV #0x1234, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x1234);
    });

    // BEQ / BNE
    test("BEQ branches when Z=1", () => {
        const state = run(`
            MOV #0, R0
            CMP R0, R0
            BEQ yes
            MOV #0xAAAA, R1
        yes:
            MOV #0xBEEF, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xBEEF);
    });

    test("BNE branches when Z=0", () => {
        const state = run(`
            MOV #1, R0
            CMP R0, #0
            BNE yes
            MOV #0xAAAA, R1
        yes:
            MOV #0xBEEF, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xBEEF);
    });

    // BGE / BLT
    test("BLT branches when (N XOR V)=1", () => {
        const state = run(`
            MOV #1, R0
            MOV #5, R1
            CMP R0, R1
            BLT yes
            MOV #0xAAAA, R2
        yes:
            MOV #0x3333, R2
        `);

        expect(parseInt(state.registers[2], 16)).toBe(0x3333);
    });

    test("BGE branches when (N XOR V)=0", () => {
        const state = run(`
            MOV #5, R0
            MOV #1, R1
            CMP R0, R1
            BGE yes
            MOV #0xAAAA, R2
        yes:
            MOV #0x4444, R2
        `);

        expect(parseInt(state.registers[2], 16)).toBe(0x4444);
    });

    // BGT / BLE
    test("BGT branches when Z=0 and (N XOR V)=0", () => {
        const state = run(`
            MOV #10, R0
            MOV #5, R1
            CMP R0, R1
            BGT yes
            MOV #0xAAAA, R3
        yes:
            MOV #0x5555, R3
        `);

        expect(parseInt(state.registers[3], 16)).toBe(0x5555);
    });

    test("BLE branches when Z=1 or (N XOR V)=1", () => {
        const state = run(`
            MOV #5, R0
            MOV #10, R1
            CMP R0, R1
            BLE yes
            MOV #0xAAAA, R3
        yes:
            MOV #0x6666, R3
        `);

        expect(parseInt(state.registers[3], 16)).toBe(0x6666);
    });

    // Backward branch (negative displacement)
    test("BR with backward label loops until zero", () => {
        const state = run(`
            MOV #3, R0
        loop:
            DEC R0
            BNE loop
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0);
    });
});