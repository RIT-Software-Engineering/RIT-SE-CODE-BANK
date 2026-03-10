export class Decode{
    constructor() {

    }

    doubleOpReturn(instr, givenType) {
        return {
                type: givenType,
                src: { mode: (instr >> 9) & 0b111, REG: (instr >> 6) & 0b111},
                dst: { mode: (instr >> 3) & 0b111, REG: (instr) & 0b111}
            };
    }

    singleOpReturn(instr, givenType) {
        return {
            type: givenType,
            dst: { mode: (instr >> 3) & 0b111, REG: (instr) & 0b111}
        };
    }

    branchReturn(instr, givenType) {
        const offset8 = instr & 0xFF;
        const signed = (offset8 << 24) >> 24;
        return {
            type: givenType,
            offset: signed
        };
    }

    subRoutineReturn(instr, givenType) {
        return {
            type: givenType,
            linkReg: (instr >> 6) & 0b111,
            dst: {Mode: (instr >> 3) & 0b111, REG: (instr) & 0b111}
        };
    }

    fromSubRoutineReturn(instr, givenType) {
        return {
            type: givenType,
            returnReg: instr &0b111
        };
    }

    decode(instr) {
        //Used for the Move instruction
        if((instr & 0o070000) === 0o010000) {
            return this.doubleOpReturn(instr, 'MOV');
        }

        //Used for the Compare instruction
        else if((instr & 0o070000) === 0o020000) {
            return this.doubleOpReturn(instr, 'CMP');
        }

        //Used for the Bit Test instruction
        else if((instr & 0o070000) === 0o030000) {
            return this.doubleOpReturn(instr, 'BIT');
        }

        //Used for the Bit Clear instruction
        else if((instr & 0o070000) === 0o040000) {
            return this.doubleOpReturn(instr, 'BIC');
        }

        //Used for the Bit Set instruction
        else if((instr & 0o070000) === 0o050000) {
            return this.doubleOpReturn(instr, 'BIS');
        }

        //Used for the Subtraction instruction
        else if((instr & 0o0170000) === 0o0160000) {
            return this.doubleOpReturn(instr, 'SUB');
        }

        //Used for the Addition instruction
        else if((instr & 0o070000) === 0o060000) {
            return this.doubleOpReturn(instr, 'ADD');
        }

        //Used for the Clear instruction
        else if((instr & 0o007700) === 0o005000) {
            return this.singleOpReturn(instr, 'CLR');
        }

        //Used for the Increment instruction
        else if((instr & 0o007700) === 0o005200) {
            return this.singleOpReturn(instr, 'INC');
        }

        //Used for the Decrement instruction
        else if((instr & 0o007700) === 0o005300) {
            return this.singleOpReturn(instr, 'DEC');
        }

        //Used for the Test instruction
        else if((instr & 0o007700) === 0o005700) {
            return this.singleOpReturn(instr, 'TST');
        }

        //Used for the Jump instruction
        else if((instr & 0o007700) === 0o000100) {
            return this.singleOpReturn(instr, 'JMP');
        }

        //Used for the Branch instructions
        else if((instr & 0o007400) === 0o000400) {
            return this.branchReturn(instr, 'BR')
        }

        //Used for the Branch Not Equal instructions
        else if((instr & 0o007400) === 0o001000) {
            return this.branchReturn(instr, 'BNE')
        }

        //Used for the Branch if Equal instructions
        else if((instr & 0o007400) === 0o001400) {
            return this.branchReturn(instr, 'BEQ')
        }

        //Used for the Branch if Greater than or Equal instructions
        else if((instr & 0o007400) === 0o002000) {
            return this.branchReturn(instr, 'BGE')
        }

        //Used for the Branch if Greater than instructions
        else if((instr & 0o007400) === 0o003000) {
            return this.branchReturn(instr, 'BGT')
        }

        //Used for the Branch if Less than or Equal instructions
        else if((instr & 0o007400) === 0o003400) {
            return this.branchReturn(instr, 'BLE')
        }

        //Used for the Branch if Less than instructions
        else if((instr & 0o007400) === 0o002400) {
            return this.branchReturn(instr, 'BLT')
        }

        //Used for the Jump to SubRoutine instructions
        else if((instr & 0o007000) === 0o004000) {
            return this.subRoutineReturn(instr, 'JSR')
        }

        //Used for the Jump from SubRoutine instructions
        else if((instr & 0o000200) === 0o000200) {
            return this.fromSubRoutineReturn(instr, 'RTS')
        }

        //Used for the Halt instruction
        else if(instr === 0o000000) {
            return { type: 'HALT' };
        }

        //Used for the reset Instrution
        else if(instr === 0o000005) {
            return {type: 'RESET' };
        }
    }
}