(function () {
    const DOT_MASKS = {
        "1": 1,
        "2": 2,
        "3": 4,
        "4": 8,
        "5": 16,
        "6": 32,
        "7": 64,
        "8": 128
    };

    const LETTER_DOTS = {
        a: "1",
        b: "12",
        c: "14",
        d: "145",
        e: "15",
        f: "124",
        g: "1245",
        h: "125",
        i: "24",
        j: "245",
        k: "13",
        l: "123",
        m: "134",
        n: "1345",
        o: "135",
        p: "1234",
        q: "12345",
        r: "1235",
        s: "234",
        t: "2345",
        u: "136",
        v: "1236",
        w: "2456",
        x: "1346",
        y: "13456",
        z: "1356"
    };

    const PUNCTUATION_DOTS = {
        ",": "2",
        ";": "23",
        ":": "25",
        ".": "256",
        "!": "235",
        "?": "236",
        "'": "3",
        "-": "36",
        "/": "34",
        '"': "356",
        "(": "236",
        ")": "356"
    };

    const CAPITAL_SIGN = dotsToBrailleChar("6");
    const NUMBER_SIGN = dotsToBrailleChar("3456");
    const BRAILLE_BLANK = String.fromCharCode(0x2800);
    const DIGIT_TO_LETTER = {
        "1": "a",
        "2": "b",
        "3": "c",
        "4": "d",
        "5": "e",
        "6": "f",
        "7": "g",
        "8": "h",
        "9": "i",
        "0": "j"
    };

    const LETTER_TO_BRAILLE = Object.fromEntries(
        Object.entries(LETTER_DOTS).map(([letter, dots]) => [letter, dotsToBrailleChar(dots)])
    );
    const PUNCTUATION_TO_BRAILLE = Object.fromEntries(
        Object.entries(PUNCTUATION_DOTS).map(([symbol, dots]) => [symbol, dotsToBrailleChar(dots)])
    );
    const BRAILLE_TO_LETTER = Object.fromEntries(
        Object.entries(LETTER_TO_BRAILLE).map(([letter, braille]) => [braille, letter])
    );
    const BRAILLE_TO_PUNCTUATION = Object.fromEntries(
        Object.entries(PUNCTUATION_TO_BRAILLE).map(([symbol, braille]) => [braille, symbol])
    );
    const BRAILLE_DIGIT_MAP = Object.fromEntries(
        Object.entries(DIGIT_TO_LETTER).map(([digit, letter]) => [LETTER_TO_BRAILLE[letter], digit])
    );

    function dotsToBrailleChar(dots) {
        if (!dots) {
            return BRAILLE_BLANK;
        }

        const mask = Array.from(new Set(dots.replace(/[^1-8]/g, "").split("")))
            .sort()
            .reduce((sum, dot) => sum + (DOT_MASKS[dot] || 0), 0);
        return String.fromCharCode(0x2800 + mask);
    }

    function brailleCharToDots(character) {
        const codePoint = character.codePointAt(0);

        if (codePoint < 0x2800 || codePoint > 0x28FF) {
            return [];
        }

        const mask = codePoint - 0x2800;
        return [1, 2, 3, 4, 5, 6, 7, 8].filter((dot) => (mask & DOT_MASKS[String(dot)]) !== 0);
    }

    function encodeText(text) {
        const output = [];
        const unsupported = [];
        let numberMode = false;

        for (const character of text) {
            if (character === "\n") {
                output.push("\n");
                numberMode = false;
                continue;
            }

            if (character === " ") {
                output.push(" ");
                numberMode = false;
                continue;
            }

            if (/\d/.test(character)) {
                if (!numberMode) {
                    output.push(NUMBER_SIGN);
                    numberMode = true;
                }

                output.push(LETTER_TO_BRAILLE[DIGIT_TO_LETTER[character]]);
                continue;
            }

            numberMode = false;

            const lower = character.toLowerCase();
            if (LETTER_TO_BRAILLE[lower]) {
                if (character !== lower) {
                    output.push(CAPITAL_SIGN);
                }

                output.push(LETTER_TO_BRAILLE[lower]);
                continue;
            }

            if (PUNCTUATION_TO_BRAILLE[character]) {
                output.push(PUNCTUATION_TO_BRAILLE[character]);
                continue;
            }

            unsupported.push(character);
            output.push(character);
        }

        return {
            braille: output.join(""),
            unsupportedCharacters: unsupported,
            cellCount: output.filter((character) => /[\u2800-\u28ff]/u.test(character)).length
        };
    }

    function normalizeBrailleInput(input) {
        return Array.from(input.matchAll(/[1-8-]+|0|[\u2800-\u28ff]|\s+|[\/|]|./gu), (match) => {
            const token = match[0];

            if (/^[\u2800-\u28ff]$/u.test(token)) {
                return token;
            }

            if (/^\s+$/u.test(token)) {
                return token;
            }

            if (token === "/" || token === "|") {
                return " ";
            }

            if (token === "0") {
                return BRAILLE_BLANK;
            }

            if (/^[1-8-]+$/.test(token)) {
                return dotsToBrailleChar(token);
            }

            return token;
        }).join("");
    }

    function decodeBraille(input) {
        const normalized = normalizeBrailleInput(input);
        const output = [];
        let capitalizeNext = false;
        let numberMode = false;

        for (const character of normalized) {
            if (character === "\n") {
                output.push("\n");
                capitalizeNext = false;
                numberMode = false;
                continue;
            }

            if (character === " ") {
                output.push(" ");
                capitalizeNext = false;
                numberMode = false;
                continue;
            }

            if (!/[\u2800-\u28ff]/u.test(character)) {
                output.push(character);
                capitalizeNext = false;
                numberMode = false;
                continue;
            }

            if (character === CAPITAL_SIGN) {
                capitalizeNext = true;
                continue;
            }

            if (character === NUMBER_SIGN) {
                numberMode = true;
                continue;
            }

            if (character === BRAILLE_BLANK) {
                output.push(" ");
                capitalizeNext = false;
                numberMode = false;
                continue;
            }

            if (numberMode && BRAILLE_DIGIT_MAP[character]) {
                output.push(BRAILLE_DIGIT_MAP[character]);
                capitalizeNext = false;
                continue;
            }

            numberMode = false;

            if (BRAILLE_TO_LETTER[character]) {
                const letter = BRAILLE_TO_LETTER[character];
                output.push(capitalizeNext ? letter.toUpperCase() : letter);
                capitalizeNext = false;
                continue;
            }

            if (BRAILLE_TO_PUNCTUATION[character]) {
                output.push(BRAILLE_TO_PUNCTUATION[character]);
                capitalizeNext = false;
                continue;
            }

            output.push("?");
            capitalizeNext = false;
        }

        return {
            text: output.join(""),
            normalizedBraille: normalized,
            cellCount: Array.from(normalized).filter((character) => /[\u2800-\u28ff]/u.test(character)).length
        };
    }

    window.BrailleCodec = {
        BRAILLE_BLANK,
        CAPITAL_SIGN,
        NUMBER_SIGN,
        brailleCharToDots,
        decodeBraille,
        dotsToBrailleChar,
        encodeText,
        normalizeBrailleInput
    };
})();