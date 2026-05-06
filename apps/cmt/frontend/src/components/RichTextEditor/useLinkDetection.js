import { useState, useEffect } from 'react';

function detectLinks(editor) {
    const hasExternalLinks = editor.isActive('link');
    const htmlContent = editor.getHTML();
    const hasResourceLinks = htmlContent.includes('<a ') && htmlContent.includes('href=');

    return hasExternalLinks || hasResourceLinks;
}

/**
 * Utility hook to detect if a TipTap editor contains any links
 * @param {Object} editor - The TipTap editor instance
 * @returns {boolean} - True if the editor contains links, false otherwise
 */
export function useLinkDetection(editor) {
    const [hasLinks, setHasLinks] = useState(false);

    useEffect(() => {
        if (!editor) return;

        const checkForLinks = () => {
            const linksPresent = detectLinks(editor);
            setHasLinks(previousHasLinks =>
                previousHasLinks === linksPresent ? previousHasLinks : linksPresent
            );
        };

        checkForLinks();

        editor.on('update', checkForLinks);
        editor.on('selectionUpdate', checkForLinks);

        return () => {
            editor.off('update', checkForLinks);
            editor.off('selectionUpdate', checkForLinks);
        };
    }, [editor]);

    return hasLinks;
}
