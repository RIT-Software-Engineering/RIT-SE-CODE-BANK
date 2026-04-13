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
  const [editedRow, setEditedRow] = React.useState(row);

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
            onClick={() => setOpen(!open)}
          >
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
              <Typography variant="h6" gutterBottom component="div">
                
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow style={{ backgroundColor: "orange" }}>
                    <TableCell>
                      {" "}
                      <b>Authors: </b>{" "}
                    </TableCell>
                    <TableCell>
                      {" "}
                      <b>Type: </b>{" "}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><input type="text" value={editedRow.authors?.join(", ") || ''} onChange={(e) => handleChange('authors', e.target.value.split(", "))} style={{width: "100%", border: "none", padding: "4px"}}/></TableCell>
                    <TableCell><input type="text" value={editedRow.type || ''} onChange={(e) => handleChange('type', e.target.value)} style={{width: "100%", border: "none", padding: "4px"}}/></TableCell>
                  </TableRow>
                </TableHead>
              </Table>
              {/* <button>Confirm</button> */}
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
        authors: PropTypes.arrayOf(PropTypes.string),
        type: PropTypes.string,
      }),
    ),
  }).isRequired,
};

export default function PublicationTable({ rows = [], onRowsChange = () => {} }) {
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
            <TableCell style={{fontWeight: "bold"}}>Publications</TableCell>
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
