import { IconButton, Modal, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import HighlightsView from "./HighlightsView";


export default function HighlightsViewModal({formData, isOpen, closeModal}){
    return (
        <Modal open={isOpen} sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        }}>
            <Paper sx={{padding : "2%", maxWidth:"1200px", maxHeight:"600px"}}>
                <div>
                    <IconButton>
                        <CloseIcon onClick={() => closeModal()}/>
                    </IconButton>
                </div>
                <HighlightsView formData={formData}/>
            </Paper>
        </Modal>
    )
}