import { test, expect, describe } from "vitest";
import { backend } from "../backend.js";

function run(program) {
    backend.reset();
    backend.loadAssembly(program);
    backend.run();
    return backend.getState();
}

describe("Autoincrement / Autodecrement Addressing Modes", () => {

    // (Rn)+ — autoincrement
    test("(R0)+ increments R0 by 2 after read", () => {
        const state = run(`
            MOV #0x100, R0
            MOV #0xBEEF, @#0x100
            MOV (R0)+, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xBEEF);
        expect(parseInt(state.registers[0], 16)).toBe(0x102);
    });

    // @(Rn)+ — autoincrement deferred
    test("@(R0)+ increments R0 by 2 and dereferences pointer", () => {
        const state = run(`
            MOV #0x200, R0
            MOV #0x300, @#0x200
            MOV #0xBEEF, @#0x300
            MOV @(R0)+, R1
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xBEEF);
        expect(parseInt(state.registers[0], 16)).toBe(0x202);
    });

    // -(Rn) — autodecrement
    test("-(R0) decrements R0 by 2 before read", () => {
        const state = run(`
            MOV #0x104, R0
            MOV #0xBEEF, @#0x102
            MOV -(R0), R1
            halt
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xBEEF);
        expect(parseInt(state.registers[0], 16)).toBe(0x102);
    });

    // @-(Rn) — autodecrement deferred
    test("@-(R0) decrements R0 by 2 then dereferences pointer", () => {
        const state = run(`
            MOV #0x106, R0
            MOV #0x300, @#0x104
            MOV #0xBEEF, @#0x300
            MOV @-(R0), R1
            halt
        `);

        expect(parseInt(state.registers[1], 16)).toBe(0xBEEF);
        expect(parseInt(state.registers[0], 16)).toBe(0x104);
    });

    // PC indexed — X(PC)
    test("PC indexed X(PC) resolves correctly", () => {
        const state = run(`
start:
            MOV 2(PC), R0
            .WORD 0xBEEF
            halt
        `);

        expect(parseInt(state.registers[0], 16)).toBe(0xBEEF);
    });
});
