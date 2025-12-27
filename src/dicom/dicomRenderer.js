export function renderDicomToCanvas(canvas, pixelInfo) {
    const { rows, cols, pixels, bitsAllocated = 16 } = pixelInfo;
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(cols, rows);

    // Determine the max value based on bits allocated
    const maxPixelValue = (1 << bitsAllocated) - 1;

    // Find min and max pixel values for normalization
    let min = pixels[0], max = pixels[0];
    for (let i = 1; i < pixels.length; i++) {
        if (pixels[i] < min) min = pixels[i];
        if (pixels[i] > max) max = pixels[i];
    }

    // If all pixels have the same value, avoid division by zero
    const range = max - min || 1;

    // Convert pixel data to grayscale image
    for (let i = 0; i < pixels.length; i++) {
        // Normalize pixel value to 0-255 range
        const normalizedValue = ((pixels[i] - min) / range) * 255;
        const idx = i * 4;

        // Set RGB channels to the same value for grayscale
        imageData.data[idx] = normalizedValue;     // R
        imageData.data[idx + 1] = normalizedValue; // G
        imageData.data[idx + 2] = normalizedValue; // B
        imageData.data[idx + 3] = 255;             // Alpha
    }

    ctx.putImageData(imageData, 0, 0);

    // Add some visual enhancements
    canvas.style.imageRendering = 'pixelated'; // For better rendering of medical images
}
