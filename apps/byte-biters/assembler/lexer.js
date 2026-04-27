import { isSymbol, isWhitespace } from "./utils.js";

/**
 * State machine used to create tokens from a line of text. Splits into a token
 * if it matches a punctuation symbol, whitespace, or is the start
 * of a quote. Has a mode to keep quotes together as well.
 * @param {string} indexedLine The pre-processed line
 * @return {string[]} A list of tokens
 */
export function lexer(indexedLine) {
    let state = "DEFAULT";
    let token = "";
    let tokens = [];

    for(const char of indexedLine) {
        if(state == "DEFAULT") {
            //Checks if the given character is a whitespace
            if(isWhitespace(char)) {
                if(token.length > 0) {
                    tokens.push(token);
                }
                token = "";
            }
            //checks if the char is a symbol that is a unique token
            else if(isSymbol(char)) {
                if(token.length > 0) {
                    tokens.push(token);
                }
                tokens.push(char);
                token = "";
            }
            //checks if a char is the start of a quote
            else if(char == '"') {
                if(token.length > 0) {
                    tokens.push(token);
                }
                token = '"';
                state = "IN_STRING";
            } else {
                token += char
            }
        }
        //Allows the user to give a string
        else if(state == "IN_STRING") {
            if(char == '"') {
                token += char;
                tokens.push(token);
                token = "";
                state = "DEFAULT"
            } else {
                token += char;
            }
        }
    }
    if(token.length > 0) {
        tokens.push(token);
    }

    console.log(tokens);
    return tokens;
}