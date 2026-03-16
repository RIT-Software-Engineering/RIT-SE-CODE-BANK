//Turns an indexed line into tokens to be processed in the parser
export function lexer(indexedLine) {
    const tokenizedLine = indexedLine.split(/(?=[ (),#@+])|(?<=[ (),#@+])|(?=-[^0-9])|(?<=-[^0-9])|(?=0x[^0-9A-Fa-f])/)
        .filter(token => token.trim() !== "");
    console.log(tokenizedLine);
    return tokenizedLine;
}