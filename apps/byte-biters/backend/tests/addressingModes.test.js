import { test, expect, describe } from "vitest";
import { backend } from "../backend.js";

function run(program) {
    backend.reset();
    backend.loadAssembly(program);
    backend.run();
    return backend.getState();
}

describe("Addressing Modes", () => {

    // Register mode: Rn
    test("Register mode uses register value directly", () => {
        const state = run(`
            MOV #0x1234, R0
            MOV R0, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0x1234);
    });

    // Register deferred: (Rn)
    test("Register deferred loads from memory at address in register", () => {
        const state = run(`
            MOV #0x200, R0
            MOV #0xABCD, @R0
            MOV @R0, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xABCD);
    });

    // Autoincrement: (Rn)+
    test("Autoincrement reads from memory and increments register by 2", () => {
        const state = run(`
            MOV #0x200, R0
            MOV #0xBEEF, @R0
            MOV (R0)+, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xBEEF);
        expect(parseInt(state.registers[0], 16)).toBe(0x0202);
    });

    // Autodecrement: -(Rn)
    test("Autodecrement decrements register by 2 then reads from memory", () => {
        const state = run(`
            MOV #0x204, R0
            MOV #0xCAFE, @#0x202
            MOV -(R0), R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xCAFE);
        expect(parseInt(state.registers[0], 16)).toBe(0x0202);
    });

    // Indexed: X(Rn)
    test("Indexed mode adds displacement to register to form address", () => {
        const state = run(`
            MOV #0x100, R0
            MOV #0xDEAD, @#0x110
            MOV 0x10(R0), R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xDEAD);
    });

    test("PC-relative addressing uses PC + displacement", () => {
        const state = run(`
        start:
            MOV (PC), R0
            .WORD 0xBEEF
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0xBEEF);
    });

    // PC-relative immediate: #value (PC autoinc)
    test("Immediate mode via PC autoincrement loads literal", () => {
        const state = run(`
            MOV #0x1234, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x1234);
    });

});