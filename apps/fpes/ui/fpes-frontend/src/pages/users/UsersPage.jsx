import { useState } from "react";
import { TextField, Button, MenuItem, Card, CardContent, Typography } from "@mui/material";

export default function CreateUserPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    rank: "",
    unit: "",
    affiliations: "",
    role: "faculty"
  });

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/faculty", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.fullName,
            rank: formData.rank,
            unit: formData.unit,
            affiliations: formData.affiliations,
            user_role: formData.role
          })
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`HTTP ${res.status}: ${errorText}`);
          alert(`Error: ${res.status} ${res.statusText}`);
          return;
        }

        const data = await res.json();
        alert(`User has been created. Id = ${data.faculty_id}`);
        setFormData({
          fullName: "",
          email: "",
          rank: "",
          unit: "",
          affiliations: "",
          role: "faculty"
        });
        
      } catch (err) {
        console.error(err);
        alert("Error creating user: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
      <Card style={{ width: "450px", padding: "20px" }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Create New User
          </Typography>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <TextField
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <TextField
              label="Rank"
              name="rank"
              type="rank"
              value={formData.rank}
              onChange={handleChange}
              required
            />

            <TextField
              label="Unit"
              name="unit"
              type="unit"
              value={formData.unit}
              onChange={handleChange}
              required
            />

            <TextField
              label="Affiliations"
              name="affiliations"
              type="affiliations"
              value={formData.affiliations}
              onChange={handleChange}
              required
            />

            <TextField
              select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            <Button type="submit" variant="contained" color="primary">
              Create User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}