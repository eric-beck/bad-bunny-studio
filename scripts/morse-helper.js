(function () {
    const TEXT_TO_MORSE = {
        a: ".-",
        b: "-...",
        c: "-.-.",
        d: "-..",
        e: ".",
        f: "..-.",
        g: "--.",
        h: "....",
        i: "..",
        j: ".---",
        k: "-.-",
        l: ".-..",
        m: "--",
        n: "-.",
        o: "---",
        p: ".--.",
        q: "--.-",
        r: ".-.",
        s: "...",
        t: "-",
        u: "..-",
        v: "...-",
        w: ".--",
        x: "-..-",
        y: "-.--",
        z: "--..",
        0: "-----",
        1: ".----",
        2: "..---",
        3: "...--",
        4: "....-",
        5: ".....",
        6: "-....",
        7: "--...",
        8: "---..",
        9: "----.",
        ".": ".-.-.-",
        ",": "--..--",
        "?": "..--..",
        "!": "-.-.--",
        ":": "---...",
        ";": "-.-.-.",
        "'": ".----.",
        '"': ".-..-.",
        "(": "-.--.",
        ")": "-.--.-",
        "/": "-..-.",
        "&": ".-...",
        "=": "-...-",
        "+": ".-.-.",
        "-": "-....-",
        "_": "..--.-",
        "@": ".--.-.",
        "$": "...-..-"
    };

    const MORSE_TO_TEXT = Object.fromEntries(
        Object.entries(TEXT_TO_MORSE).map(([character, morse]) => [morse, character])
    );

    function encodeText(text) {
        const unsupportedCharacters = [];
        const lines = text.split("\n").map((line) => {
            const words = line.split(/\s+/).filter((word) => word.length > 0);

            return words.map((word) => Array.from(word).map((character) => {
                const lower = character.toLowerCase();

                if (TEXT_TO_MORSE[lower]) {
                    return TEXT_TO_MORSE[lower];
                }

                unsupportedCharacters.push(character);
                return character;
            }).join(" ")).join(" / ");
        });

        const morse = lines.join("\n");
        const symbolCount = Array.from(morse).filter((character) => character === "." || character === "-").length;

        return {
            morse,
            unsupportedCharacters,
            symbolCount
        };
    }

    function normalizeMorseInput(input) {
        return input
            .replace(/[•·]/g, ".")
            .replace(/[−–—_]/g, "-")
            .replace(/[|]/g, "/")
            .replace(/\s*\/\s*/g, " / ")
            .replace(/ {3,}/g, " / ")
            .replace(/[^.\-/\s\n]/g, (character) => ` ${character} `)
            .replace(/[ \t]+/g, " ")
            .replace(/ ?\n ?/g, "\n")
            .trim();
    }

    function decodeText(input) {
        const normalized = normalizeMorseInput(input);

        if (!normalized) {
            return {
                text: "",
                invalidTokens: [],
                normalizedMorse: ""
            };
        }

        const invalidTokens = [];
        const lines = normalized.split("\n").map((line) => line.split(" / ").map((word) => word.split(" ").filter(Boolean).map((token) => {
            if (MORSE_TO_TEXT[token]) {
                return MORSE_TO_TEXT[token];
            }

            if (/^[.-]+$/.test(token)) {
                invalidTokens.push(token);
                return "?";
            }

            return token;
        }).join("")).join(" "));

        return {
            text: lines.join("\n"),
            invalidTokens,
            normalizedMorse: normalized
        };
    }

    window.MorseCodec = {
        decodeText,
        encodeText,
        normalizeMorseInput,
        MORSE_TO_TEXT,
        TEXT_TO_MORSE
    };
})();