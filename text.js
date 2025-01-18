export let firstSet = {};
export let followSet = {};
export let parseTable = {};

// Compute the First set for a symbol
export function computeFirst(symbol, grammar, terminals) {
    if (terminals.has(symbol)) return new Set([symbol]);
    if (firstSet[symbol]) return firstSet[symbol];

    const result = new Set();
    (grammar[symbol] || []).forEach(production => {
        const symbols = production.split(" ");
        for (const sym of symbols) {
            const firstSym = computeFirst(sym, grammar, terminals);
            firstSym.forEach(s => result.add(s));
            if (!firstSym.has("ε")) break;
        }
    });

    result.delete("ε");
    firstSet[symbol] = result;
    return result;
}

// Compute the Follow set for all non-terminals
export function computeFollow(grammar, startSymbol) {
    followSet[startSymbol] = new Set(["$"]);

    const process = symbol => {
        if (followSet[symbol]) return followSet[symbol];
        followSet[symbol] = new Set();

        Object.entries(grammar).forEach(([lhs, productions]) => {
            productions.forEach(production => {
                const symbols = production.split(" ");
                symbols.forEach((sym, i) => {
                    if (sym === symbol) {
                        if (i + 1 < symbols.length) {
                            const firstNext = computeFirst(symbols[i + 1], grammar, terminals);
                            firstNext.forEach(s => followSet[symbol].add(s));
                            if (firstNext.has("ε")) {
                                computeFollow(lhs);
                                followSet[lhs].forEach(s => followSet[symbol].add(s));
                            }
                        } else {
                            computeFollow(lhs);
                            followSet[lhs].forEach(s => followSet[symbol].add(s));
                        }
                    }
                });
            });
        });

        return followSet[symbol];
    };

    Object.keys(grammar).forEach(process);
}

// Build the Parse Table based on First and Follow sets
export function buildParseTable(grammar, terminals, startSymbol) {
    Object.entries(grammar).forEach(([lhs, productions]) => {
        productions.forEach(production => {
            const symbols = production.split(" ");
            const first = new Set();

            symbols.forEach(sym => {
                const firstSym = computeFirst(sym, grammar, terminals);
                firstSym.forEach(s => first.add(s));
                if (!firstSym.has("ε")) return false;
            });

            first.forEach(terminal => {
                if (terminal !== "ε") {
                    parseTable[lhs] = parseTable[lhs] || {};
                    parseTable[lhs][terminal] = production;
                }
            });

            if (first.has("ε")) {
                (followSet[lhs] || []).forEach(terminal => {
                    parseTable[lhs] = parseTable[lhs] || {};
                    parseTable[lhs][terminal] = "ε";
                });
            }
        });
    });
}

// Parse an input string using the generated parsing table
export function parseInput(input, startSymbol, terminals, grammar) {
    const stack = ["$", startSymbol];
    const tokens = input.split(" ").concat(["$"]);
    let idx = 0;

    while (stack.length) {
        const top = stack.pop();
        const token = tokens[idx];

        if (top === token) {
            idx++;
        } else if (terminals.has(top)) {
            console.error(`Error: Unexpected terminal '${token}'`);
            return false;
        } else if (parseTable[top]?.[token]) {
            const production = parseTable[top][token].split(" ");
            production.reverse().forEach(sym => {
                if (sym !== "ε") stack.push(sym);
            });
        } else {
            console.error(`Error: No rule for [${top}, ${token}]`);
            return false;
        }
    }

    return idx === tokens.length;
}
