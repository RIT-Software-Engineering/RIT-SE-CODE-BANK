import { useRef } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

export function toNotifyResult(notified){
    return notified === true ? "sent" : notified === false ? "failed" : null;
}

export function NotifyMessage({notifyResult, onClose}){
    const lastResult = useRef(null);
    if (notifyResult) lastResult.current = notifyResult;
    return <ToastContainer position="top-end" className="p-3 position-fixed" style={{zIndex: 2000}}>
        <Toast show={Boolean(notifyResult)} onClose={onClose} delay={4000} autohide bg={lastResult.current === "sent" ? "success" : "danger"}>
            <Toast.Body className="text-white">
                {lastResult.current === "sent" ? "Notification sent successfully" : "Saved, but failed to send notification"}
            </Toast.Body>
        </Toast>
    </ToastContainer>
}