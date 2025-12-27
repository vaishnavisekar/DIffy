export async function parseDicomMetadata(file) {
    try {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        let offset = 0;

        // Check if the file has a DICOM preamble (128 bytes of 0x00 followed by 'DICM')
        let hasPreamble = true;
        for (let i = 0; i < 128; i++) {
            if (view.getUint8(i) !== 0) {
                hasPreamble = false;
                break;
            }
        }

        if (hasPreamble) {
            // Check for 'DICM' after preamble
            const magic = String.fromCharCode(
                view.getUint8(128), view.getUint8(129), view.getUint8(130), view.getUint8(131)
            );
            if (magic === 'DICM') {
                offset = 128 + 4; // Skip preamble + DICM
            } else {
                hasPreamble = false;
                offset = 0;
            }
        }

        if (!hasPreamble) {
            // Try to find the first valid DICOM tag
            // Look for common first tags like (0008,0005) Specific Character Set
            const firstGroup = view.getUint16(offset, true);
            if (firstGroup !== 0x0008 && firstGroup !== 0x0002) { // File meta information or first group
                // If first tag isn't expected, the file might be corrupted or not DICOM
                return null;
            }
        }

        const metadata = {};
        const decodeStr = (off, len) => {
            return new TextDecoder().decode(new Uint8Array(buffer, off, len)).trim().replace(/\0/g, '');
        };

        while (offset < buffer.byteLength - 8) {
            const group = view.getUint16(offset, true);
            const element = view.getUint16(offset + 2, true);
            offset += 4;

            let vr = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1));
            let length;

            // Check if VR is in the explicit list that uses 32-bit length
            if (['OB', 'OW', 'OF', 'SQ', 'UT', 'UN', 'OL', 'OV', 'OD'].includes(vr)) {
                length = view.getUint32(offset + 4, true);
                offset += 8;
            } else {
                // For other VRs, length is stored as 16-bit after VR
                length = view.getUint16(offset + 2, true);
                offset += 4;
            }

            const valOffset = offset;
            offset += length;

            if (group === 0x0010 && element === 0x0010) metadata.patientName = decodeStr(valOffset, length);
            if (group === 0x0010 && element === 0x0020) metadata.patientId = decodeStr(valOffset, length);
            if (group === 0x0008 && element === 0x0020) metadata.studyDate = decodeStr(valOffset, length);
            if (group === 0x0008 && element === 0x0060) metadata.modality = decodeStr(valOffset, length);
            if (group === 0x0008 && element === 0x103E) metadata.seriesDesc = decodeStr(valOffset, length);
            if (group === 0x0008 && element === 0x0080) metadata.institutionName = decodeStr(valOffset, length);
            if (group === 0x0020 && element === 0x000D) metadata.studyInstanceUID = decodeStr(valOffset, length);
            if (group === 0x0020 && element === 0x000E) metadata.seriesInstanceUID = decodeStr(valOffset, length);
            if (group === 0x0008 && element === 0x0070) metadata.manufacturer = decodeStr(valOffset, length);
            if (group === 0x0008 && element === 0x1090) metadata.manufacturerModel = decodeStr(valOffset, length);
            if (group === 0x0018 && element === 0x1030) metadata.protocolName = decodeStr(valOffset, length);

            if (group === 0x7FE0 && element === 0x0010) break;
        }
        return metadata;
    } catch (e) {
        console.warn('DICOM Parse Error:', e);
        return null;
    }
}

export async function parseDicomPixelData(file) {
    try {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        let offset = 0;

        // Check if the file has a DICOM preamble
        let hasPreamble = true;
        for (let i = 0; i < 128; i++) {
            if (view.getUint8(i) !== 0) {
                hasPreamble = false;
                break;
            }
        }

        if (hasPreamble) {
            // Check for 'DICM' after preamble
            const magic = String.fromCharCode(
                view.getUint8(128), view.getUint8(129), view.getUint8(130), view.getUint8(131)
            );
            if (magic === 'DICM') {
                offset = 128 + 4; // Skip preamble + DICM
            } else {
                hasPreamble = false;
                offset = 0;
            }
        }

        let rows, cols, pixelDataOffset, bitsAllocated = 16; // Default to 16 bits

        while (offset < buffer.byteLength - 8) {
            const group = view.getUint16(offset, true);
            const element = view.getUint16(offset + 2, true);
            offset += 4;

            let vr = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1));
            let length;

            // Check if VR is in the explicit list that uses 32-bit length
            if (['OB', 'OW', 'OF', 'SQ', 'UT', 'UN', 'OL', 'OV', 'OD'].includes(vr)) {
                length = view.getUint32(offset + 4, true);
                offset += 8;
            } else {
                // For other VRs, length is stored as 16-bit after VR
                length = view.getUint16(offset + 2, true);
                offset += 4;
            }

            if (group === 0x0028 && element === 0x0010) rows = view.getUint16(offset, true); // Rows
            if (group === 0x0028 && element === 0x0011) cols = view.getUint16(offset, true); // Columns
            if (group === 0x0028 && element === 0x0100) bitsAllocated = view.getUint16(offset, true); // Bits Allocated
            if (group === 0x0028 && element === 0x0012) {
                const bitsStored = view.getUint16(offset, true); // Bits Stored
                if (bitsStored > 0 && bitsStored < bitsAllocated) {
                    bitsAllocated = bitsStored;
                }
            }
            if (group === 0x0028 && element === 0x0101) {
                const bitsStored = view.getUint16(offset, true); // Bits Stored
                if (bitsStored > 0 && bitsStored < bitsAllocated) {
                    bitsAllocated = bitsStored;
                }
            }
            if (group === 0x7FE0 && element === 0x0010) {
                pixelDataOffset = offset;
                break;
            }
            offset += length;
        }

        if (pixelDataOffset && rows && cols) {
            const pixelCount = rows * cols;
            let pixels;

            // Create the appropriate array based on bits allocated
            if (bitsAllocated <= 8) {
                pixels = new Uint8Array(buffer, pixelDataOffset, pixelCount);
            } else {
                pixels = new Uint16Array(buffer, pixelDataOffset, pixelCount);
            }

            return { rows, cols, pixels, bitsAllocated };
        }
        return null;
    } catch (e) {
        console.warn('Pixel Parse Error:', e);
        return null;
    }
}
