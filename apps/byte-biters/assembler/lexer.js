// //Turns an indexed line into tokens to be processed in the parser
// export function lexer(indexedLine) {
//     const tokenizedLine = indexedLine.split(/(?=["[^"]*"])|(?=[ (),:#@+])|(?<=[ (),:#@+])|(?=-[^0-9])|(?<=-[^0-9])/)
//         .filter(token => token.trim() !== "");
//     console.log(tokenizedLine);
//     return tokenizedLine;
// }

export function lexer(indexedLine) {
    let state = "DEFAULT";
    let token = "";
    let tokens = [];

    for(const char of indexedLine) {
        if(state == "DEFAULT") {
            if(isWhitespace(char)) {
                if(token.length > 0) {
                    tokens.push(token);
                }
                token = "";
            } 
            else if(isSymbol(char)) {
                if(token.length > 0) {
                    tokens.push(token);
                }
                tokens.push(char);
                token = "";
            }
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

function isWhitespace(char) {
    return (/^\s*$/).test(char)
}

function isSymbol(char) {
    return (/[ (),:#@+]/).test(char);
}