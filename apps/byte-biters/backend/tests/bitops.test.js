import { test, expect, describe } from "vitest";
import { backend } from "../backend.js";

function run(program) {
    backend.reset();
    backend.loadAssembly(program);
    backend.run();
    return backend.getState();
}

describe("BIT / BIC / BIS / CLR / TST", () => {

    // BIT
    test("BIT sets Z when no bits overlap", () => {
        const state = run(`
            MOV #0b0101, R0
            MOV #0b1010, R1
            BIT R0, R1
        `);

        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
    });

    test("BIT sets N when high bit of AND is 1", () => {
        const state = run(`
            MOV #0x8000, R0
            MOV #0xFFFF, R1
            BIT R0, R1
        `);

        expect(state.flags.N).toBe(true);
        expect(state.flags.Z).toBe(false);
    });

    // BIC
    test("BIC clears bits where source has 1s", () => {
        const state = run(`
            MOV #0b1010, R0
            MOV #0b1111, R1
            BIC R0, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0b0101);
    });

    // BIS
    test("BIS sets bits where source has 1s", () => {
        const state = run(`
            MOV #0b0101, R0
            MOV #0b1010, R1
            BIS R0, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0b1111);
    });

    // CLR
    test("CLR writes zero and sets Z=1, N=V=C=0", () => {
        const state = run(`
            MOV #0xFFFF, R0
            CLR R0
            HALT
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0);
        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
        expect(state.flags.V).toBe(false);
        expect(state.flags.C).toBe(false);
    });

    // TST
    test("TST sets N when high bit is 1", () => {
        const state = run(`
            MOV #0x8000, R0
            TST R0
            HALT
        `);

        expect(state.flags.N).toBe(true);
        expect(state.flags.Z).toBe(false);
        expect(state.flags.V).toBe(false);
        expect(state.flags.C).toBe(false);
    });

    test("TST sets Z when operand is zero", () => {
        const state = run(`
            MOV #0, R0
            TST R0
            HALT
        `);

        expect(state.flags.Z).toBe(true);
        expect(state.flags.N).toBe(false);
    });

});