"use client";
import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    const endpoint = isSignup ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup` : `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log(data);
  };

   const handleBack = () => {
    router.back();
  };

  return (
    <Box>
      <IconButton onClick={handleBack} aria-label="back">
              <ArrowBackIcon />
            </IconButton>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      <Typography variant="h4" mb={2}>
        {isSignup ? "Create an Account" : "Log In"}
      </Typography>
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2, width: "300px" }}
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mb: 2, width: "300px" }}
      />
      <Button variant="contained" onClick={handleSubmit} sx={{ width: "300px", mb: 1 , backgroundColor: "#F76902", color: "#fff" }}>
        {isSignup ? "Sign Up" : "Log In"}
      </Button>
      <Button variant="text" onClick={() => setIsSignup(!isSignup)}>
        {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
      </Button>
      </Box>
    </Box>
  );
}

