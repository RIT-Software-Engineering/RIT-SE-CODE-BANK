import { useState, useEffect } from "react";
import { Box, Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import axios from "axios";

export default function LoginPage({ setRole, setIsAuthenticated, updateFacultyId}) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    axios.get("http://localhost:3000/faculty")
      .then(res => setUsers(res.data))
      .catch(console.error);
  }, []);

  const handleLogin = () => {
    // 1. Find the selected user object based on the selectedUser state (the ID).
    const user = users.find(u => u.faculty_id === selectedUser);
    
    // 2. Check if a user was found (optional but good practice)
    if (user) {
        // 3. Pass the ID to the function from App.jsx
        updateFacultyId(user.faculty_id); 
        
        // 4. Set the user's role
        setRole(user.user_role); 
        
        // 5. Set authentication status
        setIsAuthenticated(true);
    } else {
        console.error("Please select a user to log in.");
    }
  };

  return (
    <Box sx={{ width: 300, margin: "auto", mt: 10 }}>
      <FormControl fullWidth
        sx={{ 
          '& .MuiInputLabel-shrink': {
              // Adjust this value (e.g., -4px, -8px, etc.)
              // The smaller the negative value, the higher the label goes.
              transform: 'translate(14px, -15px) scale(0.75)', 
          }
      }}>
        <InputLabel>Select User</InputLabel>
        <Select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          {users.map(user => (
            <MenuItem key={user.faculty_id} value={user.faculty_id}>
              {user.name} — {user.rank}
            </MenuItem>
          ))}
        </Select>
      </FormControl>


          {/* <TextField 
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required 
          /> */}

          <Button 
              onClick={handleLogin}
              sx={{ mt: 2 }}
              variant="contained"
            >
           Login
          </Button>
          
    </Box>
  );
}