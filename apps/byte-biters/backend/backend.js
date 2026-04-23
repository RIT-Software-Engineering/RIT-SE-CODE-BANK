import { assemble } from "../assembler/index.js";
import { CPU } from "./cpu.js";

const cpu = new CPU();

export const backend = {
    loadAssembly(text) {
        const words = assemble(text);
        cpu.loadProgram(words);
        // cpu.reset();
        return this.getState();
    },

    step() {
        cpu.step();
        return this.getState();
    },

    backStep() {
        cpu.backStep();
        return this.getState();
    },

    run() {
        while(!cpu.halted){
            cpu.step();
        }
        return this.getState();
    },

    reset() {
        cpu.reset();
        return this.getState();
    },

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