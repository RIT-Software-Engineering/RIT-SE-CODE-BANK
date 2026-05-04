import {REG} from "./registers.js";
import {Decode} from "./decode.js";
import {Memory} from "./memory.js";

export class CPU {
    constructor() {
        this.registers = new Uint16Array(8);
        this.memory = new Memory();
        this.decoder = new Decode();
        this.halted = false;
        this.isAssembled = false;

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

    /**
     * Loads the assembled program into memory based on the initial pc value of 0o200
     * Saves an initial copy of the assembled memory and marks the cpu as assembled
     * @param {number[]} words The list of 16-bit words that make up the program. 
     */
    loadProgram(words) {
        let addr = 0o200;
        for(let word of words) {
            this.memory.writeWord(addr, word);
            addr += 2;
        }
        this.initialMemory = new Uint8Array(this.memory.bytes);
        this.isAssembled = true;
    }

    getPastState() {
        return this.pastState;
    }

    getAssembledState() {
        return this.isAssembled;
    }

    getHaltedState() {
        return this.halted;
    }

    /**
     * Retrieves a list of the registers converted to hexadecimal values
     * @return {string[]} The list of registers in hex
     */
    getRegisters() {
        return [...this.registers].map(r => r.toString(16).toUpperCase());
    }

    setRegisters(newRegisters) {
        this.registers.set(newRegisters);
    }

    getFlags() {
        return {N: this.N, Z: this.Z, V: this.V, C: this.C};
    }

    /**
     * Sets the NZVC flags with the given values
     * @param {boolean} newN The new N value
     * @param {boolean} newZ The new Z value
     * @param {boolean} newV The new V value
     * @param {boolean} newC The new C value
     */
    setFlags(newN, newZ, newV, newC) {
        this.N = newN;
        this.Z = newZ;
        this.V = newV;
        this.C = newC;
    }

    /**
     * Retreives a copy of the current memory
     * @return {Uint8Array} The Uint8Array copy of the memory
     */
    getMemory() {
        return new Uint8Array(this.memory.bytes);
    }

    /**
     * Reads a 16-bit number from memory at the given address
     * @param {number} addr The memory address to read from
     * @return {number} The 16-bit word stored at the address
     */
    readWord(addr) {
        return this.memory.readWord(addr);
    }

    /*
    *Writes a new word to memory. Any changes are saved to memoryChange to be used by backStep
    *@param word {number} the word to be written to memory
    *@param addr {number} the location the word will be written to
    */
    writeWord(word, addr) {
        const oldWord = this.readWord(addr);
        if(this.currentState){
            this.currentState.memoryChange.push({oldWord, addr});
        }

        this.memory.writeWord(addr, word);
    }

    /*
    *Fetches the current instruction word then increments the pc by 2
    *@return {number} the 16 bit instruction
    */
    fetch() {
        const pc = this.registers[REG.PC];
        const instr = this.readWord(pc);
        this.registers[REG.PC] = (pc + 2) & 0xFFFF;
        return instr;
    }

    /**
     * Executes a single CPU instruction cycle if it is not halted.
     * Sets the current state with the current register and flag values
     * and gives memory and empty list. Fetches and decodes the next instruction,
     * resolves the operands, executes the operation, and pushes the changes to pastState.
     * Clears current state at the end.
     */
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

    /**
     * Allows the program to back step instructions.
     * Takes the last state from the list of past states and sets the values to decimal.
     * Sets the registers and flags to their former states.
     * Reverts the memory only where changes have been made. Sets halt to false so
     * program can move forward in the future.
     */
    backStep(){
        const lastState = this.pastState.pop();

        //Keeps the values as decimal in the backend
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

        //Allows going forward after backstepping from the end
        this.halted = false;
    }

    //Resets the registers, flags, halted state, and past state to their default values
    //Memory is reset to initial assembled state with initialMemory
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

    /**
     * Resolves the source operand for the given addressing mode and register.
     * Returns the operand’s value, its effective address, and
     * whether the operand refers to a register. Handles all PDP‑11 source
     * addressing modes (0–7).
     * @param {number} mode The addressing mode (0–7).
     * @param {number} reg  The register number (0–7) used by the mode.
     * @return {object} An object containing:
     *                  - value {number}: the resolved operand value
     *                  - address {number}: the effective address (if applicable)
     *                  - isRegister {boolean}: true if the operand is a register
     */
    resolveSource(mode, reg){
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
                const pointer = this.readWord(this.registers[reg]);
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
                this.registers[reg] -= 2;
                return {
                    value: valueDec,
                    address: pointerDec,
                    isRegister: false
                };
            case 6: //Indexed
                const index = this.fetch();
                return {
                    value: this.readWord(this.registers[reg] + index),
                    address: this.registers[reg] + index,
                    isRegister: false
                };
            case 7: //Indexed Deferred
                const index2 = this.fetch();
                const pointerInd = this.readWord(this.registers[reg] + index2);
                const valueInd = this.readWord(pointerInd);
                return {
                    value: valueInd,
                    address: pointerInd,
                    isRegister: false
                };
        }
    }

