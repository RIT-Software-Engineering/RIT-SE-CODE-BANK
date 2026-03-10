import { assemble } from "./assembler/index.js";
import { CPU } from "./cpu.js";

const cpu = new CPU();

export const backend = {
    loadAssembly(text) {
        const words = assemble(text);
        
    },

    step() {
        cpu.step();
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
            memory: cpu.getMemory()
        }
    }
}