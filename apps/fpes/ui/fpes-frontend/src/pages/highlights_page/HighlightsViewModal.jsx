import { IconButton, Modal, Paper, Button } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import HighlightsView from "./HighlightsView";


export default function HighlightsViewModal({formData, isOpen, closeModal, onOverwrite}){
    return (
        <Modal open={isOpen} sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        }}>
            <Paper sx={{padding : "2%", maxWidth:"1200px", maxHeight:"600px"}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <IconButton onClick={() => closeModal()}>
                        <CloseIcon/>
                    </IconButton>
                    {onOverwrite && (
                        <Button variant="outlined" onClick={onOverwrite} sx={{mr: 2}}>Overwrite</Button>
                    )}
                </div>
                <HighlightsView formData={formData}/>
            </Paper>
        </Modal>
    )
}