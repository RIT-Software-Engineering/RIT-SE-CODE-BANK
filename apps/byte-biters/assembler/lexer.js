//Turns an indexed line into tokens to be processed in the parser
function lexer(indexedLine) {
    const tokenizedLine = indexedLine.split(/(?=[ (),#@+-])|(?<=[ (),#@+-])/).filter(token => token.trim() !== "");
    // console.log(tokenizedLine);
    return tokenizedLine;
}

// lexer(".MACRO FOO A, B");