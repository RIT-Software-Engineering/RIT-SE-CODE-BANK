"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../utils/user-context/page";
import { Select, MenuItem, Button, Typography, Box } from "@mui/material";

export default function SelectUserPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const { setUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
    };

    fetchUsers();
  }, []);

  const handleSelect = async () => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      setUser(user); // set user
      console.log(user.type);
      if (user.type === "admin") {
        //rename to scoopdinator later
        router.push("scoopdinator/dashboard");
      } else if (user.type === "coach") {
        //rename to scoopervisor later
        router.push("scoopervisor/dashboard");
      } else {
        router.push("scooployee/dashboard");
      }
      // router.push("/home-page");
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h5">Select user</Typography>
      <Select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        fullWidth
        margin="normal"
      >
        {users.map((user) => (
          <MenuItem key={user.id} value={user.id}>
            {user.fname} {user.lname} ({user.type})
          </MenuItem>
        ))}
      </Select>
      <Button variant="outline-orange" onClick={handleSelect}>
        Continue
      </Button>
    </Box>
  );
}
