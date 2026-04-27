import { test, expect, describe } from "vitest";
import { backend } from "../backend.js";

function run(program) {
    backend.reset();
    backend.loadAssembly(program);
    backend.run();
    return backend.getState();
}

describe("Single-Operand and Logical Instructions", () => {

    // MOV
    test("MOV immediate to register", () => {
        const state = run(`
            MOV #0x1234, R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x1234);
        expect(state.flags.N).toBe(false);
        expect(state.flags.Z).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    test("MOV sets N when high bit is set", () => {
        const state = run(`
            MOV #0x8000, R0
        `);

        expect(state.flags.N).toBe(true);
        expect(state.flags.Z).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    test("MOV sets Z when value is zero", () => {
        const state = run(`
            MOV #0x0, R0
        `);

        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    // CLR
    test("CLR sets register to zero and flags correctly", () => {
        const state = run(`
            MOV #0xFFFF, R0
            CLR R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x0000);
        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
        expect(state.flags.C).toBe(false);
    });

    // INC
    test("INC increments normally", () => {
        const state = run(`
            MOV #0x0005, R0
            INC R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x0006);
        expect(state.flags.Z).toBe(false);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    test("INC overflow (0x7FFF → 0x8000)", () => {
        const state = run(`
            MOV #0x7FFF, R0
            INC R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x8000);
        expect(state.flags.V).toBe(true);
        expect(state.flags.N).toBe(true);
        expect(state.flags.Z).toBe(false);
    });

    test("INC wraparound (0xFFFF → 0x0000)", () => {
        const state = run(`
            MOV #0xFFFF, R0
            INC R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x0000);
        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    // DEC
    test("DEC decrements normally", () => {
        const state = run(`
            MOV #0x0005, R0
            DEC R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x0004);
        expect(state.flags.N).toBe(false);
        expect(state.flags.Z).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    test("DEC overflow (0x8000 → 0x7FFF)", () => {
        const state = run(`
            MOV #0x8000, R0
            DEC R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0x7FFF);
        expect(state.flags.V).toBe(true);
        expect(state.flags.N).toBe(false);
    });

    test("DEC wraparound (0x0000 → 0xFFFF)", () => {
        const state = run(`
            MOV #0x0000, R0
            DEC R0
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0xFFFF);
        expect(state.flags.N).toBe(true);
        expect(state.flags.Z).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    // BIT
    test("BIT sets Z when no bits overlap", () => {
        const state = run(`
            MOV #0x00F0, R0
            MOV #0x000F, R1
            BIT R0, R1
        `);

        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    test("BIT sets N when high bit is set", () => {
        const state = run(`
            MOV #0x8000, R0
            MOV #0xFFFF, R1
            BIT R0, R1
        `);

        expect(state.flags.N).toBe(true);
        expect(state.flags.Z).toBe(false);
    });

    // BIC
    test("BIC clears bits correctly", () => {
        const state = run(`
            MOV #0x00FF, R0
            MOV #0xF0F0, R1
            BIC R0, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xF000);
        expect(state.flags.N).toBe(true);
        expect(state.flags.Z).toBe(false);
    });

    // BIS
    test("BIS sets bits correctly", () => {
        const state = run(`
            MOV #0x00F0, R0
            MOV #0x000F, R1
            BIS R0, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0x00FF);
        expect(state.flags.N).toBe(false);
        expect(state.flags.Z).toBe(false);
    });

});