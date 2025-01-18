let grammar = {};
let terminals = new Set();
let nonTerminals = new Set();
let startSymbol = "";

let firstSet = {};
let followSet = {};
let parseTable = {};

// Initialize Grammar with rules
function initializeGrammar(rules, start) {
    grammar = {};
    terminals = new Set();
    nonTerminals = new Set();
    startSymbol = start;

    rules.forEach(rule => {
        const [lhs, rhs] = rule.split("->").map(s => s.trim());
        grammar[lhs] = (grammar[lhs] || []).concat(rhs);
        nonTerminals.add(lhs);
        rhs.split(" ").forEach(symbol => {
            if (symbol.match(/^[A-Z]/)) {
                nonTerminals.add(symbol);
            } else {
                terminals.add(symbol);
            }
        });
    });
    terminals.add("$"); // Add EOF symbol
}

// Compute First set
function computeFirst(symbol, grammar, terminals) {
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

// Compute Follow set
function computeFollow(grammar, startSymbol) {
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
                            const firstNext = computeFirst(symbols[i + 1], grammar, new Set());
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

// Build Parse Table
function buildParseTable(grammar, terminals, startSymbol) {
    parseTable = {};

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

// Parse an input string
function parseInput(input, startSymbol, terminals, grammar) {
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

// Reset function
function resetForm() {
    // Reset grammar rules and start symbol input fields
    document.getElementById("grammarRules").value = "";
    document.getElementById("startSymbol").value = "";

    // Reset the test string input field
    document.getElementById("testString").value = "";

    // Clear the parsing table
    const tableBody = document.getElementById("parsingTableBody");
    tableBody.innerHTML = "";  // Clear the rows in the table

    // Hide the parsing result
    const resultDiv = document.getElementById("result");
    resultDiv.classList.add("hidden");  // Hide the result section

    // Reset any global variables or data
    grammar = {};
    terminals = new Set();
    nonTerminals = new Set();
    startSymbol = "";

    firstSet = {};
    followSet = {};
    parseTable = {};
}

// Event handlers
document.getElementById("generateParser").onclick = function () {
    const grammarInput = document.getElementById("grammarRules").value.trim().split("\n");
    const startSymbolInput = document.getElementById("startSymbol").value.trim();

    initializeGrammar(grammarInput, startSymbolInput);
    computeFollow(grammar, startSymbol);
    buildParseTable(grammar, terminals, startSymbol);

    // Display parsing table
    const tableBody = document.getElementById("parsingTableBody");
    tableBody.innerHTML = "";

    Object.entries(parseTable).forEach(([nonTerminal, terminalsMap]) => {
        Object.entries(terminalsMap).forEach(([terminal, production]) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td class="border border-gray-300 px-4 py-2">${nonTerminal}</td><td class="border border-gray-300 px-4 py-2">${terminal}</td><td class="border border-gray-300 px-4 py-2">${production}</td>`;
            tableBody.appendChild(row);
        });
    });
};

document.getElementById("parseString").onclick = function () {
    const inputString = document.getElementById("testString").value.trim();
    const result = parseInput(inputString, startSymbol, terminals, grammar);

    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("hidden");
    resultDiv.innerText = result ? "Accepted" : "Rejected";
};
