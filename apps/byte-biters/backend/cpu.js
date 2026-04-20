import {REG} from "./registers.js";
import {Decode} from "./decode.js";
import {Memory} from "./memory.js";

export class CPU {
    constructor() {
        this.registers = new Uint16Array(8);
        this.memory = new Memory();
        this.decoder = new Decode();
        this.halted = false;

        //flag setup
        this.N = 0;
        this.Z = 0;
        this.V = 0;
        this.C = 0;

        //initial values for the Stack pointer and Point Counter Registers
        this.registers[REG.SP] = 0o10000;
        this.registers[REG.PC] = 0o200;

        //Used to move backwards to previous states
        this.pastState = [];
        this.currentState = null;

        //Used for reset to go back to assembled memory array
        this.initialMemory = null;
    }

    loadProgram(words) {
        let addr = 0o200;
        for(let word of words) {
            this.memory.writeWord(addr, word);
            addr += 2;
        }
        this.initialMemory = new Uint8Array(this.memory.bytes);
    }

    getPastState() {
        return this.pastState;
    }

    getRegisters() {
        return [...this.registers].map(r => r.toString(16).toUpperCase());
    }

    setRegisters(newRegisters) {
        this.registers.set(newRegisters);
    }

    getFlags() {
        return {N: this.N, Z: this.Z, V: this.V, C: this.C};
    }

    setFlags(newN, newZ, newV, newC) {
        this.N = newN;
        this.Z = newZ;
        this.V = newV;
        this.C = newC;
    }

    getMemory() {
        return new Uint8Array(this.memory.bytes);
    }

    readWord(addr) {
        return this.memory.readWord(addr);
    }

    writeWord(word, addr) {
        const oldWord = this.readWord(addr);
        if(this.currentState){
            this.currentState.memoryChange.push({oldWord, addr});
        }

        this.memory.writeWord(addr, word);
    }

    fetch() {
        const pc = this.registers[REG.PC];
        const instr = this.readWord(pc);
        this.registers[REG.PC] = (pc + 2) & 0xFFFF;
        return instr;
    }

    step() {
        if(!this.halted){
            this.currentState = {
                registers: this.getRegisters(),
                flags: this.getFlags(),
                memoryChange: []
            };

            const instr = this.fetch();
            const oper = this.decoder.decode(instr);

            if(oper.src) {
                oper.src = this.resolveSource(oper.src.mode, oper.src.REG);
            }
            if(oper.dst) {
                oper.dst = this.resolveDestination(oper.dst.mode, oper.dst.REG);
            }      
            this.execute(oper);

            this.pastState.push(this.currentState);
            this.currentState = null;
        }
    }

    backStep(){
        const lastState = this.pastState.pop();

        for (let i = 0; i < 8; i++) {
            const value = parseInt(lastState.registers[i], 16);

            lastState.registers[i] = value;
        }
        this.setRegisters(lastState.registers);

        this.setFlags(
            lastState.flags.N,
            lastState.flags.Z,
            lastState.flags.V,
            lastState.flags.C
        );
        for(const change of lastState.memoryChange){
            this.memory.writeWord(change.addr, change.oldValue); 
        }        
    }

