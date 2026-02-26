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

        if(oper.src) {
            oper.src = this.resolveSource(oper.src.mode, oper.src.REG);
        }
        if(oper.dst) {
            oper.dst = this.resolveDestination(oper.dst.mode, oper.dst.REG);
        }

        this.execute(oper);
    }

    resolveSource(mode, reg){
        const base = this.registers[reg];
        switch(mode){
            case 0: //Normal Register
                return {
                    value: this.registers[reg],
                    reg: reg,
                    isRegister: true
                };
            case 1: //Register Deferred
                return {
                    value: this.readWord(this.registers[reg]),
                    address: this.registers[reg],
                    isRegister: false
                };
            case 2: //Autoincrement
                let newValue = this.registers[reg];
                this.registers[reg] += 2;
                return {
                    value: this.readWord(newValue),
                    address: newValue,
                    isRegister: false
                };
            case 3: //Autoincrement Deferred
                const pointer = this.readWord(base);
                const value = this.readWord(pointer)
                this.registers[reg] += 2;
                return {
                    value: value,
                    address: pointer,
                    isRegister: false
                };
            case 4: //Autodecrement
                this.registers[reg] -= 2;
                return {
                    value: this.readWord(this.registers[reg]),
                    address: this.registers[reg],
                    isRegister: false
                }
            case 5: //Autodecrement Deferred
                const newBase = this.registers[reg] - 2;
                const pointerDec = this.readWord(newBase);
                const valueDec = this.readWord(pointerDec);
                return {
                    value: valueDec,
                    address: pointerDec,
                    isRegister: false
                };
            case 6: //Indexed
                const index = this.fetch();
                return {
                    value: this.readWord(base + index),
                    address: base + index,
                    isRegister: false
                };
            case 7: //Indexed Deferred
                const index2 = this.fetch();
                const pointerInd = this.readWord(base + index2);
                const valueInd = this.readWord(pointerInd);
                return {
                    value: valueInd,
                    address: pointerInd,
                    isRegister: false
                };
        }
    }

    resolveDestination(mode, reg) {
        const base = this.registers[reg];   
        switch(mode){
            case 0: //Normal Register
                return {
                    value: this.registers[reg],
                    address: reg,
                    isRegister: true,
                    write: (val) => {this.registers[reg] = val; }
                };
            case 1: //Register Deferred
                return {
                    value: this.readWord(base),
                    address: base,
                    isRegister: false,
                    write: (val) => this.writeWord(val, base)
                };
            case 2: //Autoincrememnt
                const oldBase = this.registers[reg];
                const oldValue = this.readWord(oldBase);
                this.registers[reg] += 2;
                return {
                    value: oldValue,
                    address: oldBase,
                    isRegister: false,
                    write: (val) => this.writeWord(val, oldBase)
                };
            case 3: //Autoincrememnt deferred
                const pointer2 = this.readWord(base);
                const value2 = this.readWord(pointer2);
                this.registers[reg] += 2;
                return {
                    value: value2,
                    address:pointer2,
                    isRegister: false,
                    write: (val) => this.writeWord(val, pointer2)
                };
            case 4: //Autodecerement
                this.registers[reg] -= 2;
                const lowerBase = this.registers[reg];
                return {
                    value: this.readWord(lowerBase),
                    address: lowerBase,
                    isRegister: false,
                    write: (val) => this.writeWord(val, lowerBase)
                };
            case 5: //Autodecrement deferred
                this.registers[reg] -= 2;
                const lowerBaseDef = this.registers[reg];
                const pointerDef = this.readWord(lowerBaseDef);
                const valueDef = this.readWord(pointerDef);
                return {
                    value: valueDef,
                    address: pointerDef,
                    isRegister: false,
                    write: (val) => this.writeWord(val, pointerDef)
                };
            case 6: //Indexed
                const indexDst = this.fetch();
                return {
                    value: this.readWord(base + indexDst),
                    address: base + indexDst,
                    isRegister: false,
                    write: (val) => this.writeWord(val, (base + indexDst))
                }
            case 7: //Indexed deferred
                const index = this.fetch();
                const pointerIndDst = this.readWord(base + index);
                const valueIndDst = this.readWord(pointerIndDst);
                return {
                    value: valueIndDst,
                    address: pointerIndDst,
                    isRegister: false,
                    write: (val) => this.writeWord(val, pointerIndDst)
                };
        }
    }

    execute(oper) {
        switch(oper.type){
            case 'MOV':
                this.mov(oper.src, oper.dst);
                break;
            case 'CMP':
                this.cmp(oper.src, oper.dst);
                break;
            case 'BIT':
                this.bit(oper.src, oper.dst);
                break;
            case 'BIC':
                this.bic(oper.src, oper.dst);
                break;
            case 'BIS':
                this.bis(oper.src, oper.dst);
                break;
            case 'SUB':
                this.sub(oper.src, oper.dst);
                break;
            case 'ADD':
                this.add(oper.src, oper.dst);
                break;
            case 'CLR':
                this.clr(oper.src);
                break;
        }
    }

    mov(src, dst) {
        const result = src.value & 0xFFFF;
        dst.write(result);

        this.N = (result & 0x8000) !== 0;
        this.Z = result === 0;
        this.V = 0;
        //C is not affected by move
    }

    cmp(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const cmpValue = (srcValue - dstValue) & 0xFFFF;

        this.N = (cmpValue & 0x8000) !== 0;
        this.Z = cmpValue === 0;
        this.V = ((srcValue ^ dstValue) & (srcValue ^ cmpValue) & 0x8000) !== 0;
        this.C = srcValue < dstValue;
    }

    bit(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const bitValue = (srcValue & dstValue) & 0xFFFF;

        this.N = (bitValue & 0x8000) !== 0;
        this.Z = bitValue === 0;
        this.V = 0;
        //C is not affected by move
    }

    bic(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const bicValue = (~srcValue & dstValue) & 0xFFFF;
        dst.write(bicValue);

        this.N = (bicValue & 0x8000) !== 0;
        this.Z = bicValue === 0;
        this.V = 0;
        //C is not affected by move
    }

    bis(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const bisValue = (srcValue | dstValue) & 0xFFFF;
        dst.write(bisValue);

        this.N = (bisValue & 0x8000) !== 0;
        this.Z = bisValue === 0;
        this.V = 0;
        //C is not affected by move
    }

    sub(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const subValue = (dstValue - srcValue) & 0xFFFF;
        dst.write(subValue);

        this.N = (subValue & 0x8000) !== 0;
        this.Z = subValue === 0;
        this.V = ((dstValue ^ srcValue) & (dstValue ^ subValue) & 0x8000) !== 0;
        this.C = (dstValue < srcValue);
    }

    add(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const addValue = (dstValue + srcValue) & 0xFFFF;
        const fullBitValue = dstValue + srcValue; //used to ensure the total value will not be greater than 16 bits
        dst.write(addValue);

        this.N = (addValue & 0x8000) !== 0;
        this.Z = addValue === 0;
        this.V = ((dstValue ^ addValue) & (srcValue ^ addValue) & 0x8000) !== 0;
        this.C = fullBitValue > 0xFFFF;
    }

    clr(dst) {
        dst.write(0);

        this.N = 0;
        this.Z = 1;
        this.V = 0;
        this.C = 0;
    }


}