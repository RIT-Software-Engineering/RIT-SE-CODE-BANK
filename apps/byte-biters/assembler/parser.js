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

function parseOperand(tokens) {
    if(tokens.length === 1 && isRegister(tokens[0])) {
        return {
            mode: "register",
            reg: getRegisterNumber(tokens[0])
        };
    }
}


//Notes
    //Think about how a variable would work in this
    //How are errors handled

function isRegister(token) {
    return /^R[0-7]$/.test(token);
}

function getRegisterNumber(token) {
    return Number(token[1]);
}