    reset() {
        //reset the pointers
        this.registers = new Uint16Array(8);

        //reset the stack pointer and program counter
        this.registers[REG.SP] = 0o10000;
        this.registers[REG.PC] = 0o200;

        //clear the flags
        this.N = 0;
        this.Z = 0;
        this.V = 0;
        this.C = 0;

        //reset memory
        this.memory = new Memory();
        if (this.initialMemory) {
            this.memory.bytes.set(this.initialMemory);
        }

        //reset halted
        this.halted = false;

        //ensures back step cannot be used after a reset
        this.pastState = [];
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
                this.clr(oper.dst);
                break;
            case 'INC':
                this.inc(oper.dst);
                break;
            case 'DEC':
                this.dec(oper.dst);
                break;
            case 'TST':
                this.tst(oper.dst);
                break;
            case 'JMP':
                this.jmp(oper.dst);
                break;
            case 'BR':
                this.br(oper);
                break;
            case 'BNE':
                this.bne(oper);
                break;
            case 'BEQ':
                this.beq(oper);
                break;
            case 'BGE':
                this.bge(oper);
                break;
            case 'BGT':
                this.bgt(oper);
                break;
            case 'BLE':
                this.ble(oper);
                break;
            case 'BLT':
                this.blt(oper);
                break;
            case 'HALT':
                this.halted = true;
                break;
            case 'RESET':
                this.reset();
                break;
        }
    }

    mov(src, dst) {
        const result = src.value & 0xFFFF;
        dst.write(result);

        this.N = (result & 0x8000) !== 0;
        this.Z = result === 0;
        this.V = false;
        //C is not affected by move
    }

    cmp(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const cmpValue = (dstValue - srcValue) & 0xFFFF;

        this.N = (cmpValue & 0x8000) !== 0;
        this.Z = cmpValue === 0;
        this.V = ((dstValue ^ srcValue) & (dstValue ^ cmpValue) & 0x8000) !== 0;
        this.C = dstValue < srcValue;
    }

    bit(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const bitValue = (srcValue & dstValue) & 0xFFFF;

        this.N = (bitValue & 0x8000) !== 0;
        this.Z = bitValue === 0;
        this.V = false;
        //C is not affected by bit test
    }

    bic(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const bicValue = (~srcValue & dstValue) & 0xFFFF;
        dst.write(bicValue);

        this.N = (bicValue & 0x8000) !== 0;
        this.Z = bicValue === 0;
        this.V = false;
        //C is not affected by bit clear
    }

    bis(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const bisValue = (srcValue | dstValue) & 0xFFFF;
        dst.write(bisValue);

        this.N = (bisValue & 0x8000) !== 0;
        this.Z = bisValue === 0;
        this.V = false;
        //C is not affected by bit set
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

        this.N = false;
        this.Z = true;
        this.V = false;
        this.C = false;
    }

    inc(dst) {
        const oldValue = dst.value & 0xFFFF;
        const incValue = (oldValue + 1) & 0xFFFF;
        dst.write(incValue);

        this.N = (incValue & 0x8000) !== 0;
        this.Z = incValue === 0;
        this.V = oldValue === 0x7FFF;
        //C is not affected by increment
    }

    dec(dst) {
        const oldValue = dst.value & 0xFFFF;
        const decValue = (oldValue - 1) & 0xFFFF;
        dst.write(decValue);

        this.N = (decValue & 0x8000) !== 0;
        this.Z = decValue === 0;
        this.V = oldValue === 0x8000;
        //C is not affected by decrement
    }

    //Used to test if a value is either negative or zero
    tst(dst) {
        const tstValue = dst.value & 0xFFFF;

        this.N = (tstValue & 0x8000) !== 0;
        this.Z = tstValue === 0;
        this.V = false; //Inserted value could not be greater or less than max or minimum
        this.C = false; //Cannot require a carry
    }

    //Used to jump the program counter to the new destination address
    jmp(dst) {
        this.registers[REG.PC] = dst.address & 0xFFFF;

        //NZVC all remain unaffected
    }

    //Used to create a branch
    br(oper) { //this is most likely where current issue lies here
        const pc = this.registers[REG.PC];
        const displacement = oper.offset << 1;

        this.registers[REG.PC] = (pc + displacement) & 0xFFFF;

        //NZVC all remain unaffected
    }

    //Used to create a branch if the zero flag is not set
    bne(oper) {
        if(this.Z !== true) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    //Used to create a branch if the zero flag is set
    beq(oper) {
        if(this.Z === true) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    //Creates a branch if the zero and overflow flags are the same value
    bge(oper) {
        if(this.Z === this.V) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    bgt(oper) {
        if(this.Z === false && (this.V === this.N)) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    ble(oper) {
        if(this.Z === true || (this.N !== this.V)) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    blt(oper) {
        if(this.V ^ this.N) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }
}