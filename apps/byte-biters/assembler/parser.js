export function parseInstruction(tokens) {
    const {mnemonic, srcTokens, dstTokens} = instructionLevel(tokens);

    return {
        mnemonic: mnemonic,
        src: srcTokens ? parseOperand(srcTokens) : null,
        dst: dstTokens ? parseOperand(dstTokens) : null
    };
}

function instructionLevel(tokenArray) { //Needs a better check in case if it is one value only, like clr
    const mnemonic = tokenArray[0];
    const rest = tokenArray.slice(1);
    const srcTokens = [];
    const dstTokens = [];
    let srcCheck = true;

    //used if the tokenArray does not contain a comma
    //determines if an instruction should have a source token or not
    //returns either the destination token if included or just a mnemonic
    if(!rest.includes(',')){
        return {
            mnemonic: mnemonic,
            srcTokens: null,
            dstTokens: rest.length === 0 ? null : rest
        };
    }
    
    //This finds the comma and splits the dst and src tokens
    for(const token of rest) {
        if(token === ','){
            srcCheck = false;
            continue; //done to make sure comma isn't added to a token array
        }
        if(srcCheck) {
            srcTokens.push(token);
        } else {
            dstTokens.push(token);
        }
    }
    return {
        mnemonic: mnemonic,
        srcTokens: srcTokens.length === 0 ? null : srcTokens,
        dstTokens: dstTokens.length === 0 ? null : dstTokens
    }
}

//Used to determine the type of mode given and to return the appropriate values for each
export function parseOperand(tokens) {
    //Used to return the mode and register value for a register mode
    if(tokens.length === 1 && isRegister(tokens[0])) {
        return {
            mode: "register",
            reg: getRegisterNumber(tokens[0]),
            offset: null
        };
    }
    //Used to return the mode and register value for a register deferred mode
    else if(tokens.length === 2 && tokens[0] === "@" && isRegister(tokens[1])) {
        return {
            mode: "register_deferred",
            reg: getRegisterNumber(tokens[1]),
            offset: null
        };
    }
    //Used to return the mode and register value for an autoincrement mode
    else if(tokens.length === 4 && tokens[0] === "(" && isRegister(tokens[1]) && tokens[2] === ")" && tokens[3] === "+") {
        return {
            mode: "autoincrement",
            reg: getRegisterNumber(tokens[1]),
            offset: null
        };
    }
    //Used to return the mode and register for an autoincrement deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && tokens[1] === "(" && isRegister(tokens[2]) && tokens[3] === ")" && tokens[4] === "+") {
        return {
            mode: "autoincrement_deferred",
            reg: getRegisterNumber(tokens[2]),
            offset: null
        };
    }
    //Used to return the mode and register for an autodecrement mode
    else if(tokens.length === 4 && tokens[0] === "-" && tokens[1] === "(" && isRegister(tokens[2]) && tokens[3] === ")") {
        return {
            mode: "autodecrement",
            reg: getRegisterNumber(tokens[2]),
            offset: null
        };
    }
    //Used to return the mode and register for an autodecrement deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && tokens[1] === "-" && tokens[2] === "(" && isRegister(tokens[3]) && tokens[4] === ")") {
        return {
            mode: "autodecrement_deferred",
            reg: getRegisterNumber(tokens[3]),
            offset: null
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
            mode: "autoincrement",
            reg: 7,
            offset: tokens[1]
        };
    }
    //Used to return the mode and register value for an absolute mode
    else if(tokens.length === 3 && tokens[0] === "@" && tokens[1] === "#" && isNumber(tokens[2])) {
        return {
            mode: "autoincrement_deferred",
            reg: 7,
            offset: tokens[2]
        };
    }

    //error in case if nothing matches
    else {
        throw new Error("Invalid operand: " + tokens.join(" "));
    }

}


//Notes
    //Think about how a variable would work in this
    //How are errors handled

function isRegister(token) {
    return /^R[0-7]$/.test(token);
}

function isNumber(token) {
    return /(^-?\d+$)|(^0x[0-9A-Fa-f]+$)/.test(token);
}

function getRegisterNumber(token) {
    return Number(token[1]);
}