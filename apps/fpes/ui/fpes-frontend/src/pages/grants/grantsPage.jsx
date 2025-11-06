import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Paper } from "@mui/material";
import { getGrants } from "../../api/grants_api_imports";
import GrantsForm from "./GrantsForm";
import GrantsTable from "./GrantsTable";

export default function GrantsPage() {
  const [grants, setGrants] = useState([]);

  const fetchGrants = async () => {
    try {
      const response = await getGrants();
      setGrants(response.data);
    } catch (err) {
      console.error("Error fetching grants:", err);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleAddGrant = async (formData) => {
    try {
      await axios.post("http://localhost:3000/grants", formData);
      fetchGrants();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (grant_id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:3000/grants/${grant_id}`);
      fetchGrants();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (updatedGrant) => {
    try {
      await axios.put(
        `http://localhost:3000/grants/${updatedGrant.grant_id}`,
        updatedGrant
      );
      fetchGrants();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Grants Management
      </Typography>

      <Paper sx={{ padding: 3, mb: 4 }}>
        <GrantsForm onAddGrant={handleAddGrant} />
      </Paper>

      <Paper sx={{ height: 500, width: "100%" }}>
        <GrantsTable
          grants={grants}
          onDelete={handleDelete}
          onEditSave={handleEditSave}
        />
      </Paper>
    </Box>
  );
}