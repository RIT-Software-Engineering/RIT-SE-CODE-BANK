import { CPU } from "../cpu.js"
import { Memory } from "../memory.js"
import { backend } from "../backend.js"
import { test, expect, describe } from "vitest";

function run(program) {
    backend.reset();
    backend.loadAssembly(program);
    backend.run();
    return backend.getState();
}

describe("Arithmetic Instruction Tests", () => {

    //ADD
    test("ADD immediate", () => {
        const state = run(`
            MOV #0xA, R0
            ADD #0x5, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0xF);
        expect(state.flags.Z).toBe(false);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
        expect(state.flags.C).toBe(false);
    });

    test("ADD overflow", () => {
        const state = run(`
            MOV #0x7FFF, R0
            ADD #0x1, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x8000);
        expect(state.flags.V).toBe(true);
        expect(state.flags.N).toBe(true);
    });

    test("ADD wraparound (0xFFFF + 1 → 0x0000)", () => {
        const state = run(`
            MOV #0xFFFF, R0
            ADD #0x1, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x0000);
        expect(state.flags.Z).toBe(true);
        expect(state.flags.C).toBe(true);
        expect(state.flags.N).toBe(false);
    });

    //SUB
    test("SUB immediate", () => {
        const state = run(`
            MOV #0xA, R0
            SUB #0x3, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x7);
        expect(state.flags.Z).toBe(false);
    });

    test("SUB borrow", () => {
        const state = run(`
            MOV #0x0, R0
            SUB #0x1, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0xFFFF);
        expect(state.flags.C).toBe(true);   // borrow
        expect(state.flags.N).toBe(true);
    });

    test("SUB overflow (0x8000 - 1 → 0x7FFF)", () => {
        const state = run(`
            MOV #0x8000, R0
            SUB #0x1, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x7FFF);
        expect(state.flags.V).toBe(true);
        expect(state.flags.N).toBe(false);
    });

    //CMP
    test("CMP equal", () => {
        const state = run(`
            MOV #0x2A, R0
            MOV #0x2A, R1
            CMP R0, R1
        `);

        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
        expect(state.flags.C).toBe(false);
    });

    test("CMP less than", () => {
        const state = run(`
            MOV #0x1, R0
            MOV #0x5, R1
            CMP R0, R1
        `);

        // result = 1 - 5 = -4 = 0xFFFC
        expect(state.flags.N).toBe(true);
        expect(state.flags.C).toBe(true);
        expect(state.flags.Z).toBe(false);
    });

    test("CMP greater than", () => {
        const state = run(`
            MOV #0x10, R0
            MOV #0x5, R1
            CMP R0, R1
        `);

        // result = 16 - 5 = 11
        expect(state.flags.N).toBe(false);
        expect(state.flags.C).toBe(false);
        expect(state.flags.Z).toBe(false);
    });

    test("CMP overflow (0x8000 - 0x7FFF)", () => {
        const state = run(`
            MOV #0x8000, R0
            MOV #0x7FFF, R1
            CMP R0, R1
        `);

        // result = -32768 - 32767 = overflow
        expect(state.flags.V).toBe(true);
    });

});