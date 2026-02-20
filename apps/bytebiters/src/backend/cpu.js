import {REG} from "./registers.js";
import {Decode} from "./decode.js";

const decoder = new Decode();

export class CPU {
    constructor() {
        this.registers = new Uint16Array(8);
        this.memory = new Uint8Array(65536);

        //flag setup
        this.N = 0;
        this.Z = 0;
        this.V = 0;
        this.C = 0;

        //initial values for the Stack pointer and Point Counter Registers
        this.registers[REG.SP] = 0o10000;
        this.registers[REG.PC] = 0o200;
    }

    readWord(Addr) {
        let lowWord = this.memory[Addr];
        let HighWord = (this.memory[Addr + 1] << 8);
        return HighWord + lowWord;
    }

    writeWord(Word, Addr) {
        let lowByte = Word & 0xFF;
        let highByte = (Word >> 8) & 0xFF;
        this.memory[Addr] = lowByte;
        this.memory[Addr + 1] = highByte;
    }

    fetch() {
        const pc = this.registers[REG.PC];
        const instr = this.readWord(pc);
        this.registers[REG.PC] = (pc + 2) & 0xFFFF;
        return instr;
    }

    step() {
        const instr = this.fetch();
        const oper = this.decoder.decode(instr);
        this.execute(oper);
    }

    resolveSource(mode, reg){
        switch(mode){
            case 0:
                return {
                    value: this.registers[reg],
                    reg: reg,
                    isRegister: true
                };
            case 1:
                return {
                    value: this.readWord(this.registers[reg]),
                    address: this.registers[reg],
                    isRegister: false
                };
            case 2:
                let newValue = this.registers[reg];
                this.registers[reg] += 2
                return {
                    value: this.readWord(newValue),
                    address: newValue,
                    isRegister: false
                };
            case 3:
                let initialReg = this.registers[reg];
                let firstPointer = this.readWord(initialReg);
                this.registers[reg] += 2;
                return {
                    value: this.readWord(firstPointer),
                    address: firstPointer,
                    isRegister: false
                };
            case 4:
                this.registers[reg] -= 2;
                return {
                    value: this.readWord(this.registers[reg]),
                    address: this.registers[reg],
                    isRegister: false
                }
            case 5:
                this.registers[reg] -= 2;
                let firstPointerDec = this.readWord(this.registers[reg]);
                return {
                    value: this.readWord(firstPointerDec),
                    address: firstPointerDec,
                    isRegister: false
                };
            case 6:
                //do something for indexed
                break;
            case 7:
                //do something for indexed deferred
        }
    }

    execute(oper){
        switch(oper.type){
            case 'MOV':
                this.mov(oper.src, oper.dst);
                break;
        }
    }

    mov(src, dst) {

    }
}