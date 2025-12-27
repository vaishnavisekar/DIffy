export function compareFolders(sourceFolder, targetFolder) {
    if (!sourceFolder || !targetFolder) {
        console.warn('Invalid folder data for comparison');
        return { removed: [], added: [], changed: [], unchanged: [] };
    }

    const sourceMap = new Map((sourceFolder.files || []).map(f => [f.relativePath || f.name, f]));
    const targetMap = new Map((targetFolder.files || []).map(f => [f.relativePath || f.name, f]));

    const allFileNames = new Set([...sourceMap.keys(), ...targetMap.keys()]);

    const comparison = {
        removed: [],
        added: [],
        changed: [],
        unchanged: []
    };

    allFileNames.forEach(fileName => {
        const sourceFile = sourceMap.get(fileName);
        const targetFile = targetMap.get(fileName);

        if (sourceFile && !targetFile) {
            comparison.removed.push({ source: sourceFile, target: null, name: fileName });
        } else if (!sourceFile && targetFile) {
            comparison.added.push({ source: null, target: targetFile, name: fileName });
        } else if (sourceFile && targetFile) {
            let isDifferent;
            if (sourceFile.contentHash && targetFile.contentHash) {
                isDifferent = sourceFile.contentHash !== targetFile.contentHash;
            } else {
                isDifferent =
                    sourceFile.size !== targetFile.size ||
                    sourceFile.date !== targetFile.date ||
                    (sourceFile.content !== undefined && targetFile.content !== undefined && sourceFile.content !== targetFile.content);
            }

            if (isDifferent) {
                comparison.changed.push({ source: sourceFile, target: targetFile, name: fileName });
            } else {
                comparison.unchanged.push({ source: sourceFile, target: targetFile, name: fileName });
            }
        }
    });

    return comparison;
}
