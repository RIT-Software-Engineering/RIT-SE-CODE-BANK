import { ArrowDown, ArrowUp, Edit, Move } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { ReadOnlyEditor } from "../../components/RichTextEditor/RichTextEditor";
import { CMTJsonFetch } from "../../utils/api";
import { createErrorHandler } from "../../utils/error";

const STATUS_LABELS = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed"
};

const STATUS_CLASSES = {
    NOT_STARTED: "bg-secondary text-white",
    IN_PROGRESS: "bg-warning text-white",
    COMPLETED: "bg-success text-white"
};

export function SessionBlocks({session, sessions, blocks, materials, refresh, onEditMaterial, setError, createOpen, onCreateClose}) {
    const [blockName, setBlockName] = useState("");
    const [blockToMove, setBlockToMove] = useState(null);
    const [targetSessionId, setTargetSessionId] = useState("");
    const [notificationOption, setNotificationOption] = useState("none");

    const sessionBlocks = blocks
        .filter(block => block.sessionId === session?.id)
        .sort((a, b) => a.position - b.position || a.id - b.id);

    useEffect(() => {
        if (blockToMove) setTargetSessionId(String(blockToMove.sessionId));
    }, [blockToMove]);

    if (!session) return null;

    function handleError(message) {
        return createErrorHandler(message, setError);
    }

    function createBlock() {
        return CMTJsonFetch("POST", "/session/blocks", {sessionId: session.id, name: blockName})
            .then(() => {
                setBlockName("");
                onCreateClose();
                return refresh();
            })
            .catch(handleError("Failed to create session block."));
    }

    function updateStatus(block, status) {
        return CMTJsonFetch("PATCH", `/session/blocks/${block.id}`, {status})
            .then(refresh)
            .catch(handleError("Failed to update block status."));
    }

    function moveBlock(block, targetId, position) {
        return CMTJsonFetch("PATCH", `/session/blocks/${block.id}/move`, {
            targetSessionId: Number(targetId),
            targetPosition: position
        })
            .then(() => {
                setBlockToMove(null);
                setNotificationOption("none");
                return refresh();
            })
            .catch(handleError("Failed to move session block."));
    }

    return (
        <section className="mb-4" aria-label={`Session ${session?.sessionNum} blocks`}>
            <h3 className="text-lg mb-2">Session blocks</h3>

            {sessionBlocks.length === 0 ? (
                <p className="text-gray-500 mb-0">No blocks in this session.</p>
            ) : (
                <div className="border rounded overflow-hidden">
                    {sessionBlocks.map((block, index) => {
                        const blockMaterials = materials.filter(material => material.blockId === block.id);
                        return (
                            <div key={block.id} className="p-3 border-b last:border-b-0 bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold mb-1">{block.name}</p>
                                        <p className="text-sm text-gray-500 mb-0">
                                            {blockMaterials.length} {blockMaterials.length === 1 ? "item" : "items"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Form.Select
                                            size="sm"
                                            aria-label={`${block.name} status`}
                                            className={STATUS_CLASSES[block.status]}
                                            value={block.status}
                                            onChange={event => updateStatus(block, event.target.value)}
                                        >
                                            {Object.entries(STATUS_LABELS).map(([value, label]) =>
                                                <option key={value} value={value} className="bg-secondary text-white">
                                                    {label}
                                                </option>
                                            )}
                                        </Form.Select>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            title="Move block up"
                                            aria-label={`Move ${block.name} up`}
                                            disabled={index === 0}
                                            onClick={() => moveBlock(block, session.id, index - 1)}
                                        >
                                            <ArrowUp size={16} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            title="Move block down"
                                            aria-label={`Move ${block.name} down`}
                                            disabled={index === sessionBlocks.length - 1}
                                            onClick={() => moveBlock(block, session.id, index + 1)}
                                        >
                                            <ArrowDown size={16} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            title="Move block to another session"
                                            aria-label={`Move ${block.name} to another session`}
                                            onClick={() => setBlockToMove(block)}
                                        >
                                            <Move size={16} />
                                        </Button>
                                    </div>
                                </div>
                                {blockMaterials.length > 0 && (
                                    <div className="mt-3 border-t pt-2">
                                        {blockMaterials.map(material => (
                                            <div key={material.id} className="flex items-center justify-between gap-2 py-1">
                                                <div className="min-w-0"><ReadOnlyEditor value={material.label} /></div>
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    title="Edit material"
                                                    aria-label="Edit material"
                                                    onClick={() => onEditMaterial(material.id)}
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal show={createOpen} onHide={onCreateClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add session block</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Block name</Form.Label>
                        <Form.Control
                            value={blockName}
                            onChange={event => setBlockName(event.target.value)}
                            placeholder="e.g. Requirements workshop"
                            autoFocus
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onCreateClose}>Cancel</Button>
                    <Button onClick={createBlock} disabled={!blockName.trim()}>Add block</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={Boolean(blockToMove)} onHide={() => setBlockToMove(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Move {blockToMove?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Destination session</Form.Label>
                        <Form.Select value={targetSessionId} onChange={event => setTargetSessionId(event.target.value)}>
                            {sessions.map(courseSession =>
                                <option key={courseSession.id} value={courseSession.id}>
                                    Session {courseSession.sessionNum}{courseSession.canceled ? " (Canceled)" : ""}
                                </option>
                            )}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Student notification</Form.Label>
                        <Form.Select value={notificationOption} onChange={event => setNotificationOption(event.target.value)}>
                            <option value="none">Do not notify students</option>
                            <option value="students">Prompt to notify students</option>
                            <option value="personal">Create a personal reminder</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setBlockToMove(null)}>Cancel</Button>
                    <Button onClick={() => {
                        void notificationOption;
                        return moveBlock(blockToMove, targetSessionId);
                    }}>Move block</Button>
                </Modal.Footer>
            </Modal>
        </section>
    );
}
