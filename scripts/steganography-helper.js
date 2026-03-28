(function () {
    "use strict";

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Failed to read image file."));
            reader.readAsDataURL(file);
        });
    }

    function loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Could not load image."));
            img.src = dataUrl;
        });
    }

    function getCapacityBitsFromImageData(imageData) {
        return Math.floor(imageData.data.length / 4) * 3;
    }

    function payloadFromMessage(message) {
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(message);
        const payload = new Uint8Array(messageBytes.length + 4);

        payload[0] = (messageBytes.length >>> 24) & 0xff;
        payload[1] = (messageBytes.length >>> 16) & 0xff;
        payload[2] = (messageBytes.length >>> 8) & 0xff;
        payload[3] = messageBytes.length & 0xff;
        payload.set(messageBytes, 4);

        return payload;
    }

    function extractBitsFromImageData(imageData, bitCount) {
        const bits = [];
        const channels = imageData.data;

        for (let index = 0; index < channels.length && bits.length < bitCount; index++) {
            if (index % 4 === 3) {
                continue;
            }
            bits.push(channels[index] & 1);
        }

        if (bits.length < bitCount) {
            throw new Error("Image does not contain enough hidden data.");
        }

        return bits;
    }

    function bitsToBytes(bits) {
        const bytes = new Uint8Array(Math.floor(bits.length / 8));

        for (let index = 0; index < bytes.length; index++) {
            let value = 0;
            for (let bit = 0; bit < 8; bit++) {
                value = (value << 1) | bits[index * 8 + bit];
            }
            bytes[index] = value;
        }

        return bytes;
    }

    function getImageDataFromImage(image, canvas) {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        return { context, imageData: context.getImageData(0, 0, canvas.width, canvas.height) };
    }

    function calculateCapacityBytes(image) {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const capacityBits = width * height * 3;
        return Math.max(Math.floor(capacityBits / 8) - 4, 0);
    }

    function encodeImageToDataUrl(image, message, canvas) {
        const { context, imageData } = getImageDataFromImage(image, canvas);
        const payload = payloadFromMessage(message);
        const capacityBits = getCapacityBitsFromImageData(imageData);
        const requiredBits = payload.length * 8;

        if (requiredBits > capacityBits) {
            throw new Error("Message is too large for this image.");
        }

        let bitIndex = 0;
        for (let index = 0; index < imageData.data.length && bitIndex < requiredBits; index++) {
            if (index % 4 === 3) {
                continue;
            }

            const byteIndex = Math.floor(bitIndex / 8);
            const bitOffset = 7 - (bitIndex % 8);
            const bit = (payload[byteIndex] >> bitOffset) & 1;

            imageData.data[index] = (imageData.data[index] & 0xfe) | bit;
            bitIndex++;
        }

        context.putImageData(imageData, 0, 0);

        return {
            dataUrl: canvas.toDataURL("image/png"),
            messageBytes: payload.length - 4,
            capacityBytes: calculateCapacityBytes(image)
        };
    }

    function decodeMessageFromImage(image, canvas) {
        const { imageData } = getImageDataFromImage(image, canvas);
        const capacityBits = getCapacityBitsFromImageData(imageData);

        if (capacityBits < 32) {
            throw new Error("Image is too small to contain a message.");
        }

        const lengthBits = extractBitsFromImageData(imageData, 32);
        const lengthBytes = bitsToBytes(lengthBits);
        const messageLength =
            ((lengthBytes[0] << 24) >>> 0) |
            ((lengthBytes[1] << 16) >>> 0) |
            ((lengthBytes[2] << 8) >>> 0) |
            (lengthBytes[3] >>> 0);

        const totalBitsNeeded = 32 + messageLength * 8;
        if (messageLength <= 0 || totalBitsNeeded > capacityBits) {
            throw new Error("No valid hidden message found in this image.");
        }

        const payloadBits = extractBitsFromImageData(imageData, totalBitsNeeded).slice(32);
        const payloadBytes = bitsToBytes(payloadBits);
        const decoder = new TextDecoder();

        return decoder.decode(payloadBytes);
    }

    window.BadBunnyStego = {
        readFileAsDataUrl,
        loadImage,
        calculateCapacityBytes,
        encodeImageToDataUrl,
        decodeMessageFromImage
    };
})();