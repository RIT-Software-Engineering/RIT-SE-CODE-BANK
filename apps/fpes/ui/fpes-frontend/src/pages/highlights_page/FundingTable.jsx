import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

function Row(props) {
  const { row, index, onRowChange } = props;
  const [open, setOpen] = React.useState(false);
  // Normalize field names from parsed data to database schema
  // Format dates to YYYY-MM-DD if they have time component
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (typeof dateStr === 'string') {
      return dateStr.split('T')[0].split(' ')[0]; // Remove time if present
    }
    return dateStr;
  };

  const normalizedRow = {
    ...row,
    faculty_role: row.faculty_role || row.role,
    faculty_share: row.faculty_share || row.share,
    comments: row.comments || row.additional_comments,
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date)
  };
  const [editedRow, setEditedRow] = React.useState(normalizedRow);

  const handleChange = (field, value) => {
    const updated = { ...editedRow, [field]: value };
    setEditedRow(updated);
    onRowChange(index, updated);
  };

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell width="50px">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography variant="subtitle1" fontWeight="bold">
            {editedRow.title}
          </Typography>
        </TableCell>
      </TableRow>

      {/* INNER ROW: Shows the detailed table when expanded */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Box style={{ paddingBottom: "10px" }}>
                <Typography variant="subtitle2"><b>Status: </b></Typography>
                <input type="text" value={editedRow.grant_status || editedRow.progress || ''} onChange={(e) => handleChange('grant_status', e.target.value)} style={{width: "100%", border: "1px solid #ccc", padding: "4px", background:"white", color:"black"}}/>
              </Box>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow style={{ backgroundColor: "orange"}}>
                    <TableCell> <b>Funder: </b> </TableCell>  
                    <TableCell> <b>Amount: </b> </TableCell>
                    <TableCell> <b>Start Date: </b> </TableCell>
                    <TableCell> <b>End Date: </b> </TableCell>
                    <TableCell> <b>Role: </b></TableCell>
                    <TableCell> <b>Share: </b></TableCell>
                    <TableCell> <b>Comments: </b> </TableCell>

                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><input type="text" value={editedRow.funder || ''} onChange={(e) => handleChange('funder', e.target.value)} style={{width: "100%", border: "none", padding: "4px", background:"white", color:"black"}}/></TableCell>  
                    <TableCell><input type="text" value={editedRow.amount || ''} onChange={(e) => handleChange('amount', e.target.value)} style={{width: "100%", border: "none", padding: "4px", background:"white", color:"black"}}/></TableCell>
                    <TableCell><input type="date" value={editedRow.start_date || ''} onChange={(e) => handleChange('start_date', e.target.value)} style={{width: "100%", border: "none", padding: "4px", background:"white", color:"black"}}/></TableCell>
                    <TableCell><input type="date" value={editedRow.end_date || ''} onChange={(e) => handleChange('end_date', e.target.value)} style={{width: "100%", border: "none", padding: "4px", background:"white", color:"black"}}/></TableCell>
                    <TableCell><input type="text" value={editedRow.faculty_role || ''} onChange={(e) => handleChange('faculty_role', e.target.value)} style={{width: "100%", border: "none", padding: "4px", background:"white", color:"black"}}/></TableCell>
                    <TableCell><input type="text" value={editedRow.faculty_share || ''} onChange={(e) => handleChange('faculty_share', e.target.value)} style={{width: "100%", border: "none", padding: "4px", background:"white", color:"black"}}/></TableCell>
                    <TableCell><input type="text" value={editedRow.comments || ''} onChange={(e) => handleChange('comments', e.target.value)} style={{width: "100%", border: "none", padding: "4px", background:"white", color:"black"}}/></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Box style={{ paddingTop: "10px" }}>
                <Typography variant="subtitle2"><b>URL: </b></Typography>
                <input type="text" value={editedRow.url || ''} onChange={(e) => handleChange('url', e.target.value)} style={{width: "100%", border: "1px solid #ccc", padding: "4px", background:"white", color:"black"}}/>
              </Box>
            </Box>

          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
    title: PropTypes.string,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        funder: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        start_date: PropTypes.string,
        end_date: PropTypes.string,
        role: PropTypes.string,
        share: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        comments: PropTypes.string,
      }),
    ),
  }).isRequired,
};

export default function FundingTable({ rows = [], onRowsChange = () => {} }) {
  const handleRowChange = (index, updatedRow) => {
    const newRows = [...rows];
    newRows[index] = updatedRow;
    onRowsChange(newRows);
  };

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow style={{background:"orange"}}>
            <TableCell style={{fontWeight: "bold"}}>Grants</TableCell>
                        <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <Row key={row.title || index} row={row} index={index} onRowChange={handleRowChange} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}