    /**
     * Resolves the destination operand for the given addressing mode and register.
     * Returns the operand’s value, its effective address, whether it refers to a
     * register, and a write function used to store results back to the correct
     * location. Handles all PDP‑11 destination addressing modes (0–7).
     * @param {number} mode The addressing mode (0–7).
     * @param {number} reg  The register number (0–7) used by the mode.
     * @return {object} An object containing:
     *                  - value {number}: the resolved operand value
     *                  - address {number}: the effective address (if memory-based)
     *                  - isRegister {boolean}: true if the operand is a register
     *                  - write {function}: writes a value back to the operand
     */
    resolveDestination(mode, reg) {
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
                    value: this.readWord(this.registers[reg]),
                    address: this.registers[reg],
                    isRegister: false,
                    write: (val) => this.writeWord(val, this.registers[reg])
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
                const pointer2 = this.readWord(this.registers[reg]);
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
                    value: this.readWord(this.registers[reg] + indexDst),
                    address: this.registers[reg] + indexDst,
                    isRegister: false,
                    write: (val) => this.writeWord(val, (this.registers[reg] + indexDst))
                }
            case 7: //Indexed deferred
                const index = this.fetch();
                const pointerIndDst = this.readWord(this.registers[reg] + index);
                const valueIndDst = this.readWord(pointerIndDst);
                return {
                    value: valueIndDst,
                    address: pointerIndDst,
                    isRegister: false,
                    write: (val) => this.writeWord(val, pointerIndDst)
                };
        }
    }

    /**
     * Using the operation type it switches to the decoded instruction
     * @param {object} oper The decoded instruction object which contains the desired type
     */
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

    /**
     * Executes the MOV instruction. Copies the source value into the destination
     * operand and updates the N, Z, and V flags accordingly. The C flag is not affected.
     * @param {object} src The resolved source operand.
     * @param {object} dst The resolved destination operand.
     */
    mov(src, dst) {
        const result = src.value & 0xFFFF;
        dst.write(result);

        this.N = (result & 0x8000) !== 0;
        this.Z = result === 0;
        this.V = false;
        //C is not affected by move
    }

    /**
     * Executes the CMP instruction. Subtracts the source value from the destination value.
     * Updates the N, Z, V, and C flags accordingly
     * @param {object} src The resolved source operand.
     * @param {object} dst The resolved destination operand.
     */
    cmp(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const cmpValue = (srcValue - dstValue) & 0xFFFF;

        this.N = (cmpValue & 0x8000) !== 0;
        this.Z = cmpValue === 0;
        this.V = ((srcValue ^ dstValue) & (srcValue ^ cmpValue) & 0x8000) !== 0;
        this.C = srcValue < dstValue;
    }

    /**
     * Executes the BIT instruction. Performs a logical AND between the source value and the destination value.
     * Updates the N, Z, and V flags accordingly while C is not changed.
     * @param {object} src The resolved source operand.
     * @param {object} dst The resolved destination operand.
     */
    bit(src, dst) {
        const srcValue = src.value & 0xFFFF;
        const dstValue = dst.value & 0xFFFF;
        const bitValue = (srcValue & dstValue) & 0xFFFF;

        this.N = (bitValue & 0x8000) !== 0;
        this.Z = bitValue === 0;
        this.V = false;
        //C is not affected by bit test
    }

    /**
     * Executes the BIC instruction. Clears bits in the destination value where the
     * corresponding bits in the source value are set, writes the
     * result back to the destination, and updates the N, Z, and V flags. The C flag
     * is not affected by BIC.
     * @param {object} src The resolved source operand.
     * @param {object} dst The resolved destination operand.
     */
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

    /**
     * Executes the BIS instruction. Sets bits in the destination value where the
     * corresponding bits in the source value are set, writes the
     * result back to the destination, and updates the N, Z, and V flags. The C flag
     * is not affected by BIS.
     * @param {object} src The resolved source operand.
     * @param {object} dst The resolved destination operand.
     */
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

    /**
     * Executes the SUB instruction. Subtracts the source value from the destination
     * value, writes the result back to the destination, and updates all
     * condition flags (N, Z, V, C) based on the computed result.
     * @param {object} src The resolved source operand.
     * @param {object} dst The resolved destination operand.
     */
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

    /**
     * Executes the ADD instruction. Adds the source value to the destination
     * value, writes the result back to the destination, and updates
     * all condition flags (N, Z, V, C) based on the computed result.
     *
     * @param {object} src The resolved source operand.
     * @param {object} dst The resolved destination operand.
     */
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

    /**
     * Executes the CLR instruction. Writes 0 to the destination.
     * All condition flags are set to false appart from Z which is set to true.
     * @param {object} dst The resolved destination operand.
     */
    clr(dst) {
        dst.write(0);

        this.N = false;
        this.Z = true;
        this.V = false;
        this.C = false;
    }

    /**
     * Executes the INC instruction. Increments the destination value by one,
     * writes the result back to the operand, and updates the N, Z, and V flags.
     * The C flag is not affected by INC.
     * @param {object} dst The resolved destination operand.
     */
    inc(dst) {
        const oldValue = dst.value & 0xFFFF;
        const incValue = (oldValue + 1) & 0xFFFF;
        dst.write(incValue);

        this.N = (incValue & 0x8000) !== 0;
        this.Z = incValue === 0;
        this.V = oldValue === 0x7FFF;
        //C is not affected by increment
    }

    /**
     * Executes the DEC instruction. Decrements the destination value by one,
     * writes the result back to the operand, and updates the N, Z, and V flags.
     * The C flag is not affected by DEC.
     * @param {object} dst The resolved destination operand.
     */
    dec(dst) {
        const oldValue = dst.value & 0xFFFF;
        const decValue = (oldValue - 1) & 0xFFFF;
        dst.write(decValue);

        this.N = (decValue & 0x8000) !== 0;
        this.Z = decValue === 0;
        this.V = oldValue === 0x8000;
        //C is not affected by decrement
    }

    /**
     * Executes the TST instruction. Tests the destination value by updating the
     * N and Z flags based on the operand, without modifying the value itself.
     * The V and C flags are always cleared.
     * @param {object} dst The resolved destination operand.
     */
    tst(dst) {
        const tstValue = dst.value & 0xFFFF;

        this.N = (tstValue & 0x8000) !== 0;
        this.Z = tstValue === 0;
        this.V = false; //Inserted value could not be greater or less than max or minimum
        this.C = false; //Cannot require a carry
    }

    /**
     * Executes the JMP instruction. Loads the destination effective address into
     * the program counter, transferring control to the specified location. None of
     * the condition flags (N, Z, V, C) are modified by JMP.
     * @param {object} dst The resolved destination operand containing the effective address.
     */
    jmp(dst) {
        this.registers[REG.PC] = dst.address & 0xFFFF;

        //NZVC all remain unaffected
    }

    /**
     * Executes the BR instruction. Applies the signed branch displacement to the
     * current program counter and transfers control to the computed
     * address. None of the condition flags (N, Z, V, C) are modified by BR.
     * @param {object} oper The decoded branch instruction containing the signed offset.
     */
    br(oper) {
        const pc = this.registers[REG.PC];
        const displacement = oper.offset << 1;

        this.registers[REG.PC] = (pc + displacement) & 0xFFFF;

        //NZVC all remain unaffected
    }

    /**
     * Executes the BNE instruction. Branches to the target address if the Z flag
     * is clear. None of the condition flags (N, Z, V, C) are modified by BNE.
     * @param {object} oper The decoded branch instruction containing the signed offset.
     */
    bne(oper) {
        if(this.Z !== true) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    /**
     * Executes the BEQ instruction. Branches to the target address if the Z flag
     * is set. None of the condition flags (N, Z, V, C) are modified by BEQ.
     * @param {object} oper The decoded branch instruction containing the signed offset.
     */
    beq(oper) {
        if(this.Z === true) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    /**
     * Executes the BGE instruction. Branches to the target address if the Z flag and V flag are set the same.
     * None of the condition flags (N, Z, V, C) are modified by BGE.
     * @param {object} oper The decoded branch instruction containing the signed offset.
     */
    bge(oper) {
        if(this.N === this.V) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    /**
     * Executes the BGT instruction. Branches to the target address if the V flag and N flag are set the same
     * and if the Z flag is set to false. None of the condition flags (N, Z, V, C) are modified by BGT.
     * @param {object} oper The decoded branch instruction containing the signed offset.
     */
    bgt(oper) {
        if(this.Z === false && (this.V === this.N)) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    /**
     * Executes the BLE instruction. Branches to the target address if the N flag and V flag are not set the same
     * or if the Z flag is set to true. None of the condition flags (N, Z, V, C) are modified by BLE.
     * @param {object} oper The decoded branch instruction containing the signed offset.
     */
    ble(oper) {
        if(this.Z === true || (this.N !== this.V)) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }

    /**
     * Executes the BLT instruction. Branches to the target address if the V flag and N flag are set opposite.
     * None of the condition flags (N, Z, V, C) are modified by BLT.
     * @param {object} oper The decoded branch instruction containing the signed offset.
     */
    blt(oper) {
        if(this.V ^ this.N) {
            this.br(oper);
        }
        //NZVC all remain unaffected
    }
}