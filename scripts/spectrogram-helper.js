(function () {
    "use strict";

    const CONFIG = {
        defaultSampleRate: 44100,
        symbolDurationSeconds: 0.09,
        gapDurationSeconds: 0.02,
        leadInSeconds: 0.2,
        tailSeconds: 0.2,
        baseFrequencyHz: 900,
        frequencyStepHz: 120,
        amplitude: 0.5,
        embedMixGain: 0.28,
        maxMessageBytes: 3072,
        repetition: 3,
        preamble: [15, 0, 15, 0, 7, 8]
    };

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function toMonoSamples(audioBuffer) {
        const channelCount = audioBuffer.numberOfChannels;
        const sampleCount = audioBuffer.length;
        const mono = new Float32Array(sampleCount);

        for (let channel = 0; channel < channelCount; channel++) {
            const data = audioBuffer.getChannelData(channel);
            for (let index = 0; index < sampleCount; index++) {
                mono[index] += data[index] / channelCount;
            }
        }

        return mono;
    }

    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Failed to read audio file."));
            reader.readAsArrayBuffer(file);
        });
    }

    function getAudioContext() {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) {
            throw new Error("Audio APIs are not available in this browser.");
        }
        return new Ctor();
    }

    async function decodeAudioFile(file) {
        const context = getAudioContext();
        const bytes = await readFileAsArrayBuffer(file);
        try {
            const buffer = await context.decodeAudioData(bytes.slice(0));
            return { context, buffer };
        } catch (error) {
            await context.close();
            throw new Error("Could not decode this audio file.");
        }
    }

    function messageToPayload(message) {
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(message);

        if (!messageBytes.length) {
            throw new Error("Message cannot be empty.");
        }

        if (messageBytes.length > CONFIG.maxMessageBytes) {
            throw new Error("Message is too long for this encoder.");
        }

        const checksum = crc16(messageBytes);
        const payload = new Uint8Array(messageBytes.length + 4);
        payload[0] = (messageBytes.length >>> 8) & 0xff;
        payload[1] = messageBytes.length & 0xff;
        payload[2] = (checksum >>> 8) & 0xff;
        payload[3] = checksum & 0xff;
        payload.set(messageBytes, 4);

        return payload;
    }

    function crc16(bytes) {
        let crc = 0xffff;

        for (let index = 0; index < bytes.length; index++) {
            crc ^= bytes[index] << 8;
            for (let bit = 0; bit < 8; bit++) {
                if (crc & 0x8000) {
                    crc = ((crc << 1) ^ 0x1021) & 0xffff;
                } else {
                    crc = (crc << 1) & 0xffff;
                }
            }
        }

        return crc & 0xffff;
    }

    function payloadToNibbles(payload) {
        const nibbles = [];
        for (let index = 0; index < payload.length; index++) {
            nibbles.push((payload[index] >>> 4) & 0x0f);
            nibbles.push(payload[index] & 0x0f);
        }
        return nibbles;
    }

    function nibblesToPayload(nibbles) {
        if (nibbles.length % 2 !== 0) {
            throw new Error("Invalid encoded data length.");
        }

        const payload = new Uint8Array(nibbles.length / 2);
        for (let index = 0; index < payload.length; index++) {
            payload[index] = ((nibbles[index * 2] & 0x0f) << 4) | (nibbles[index * 2 + 1] & 0x0f);
        }

        return payload;
    }

    function symbolToFrequency(symbol) {
        return CONFIG.baseFrequencyHz + symbol * CONFIG.frequencyStepHz;
    }

    function repeatSymbols(symbols, repeatCount) {
        const repeated = [];

        for (let index = 0; index < symbols.length; index++) {
            for (let rep = 0; rep < repeatCount; rep++) {
                repeated.push(symbols[index]);
            }
        }

        return repeated;
    }

    function createWaveFromMessage(message, sampleRate) {
        const payload = messageToPayload(message);
        const payloadSymbols = repeatSymbols(payloadToNibbles(payload), CONFIG.repetition);
        const symbols = CONFIG.preamble.concat(payloadSymbols);

        const symbolSamples = Math.floor(sampleRate * CONFIG.symbolDurationSeconds);
        const gapSamples = Math.floor(sampleRate * CONFIG.gapDurationSeconds);
        const leadInSamples = Math.floor(sampleRate * CONFIG.leadInSeconds);
        const tailSamples = Math.floor(sampleRate * CONFIG.tailSeconds);
        const stride = symbolSamples + gapSamples;

        const totalSamples = leadInSamples + symbols.length * stride + tailSamples;
        const waveform = new Float32Array(totalSamples);

        for (let symbolIndex = 0; symbolIndex < symbols.length; symbolIndex++) {
            const frequency = symbolToFrequency(symbols[symbolIndex]);
            const start = leadInSamples + symbolIndex * stride;

            for (let sampleOffset = 0; sampleOffset < symbolSamples; sampleOffset++) {
                const absoluteIndex = start + sampleOffset;
                const t = absoluteIndex / sampleRate;
                const phase = 2 * Math.PI * frequency * t;
                const harmonicPhase = 2 * Math.PI * frequency * 2 * t;
                const envelope = Math.pow(Math.sin((Math.PI * sampleOffset) / Math.max(symbolSamples - 1, 1)), 2);
                waveform[absoluteIndex] +=
                    CONFIG.amplitude * envelope * (Math.sin(phase) + 0.22 * Math.sin(harmonicPhase));
            }
        }

        return {
            waveform,
            symbols,
            payloadBytes: payload.length,
            messageBytes: payload.length - 4,
            durationSeconds: totalSamples / sampleRate
        };
    }

    function mixCarrierAndPayload(carrierSamples, payloadSamples, embedMixGain) {
        const totalLength = Math.max(carrierSamples.length, payloadSamples.length);
        const mixed = new Float32Array(totalLength);

        for (let index = 0; index < totalLength; index++) {
            const carrier = index < carrierSamples.length ? carrierSamples[index] : 0;
            const payload = index < payloadSamples.length ? payloadSamples[index] * embedMixGain : 0;
            mixed[index] = clamp(carrier * 0.9 + payload, -1, 1);
        }

        return mixed;
    }

    function floatTo16BitPCM(floatSamples) {
        const bytes = new DataView(new ArrayBuffer(floatSamples.length * 2));

        for (let index = 0; index < floatSamples.length; index++) {
            const sample = clamp(floatSamples[index], -1, 1);
            bytes.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        }

        return bytes;
    }

    function makeWavBlob(floatSamples, sampleRate) {
        const pcm = floatTo16BitPCM(floatSamples);
        const wavBuffer = new ArrayBuffer(44 + pcm.byteLength);
        const view = new DataView(wavBuffer);

        function writeAscii(offset, text) {
            for (let index = 0; index < text.length; index++) {
                view.setUint8(offset + index, text.charCodeAt(index));
            }
        }

        writeAscii(0, "RIFF");
        view.setUint32(4, 36 + pcm.byteLength, true);
        writeAscii(8, "WAVE");
        writeAscii(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeAscii(36, "data");
        view.setUint32(40, pcm.byteLength, true);

        const pcmBytes = new Uint8Array(pcm.buffer);
        const wavBytes = new Uint8Array(wavBuffer);
        wavBytes.set(pcmBytes, 44);

        return new Blob([wavBuffer], { type: "audio/wav" });
    }

    function goertzelMagnitude(samples, sampleRate, startIndex, size, targetFrequencyHz) {
        const coeff = 2 * Math.cos((2 * Math.PI * targetFrequencyHz) / sampleRate);
        let q0 = 0;
        let q1 = 0;
        let q2 = 0;

        for (let index = 0; index < size; index++) {
            const sample = samples[startIndex + index] || 0;
            q0 = coeff * q1 - q2 + sample;
            q2 = q1;
            q1 = q0;
        }

        const power = q1 * q1 + q2 * q2 - coeff * q1 * q2;
        return Math.sqrt(Math.max(power, 0));
    }

    function decodeSymbolAt(samples, sampleRate, startIndex, symbolSamples) {
        let bestSymbol = 0;
        let bestValue = -Infinity;

        for (let symbol = 0; symbol < 16; symbol++) {
            const value = goertzelMagnitude(samples, sampleRate, startIndex, symbolSamples, symbolToFrequency(symbol));
            if (value > bestValue) {
                bestValue = value;
                bestSymbol = symbol;
            }
        }

        return bestSymbol;
    }

    function decodeRepeatedSymbol(samples, sampleRate, startIndex, symbolSamples, stride) {
        const counts = new Array(16).fill(0);

        for (let rep = 0; rep < CONFIG.repetition; rep++) {
            const offset = startIndex + rep * stride;
            const symbol = decodeSymbolAt(samples, sampleRate, offset, symbolSamples);
            counts[symbol] += 1;
        }

        let winner = 0;
        let winnerCount = -1;
        for (let symbol = 0; symbol < counts.length; symbol++) {
            if (counts[symbol] > winnerCount) {
                winner = symbol;
                winnerCount = counts[symbol];
            }
        }

        return winner;
    }

    function detectBestStart(samples, sampleRate, symbolSamples, stride) {
        const preamble = CONFIG.preamble;
        const searchEnd = Math.min(samples.length - preamble.length * stride - symbolSamples, sampleRate);
        const step = Math.max(1, Math.floor(symbolSamples / 4));

        let bestOffset = 0;
        let bestScore = -1;

        for (let offset = 0; offset < searchEnd; offset += step) {
            let score = 0;

            for (let index = 0; index < preamble.length; index++) {
                const symbol = decodeSymbolAt(samples, sampleRate, offset + index * stride, symbolSamples);
                if (symbol === preamble[index]) {
                    score++;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestOffset = offset;
            }
        }

        if (bestScore < Math.floor(preamble.length * 0.66)) {
            throw new Error("Could not detect a valid spectrogram payload in this audio.");
        }

        return bestOffset;
    }

    function decodeMessageFromSamples(samples, sampleRate) {
        const symbolSamples = Math.floor(sampleRate * CONFIG.symbolDurationSeconds);
        const gapSamples = Math.floor(sampleRate * CONFIG.gapDurationSeconds);
        const stride = symbolSamples + gapSamples;

        const start = detectBestStart(samples, sampleRate, symbolSamples, stride);
        let cursor = start + CONFIG.preamble.length * stride;

        const headerNibbles = [];
        for (let index = 0; index < 8; index++) {
            if (cursor + symbolSamples >= samples.length) {
                throw new Error("Audio ended before message header could be decoded.");
            }
            headerNibbles.push(decodeRepeatedSymbol(samples, sampleRate, cursor, symbolSamples, stride));
            cursor += stride * CONFIG.repetition;
        }

        const headerBytes = nibblesToPayload(headerNibbles);
        const messageLength = ((headerBytes[0] << 8) | headerBytes[1]) >>> 0;
        const expectedChecksum = ((headerBytes[2] << 8) | headerBytes[3]) >>> 0;

        if (!messageLength || messageLength > CONFIG.maxMessageBytes) {
            throw new Error("Decoded payload length was invalid.");
        }

        const bodyNibbleCount = messageLength * 2;
        const bodyNibbles = [];

        for (let index = 0; index < bodyNibbleCount; index++) {
            if (cursor + symbolSamples >= samples.length) {
                throw new Error("Audio ended before full message could be decoded.");
            }
            bodyNibbles.push(decodeRepeatedSymbol(samples, sampleRate, cursor, symbolSamples, stride));
            cursor += stride * CONFIG.repetition;
        }

        const messageBytes = nibblesToPayload(bodyNibbles);
        const actualChecksum = crc16(messageBytes);
        if (actualChecksum !== expectedChecksum) {
            throw new Error("Message checksum mismatch. Audio may be too compressed or damaged.");
        }

        const decoder = new TextDecoder();

        return decoder.decode(messageBytes);
    }

    function drawSpectrogramFromSamples(samples, sampleRate, canvas) {
        if (!canvas) {
            return;
        }

        const context = canvas.getContext("2d");
        const displayWidth = canvas.clientWidth || 720;
        const displayHeight = canvas.clientHeight || 280;
        const columns = Math.min(360, Math.max(120, Math.floor(displayWidth)));
        const bins = Math.min(96, Math.max(48, Math.floor(displayHeight / 3)));

        canvas.width = columns;
        canvas.height = bins;

        const maxFrequency = 8000;
        const windowSize = 1024;
        const hop = Math.max(1, Math.floor((samples.length - windowSize) / Math.max(columns - 1, 1)));

        let maxMagnitude = 1e-6;
        const magnitudes = new Float32Array(columns * bins);

        for (let x = 0; x < columns; x++) {
            const start = Math.min(x * hop, Math.max(0, samples.length - windowSize - 1));

            for (let y = 0; y < bins; y++) {
                const ratio = y / Math.max(bins - 1, 1);
                const frequency = 120 + ratio * (maxFrequency - 120);
                const value = goertzelMagnitude(samples, sampleRate, start, windowSize, frequency);
                const index = x * bins + y;
                magnitudes[index] = value;
                if (value > maxMagnitude) {
                    maxMagnitude = value;
                }
            }
        }

        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < bins; y++) {
                const index = x * bins + y;
                const normalized = Math.log1p(magnitudes[index]) / Math.log1p(maxMagnitude);
                const hue = 18 + normalized * 52;
                const saturation = 85;
                const lightness = 8 + normalized * 58;

                context.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                context.fillRect(x, bins - y - 1, 1, 1);
            }
        }
    }

    function createEncodedAudioFromText(message, options) {
        const resolvedOptions = options || {};
        const sampleRate = resolvedOptions.sampleRate || CONFIG.defaultSampleRate;
        const payloadWave = createWaveFromMessage(message, sampleRate);

        let outputWave = payloadWave.waveform;
        let usedCarrier = false;

        if (resolvedOptions.carrierSamples && resolvedOptions.carrierSamples.length) {
            const gain = clamp(
                typeof resolvedOptions.embedMixGain === "number" ? resolvedOptions.embedMixGain : CONFIG.embedMixGain,
                0.08,
                0.5
            );
            outputWave = mixCarrierAndPayload(resolvedOptions.carrierSamples, payloadWave.waveform, gain);
            usedCarrier = true;
        }

        const blob = makeWavBlob(outputWave, sampleRate);

        return {
            blob,
            messageBytes: payloadWave.messageBytes,
            symbolCount: payloadWave.symbols.length,
            durationSeconds: outputWave.length / sampleRate,
            sampleRate,
            waveform: outputWave,
            usedCarrier
        };
    }

    function decodeMessageFromAudioBuffer(audioBuffer) {
        const mono = toMonoSamples(audioBuffer);
        return decodeMessageFromSamples(mono, audioBuffer.sampleRate);
    }

    window.BadBunnySpectrogram = {
        readFileAsArrayBuffer,
        decodeAudioFile,
        createEncodedAudioFromText,
        decodeMessageFromAudioBuffer,
        drawSpectrogramFromSamples,
        toMonoSamples
    };
})();
