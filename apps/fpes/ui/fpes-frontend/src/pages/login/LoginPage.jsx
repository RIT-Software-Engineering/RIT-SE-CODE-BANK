import { useState, useEffect } from "react";
import { Box, Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import axios from "axios";

export default function LoginPage({ setRole, setIsAuthenticated }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    axios.get("http://localhost:3000/faculty")
      .then(res => setUsers(res.data))
      .catch(console.error);
  }, []);

  const handleLogin = () => {
    //if (selectedUser) {
      //const user = users.find(u => u.faculty_id === selectedUser);
      //setRole(user.user_role); 
      setIsAuthenticated(true);
    //}
  };

  return (
    <Box sx={{ width: 300, margin: "auto", mt: 10 }}>
      <FormControl fullWidth>
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


          <TextField 
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required 
          />

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