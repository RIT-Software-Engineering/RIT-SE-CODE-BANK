import { useState, useEffect } from 'react';

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
            const hasExternalLinks = editor.isActive('link');
            
            const htmlContent = editor.getHTML();
            const hasResourceLinks = htmlContent.includes('<a ') && htmlContent.includes('href=');
            
            const linksPresent = hasExternalLinks || hasResourceLinks;
            setHasLinks(linksPresent);
        };

        checkForLinks();

        const updateHandler = editor.on('update', checkForLinks);
        const selectionHandler = editor.on('selectionUpdate', checkForLinks);

        const transactionHandler = editor.on('transaction', checkForLinks);

        return () => {
            updateHandler?.off('update', checkForLinks);
            selectionHandler?.off('selectionUpdate', checkForLinks);
            transactionHandler?.off('transaction', checkForLinks);
        };
    }, [editor]);

    return hasLinks;
}