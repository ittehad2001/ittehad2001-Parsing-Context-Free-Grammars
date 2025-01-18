import { computeFirst, computeFollow, buildParseTable, parseInput } from './text.js';

// Define global structures
let grammar = {};
let terminals = new Set();
let nonTerminals = new Set();
let startSymbol = "";

// Input grammar and start symbol
function initializeGrammar(rules, start) {
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
    startSymbol = start;
    terminals.add("$"); // EOF marker
}

// Build parsing table
function setupParsing() {
    nonTerminals.forEach(nonTerminal => computeFirst(nonTerminal, grammar, terminals));
    computeFollow(grammar, startSymbol);
    buildParseTable(grammar, terminals, startSymbol);
}

// Parse a given input string
function parseString(input) {
    const result = parseInput(input, startSymbol, terminals, grammar);
    console.log(result ? "Accepted" : "Rejected");
}

// Example usage
const rules = [
    "S -> A B",
    "A -> a A | ε",
    "B -> b"
];
initializeGrammar(rules, "S");
setupParsing();
parseString("a a b");
parseString("a b");
parseString("b");
