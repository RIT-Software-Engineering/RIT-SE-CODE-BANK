export function instructionLevel(tokenArray) {
    const mnemonic = tokenArray[0];
    const srcTokens = [];
    const dstTokens = [];
    let srcCheck = true;
    for(let i = 1; i < tokenArray.length; i++) {
        if(srcCheck) {
            if(tokenArray[i] === ','){
                srcCheck = false;
            } else{
                srcTokens.push(tokenArray[i]);
            }
        } else {
            dstTokens.push(tokenArray[i]);
        }
    }
    return {
        mnemonic: mnemonic,
        srcTokens: srcTokens.length === 0 ? null : srcTokens,
        dstTokens: dstTokens.length === 0 ? null : dstTokens
    }
}

export function parseInstruction(tokens) {
    const {mnemonic, srcTokens, dstTokens} = instructionLevel(tokens);

    return {
        mnemonic: mnemonic,
        src: srcTokens ? parseOperand(srcTokens) : null,
        dst: dstTokens ? parseOperand(dstTokens) : null
    };
}

//Used to determine the type of mode given and to return the appropriate values for each
export function parseOperand(tokens) {
    //Used to return the mode and register value for a register mode
    if(tokens.length === 1 && isRegister(tokens[0])) {
        return {
            mode: "register",
            reg: getRegisterNumber(tokens[0])
        };
    }
    //Used to return the mode and register value for a register deferred mode
    else if(tokens.length === 2 && tokens[0] === "@" && isRegister(tokens[1])) {
        return {
            mode: "register_deferred",
            reg: getRegisterNumber(tokens[1])
        };
    }
    //Used to return the mode and register value for an autoincrement mode
    else if(tokens.length === 4 && tokens[0] === "(" && isRegister(tokens[1]) && tokens[2] === ")" && tokens[3] === "+") {
        return {
            mode: "autoincrement",
            reg: getRegisterNumber(tokens[1])
        };
    }
    //Used to return the mode and register for an autoincrement deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && tokens[1] === "(" && isRegister(tokens[2]) && tokens[3] === ")" && tokens[4] === "+") {
        return {
            mode: "autoincrement_deferred",
            reg: getRegisterNumber(tokens[2])
        };
    }
    //Used to return the mode and register for an autodecrement mode
    else if(tokens.length === 4 && tokens[0] === "-" && tokens[1] === "(" && isRegister(tokens[2]) && tokens[3] === ")") {
        return {
            mode: "autodecrement",
            reg: getRegisterNumber(tokens[2])
        };
    }
    //Used to return the mode and register for an autodecrement deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && tokens[1] === "-" && tokens[2] === "(" && isRegister(tokens[3]) && tokens[4] === ")") {
        return {
            mode: "autodecrement_deferred",
            reg: getRegisterNumber(tokens[3])
        };
    }
    //Both versions of index need to be edited to allow for the use of variables when those are implemented
    //Used to return the mode, register, and offset from index for an indexed mode
    else if(tokens.length === 4 && isNumber(tokens[0]) && tokens[1] === "(" &&  isRegister(tokens[2]) && tokens[3] === ")") {
        return {
            mode: "indexed",
            reg: getRegisterNumber(tokens[2]),
            offset: tokens[0]
        };
    }
    //Used to return the mode, register, and offset from index for an indexed deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && isNumber(tokens[1]) && tokens[2] === "(" &&  isRegister(tokens[3]) && tokens[4] === ")") {
        return {
            mode: "indexed_deferred",
            reg: getRegisterNumber(tokens[3]),
            offset: tokens[1]
        };
    }
    //Used to return the mode and register value for an immediate mode
    else if(tokens.length === 2 && tokens[0] === "#" && isNumber(tokens[1])) {
        return {
            mode: "immediate",
            offset: tokens[1]
        };
    }
    //Used to return the mode and register value for an absolute mode
    else if(tokens.length === 3 && tokens[0] === "@" && tokens[1] === "#" && isNumber(tokens[2])) {
        return {
            mode: "absolute",
            offset: tokens[2]
        };
    }
}


//Notes
    //Think about how a variable would work in this
    //How are errors handled

function isRegister(token) {
    return /^R[0-7]$/.test(token);
}

function isNumber(token) {
    return /^-?\d+$/.test(token);
}

function getRegisterNumber(token) {
    return Number(token[1]);
}