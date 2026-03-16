export const OPCODES = {
    //Branch operand
    BEQ: {code: 0o001400, type: "branch"},
    BGE: {code: 0o002000, type: "branch"},
    BGT: {code: 0o003000, type: "branch"},
    BLE: {code: 0o003400, type: "branch"},
    BLT: {code: 0o002400, type: "branch"},
    BNE: {code: 0o001000, type: "branch"},
    BR: {code: 0o000400, type: "branch"},

    //two operand
    BIC: {code: 0o040000, type: "two"},
    BIS: {code: 0o050000, type: "two"},
    BIT: {code: 0o030000, type: "two"},
    ADD: {code: 0o060000, type: "two"},
    CMP: {code: 0o020000, type: "two"},
    MOV: {code: 0o010000, type: "two"},
    SUB: {code: 0o160000, type: "two"},

    //one operand
    INC: {code: 0o005200, type: "one"},
    DEC: {code: 0o005300, type: "one"},
    JMP: {code: 0o000100, type: "one"},
    CLR: {code: 0o005000, type: "one"},
    TST: {code: 0o005700, type: "one"},

    //JSR and RTS operand
    JSR: {code: 0o004000, type: "jsr"},
    RTS: {code: 0o000200, type: "rts"},

    //zero operand
    HALT: {code: 0o000000, type: "zero"},
    RESET: {code: 0o000005, type: "zero"},
}