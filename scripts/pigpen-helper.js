(function () {
    const LETTER_TO_SYMBOL = {
        a: { token: "g-tl", family: "grid", position: "tl", dotted: false },
        b: { token: "g-tc", family: "grid", position: "tc", dotted: false },
        c: { token: "g-tr", family: "grid", position: "tr", dotted: false },
        d: { token: "g-ml", family: "grid", position: "ml", dotted: false },
        e: { token: "g-mc", family: "grid", position: "mc", dotted: false },
        f: { token: "g-mr", family: "grid", position: "mr", dotted: false },
        g: { token: "g-bl", family: "grid", position: "bl", dotted: false },
        h: { token: "g-bc", family: "grid", position: "bc", dotted: false },
        i: { token: "g-br", family: "grid", position: "br", dotted: false },
        j: { token: "gd-tl", family: "grid", position: "tl", dotted: true },
        k: { token: "gd-tc", family: "grid", position: "tc", dotted: true },
        l: { token: "gd-tr", family: "grid", position: "tr", dotted: true },
        m: { token: "gd-ml", family: "grid", position: "ml", dotted: true },
        n: { token: "gd-mc", family: "grid", position: "mc", dotted: true },
        o: { token: "gd-mr", family: "grid", position: "mr", dotted: true },
        p: { token: "gd-bl", family: "grid", position: "bl", dotted: true },
        q: { token: "gd-bc", family: "grid", position: "bc", dotted: true },
        r: { token: "gd-br", family: "grid", position: "br", dotted: true },
        s: { token: "x-n", family: "x", position: "n", dotted: false },
        t: { token: "x-e", family: "x", position: "e", dotted: false },
        u: { token: "x-s", family: "x", position: "s", dotted: false },
        v: { token: "x-w", family: "x", position: "w", dotted: false },
        w: { token: "xd-n", family: "x", position: "n", dotted: true },
        x: { token: "xd-e", family: "x", position: "e", dotted: true },
        y: { token: "xd-s", family: "x", position: "s", dotted: true },
        z: { token: "xd-w", family: "x", position: "w", dotted: true }
    };

    const TOKEN_TO_LETTER = Object.fromEntries(
        Object.entries(LETTER_TO_SYMBOL).map(([letter, symbol]) => [symbol.token, letter])
    );

    const GRID_LINES = {
        tl: [[20, 20, 80, 20], [20, 20, 20, 80]],
        tc: [[20, 20, 80, 20], [20, 20, 20, 80], [80, 20, 80, 80]],
        tr: [[20, 20, 80, 20], [80, 20, 80, 80]],
        ml: [[20, 20, 20, 80], [20, 20, 80, 20], [20, 80, 80, 80]],
        mc: [[20, 20, 80, 20], [20, 80, 80, 80], [20, 20, 20, 80], [80, 20, 80, 80]],
        mr: [[80, 20, 80, 80], [20, 20, 80, 20], [20, 80, 80, 80]],
        bl: [[20, 20, 20, 80], [20, 80, 80, 80]],
        bc: [[20, 80, 80, 80], [20, 20, 20, 80], [80, 20, 80, 80]],
        br: [[80, 20, 80, 80], [20, 80, 80, 80]]
    };

    const X_LINES = {
        n: [[20, 50, 50, 20], [50, 20, 80, 50]],
        e: [[50, 20, 80, 50], [80, 50, 50, 80]],
        s: [[20, 50, 50, 80], [50, 80, 80, 50]],
        w: [[20, 50, 50, 20], [20, 50, 50, 80]]
    };

    function getSymbolForLetter(letter) {
        return LETTER_TO_SYMBOL[letter.toLowerCase()] || null;
    }

    function getLines(symbol) {
        return symbol.family === "grid" ? GRID_LINES[symbol.position] : X_LINES[symbol.position];
    }

    function renderSymbolSvg(symbol, options = {}) {
        const size = options.size || 64;
        const stroke = options.stroke || "#1b1c15";
        const dot = options.dot || stroke;
        const background = options.background || "transparent";
        const lines = getLines(symbol).map(([x1, y1, x2, y2]) => (
            `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"></line>`
        )).join("");
        const dotMarkup = symbol.dotted
            ? `<circle cx="50" cy="50" r="7" fill="${dot}"></circle>`
            : "";

        return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" style="background:${background}">${lines}${dotMarkup}</svg>`;
    }

    function renderSymbolCard(symbol, options = {}) {
        const label = options.label || symbol.token;
        return `<div class="pigpen-symbol-card flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/70 p-3 border-2 border-on-surface/10 min-w-[5rem] min-h-[6rem]">${renderSymbolSvg(symbol, { size: options.size || 52, stroke: options.stroke, dot: options.dot })}<span class="text-xs font-black uppercase tracking-widest text-on-surface-variant">${label}</span></div>`;
    }

    function encodeText(text) {
        const unsupportedCharacters = [];
        const lines = [];
        let currentLine = [];
        const symbols = [];

        for (const character of text) {
            if (character === "\n") {
                lines.push(currentLine.join(" "));
                currentLine = [];
                symbols.push({ type: "newline" });
                continue;
            }

            if (character === " ") {
                currentLine.push("/");
                symbols.push({ type: "space" });
                continue;
            }

            const symbol = getSymbolForLetter(character);
            if (symbol) {
                currentLine.push(symbol.token);
                symbols.push({ type: "symbol", letter: character, symbol });
                continue;
            }

            unsupportedCharacters.push(character);
            currentLine.push(character);
            symbols.push({ type: "literal", value: character });
        }

        lines.push(currentLine.join(" "));

        return {
            serialized: lines.join("\n").trim(),
            symbols,
            unsupportedCharacters,
            symbolCount: symbols.filter((item) => item.type === "symbol").length
        };
    }

    function normalizeSerialized(input) {
        return input
            .replace(/\|/g, " /")
            .replace(/[ \t]+/g, " ")
            .replace(/ ?\n ?/g, "\n")
            .trim();
    }

    function decodeSerialized(input) {
        const normalized = normalizeSerialized(input);

        if (!normalized) {
            return {
                text: "",
                invalidTokens: [],
                normalizedSerialized: "",
                previewSymbols: []
            };
        }

        const invalidTokens = [];
        const previewSymbols = [];
        const lines = normalized.split("\n").map((line) => line.split(" ").filter(Boolean).map((token) => {
            const lowerToken = token.toLowerCase();
            if (lowerToken === "/") {
                previewSymbols.push({ type: "space" });
                return " ";
            }

            if (TOKEN_TO_LETTER[lowerToken]) {
                const letter = TOKEN_TO_LETTER[lowerToken];
                previewSymbols.push({ type: "symbol", letter, symbol: LETTER_TO_SYMBOL[letter] });
                return letter;
            }

            if (/^(g|gd|x|xd)-/i.test(token)) {
                invalidTokens.push(token);
                previewSymbols.push({ type: "invalid", value: token });
                return "?";
            }

            previewSymbols.push({ type: "literal", value: token });
            return token;
        }).join(""));

        return {
            text: lines.join("\n"),
            invalidTokens,
            normalizedSerialized: normalized,
            previewSymbols
        };
    }

    function buildPalette() {
        return Object.entries(LETTER_TO_SYMBOL).map(([letter, symbol]) => ({
            letter,
            token: symbol.token,
            markup: renderSymbolSvg(symbol, { size: 42 })
        }));
    }

    window.PigpenCodec = {
        buildPalette,
        decodeSerialized,
        encodeText,
        getSymbolForLetter,
        LETTER_TO_SYMBOL,
        normalizeSerialized,
        renderSymbolCard,
        renderSymbolSvg,
        TOKEN_TO_LETTER
    };
})();