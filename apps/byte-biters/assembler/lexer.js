//Turns an indexed line into tokens to be processed in the parser
export function lexer(indexedLine) {
    const tokenizedLine = indexedLine.split(/(?=[ (),#@+-])|(?<=[ (),#@+-])/).filter(token => token.trim() !== "");
    return tokenizedLine;
}