import { assemble } from "../assembler/index.js";
import { CPU } from "./cpu.js";

const cpu = new CPU();

/**
 * Backend interface for the frontend. Provides higher-level operations
 * and exposes the current cpu state.
 */
export const backend = {
    /**
     * Assembles the provided source code, loads it into the cpu,
     * and returns the initial state
     * @param {string} text The raw code taken from the code editor
     * @return {object} The initial state
     */
    loadAssembly(text) {
        const words = assemble(text);
        cpu.loadProgram(words);
        // cpu.reset();
        return this.getState();
    },

    /**
     * Executes a single CPU instruction and returns the updated state.
     */
    step() {
        cpu.step();
        return this.getState();
    },

    /**
     * Reverts the CPU to the previous state (if available) and returns the result.
     */
    backStep() {
        cpu.backStep();
        return this.getState();
    },

    /**
     * Runs instructions until the CPU halts, then returns the final state.
     */
    run() {
        while(!cpu.halted){
            cpu.step();
        }
        return this.getState();
    },

    /**
     * Resets the CPU to its initial state and returns the cleared state.
     */
    reset() {
        cpu.reset();
        return this.getState();
    },

    /**
     * Returns the current CPU state in a format suitable for the frontend.
     */
    getState() {
        return {
            registers: cpu.getRegisters(),
            flags: cpu.getFlags(),
            memory: cpu.getMemory(),
            canBackStep: cpu.getPastState().length > 0,
            isAssembled: cpu.getAssembledState(),
            halted: cpu.getHaltedState()
        }
    }
}