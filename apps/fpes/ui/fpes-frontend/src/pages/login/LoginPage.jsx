import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";

export default function LoginPage(setRole, setIsAuthenticated) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user", 
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

  if (formData.username && formData.password) {
      setIsAuthenticated(true);
      setRole(formData.role);
      setSuccess("Login successful!");
      setError("");
    } else {
      setError("Please enter username and password");
      setSuccess("");
    }
  };

  return (
    <Box
      className="flex justify-center items-center min-h-screen bg-gray-100"
    >
      <Paper
        elevation={3}
        sx={{
          width: 400,
          p: 4,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal">
            <InputLabel></InputLabel>
            <Select
              name="role"
              value={formData.role}
              //label=""
              onChange={handleChange}
            >
              <MenuItem value="guest">Guest</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>


          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Login
          </Button>
        </form>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
        </Typography>
      </Paper>
    </Box>
  );
}