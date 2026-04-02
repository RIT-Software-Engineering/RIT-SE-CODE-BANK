

export function firstPass(parsedData) {
    let lc = 0;
    const symbols = {};

    for(const data of parsedData) {
        data.address = lc;
        data.size = computeSize(data);
        lc += data.size;

        if(data.label != null) {
            symbols[data.label] = data.address;
        }
    }
    return {symbols, annotatedAst: parsedData};
}

function computeSize(data) {
    let size = 0;

    if(data.type == "instruction") {
        size = computeInstructionSize(data);
    } 
    else if(data.type == "directive") {
        size = computeDirectiveSize(data);
    } else { //used for label-only lines
        size = 0;
    }

    return size;
}

function computeInstructionSize(data) {
    console.log(data);
    let size = 2;
    if(data.src != null && data.src.offset != null) {
        size += 2;
    }
    if(data.dst != null && data.dst.offset != null) {
        size += 2;
    }
    return size;
}

function computeDirectiveSize(data) {
    switch(data.directive) {
        case(".WORD"):
            return 2 * data.args.length;
        case(".BYTE"):
            return 1 * data.args.length;
        case(".ASCIZ"):
            return data.args.length + 1;
        case(".ASCII"):
            return data.args.length;
        case(".BLKW"):
            return 2 * parseInt(data.args[0]);
        case(".BLKB"):
            return parseInt(data.args[0]);
        case(".END"):
            return 0;
        default:
            return 0;
    }
}