"use client";
import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Snackbar, Alert,CircularProgress } from "@mui/material";
import {useUser} from "../utils/user-context/page";


export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {setUser} = useUser();
  const router = useRouter();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // "success" or "error"
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const endpoint = isSignup
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log(data);

      if (res.ok) {
        setSnackbarMessage(
          isSignup ? "Account created successfully!" : "Logging in!"
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setLoading(true);

        if(!isSignup){
            setUser(data.user);
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setSnackbarMessage(
          data.error || "Incorrect credentials. Please try again."
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("Server error. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          icon={loading && snackbarSeverity === "success"
                ? <CircularProgress size={20} sx={{color: "inherit"}} />
                : undefined
            }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Box position="relative">
        <IconButton
            onClick={handleBack}
            aria-label="back"
            sx={{position: "absolute", top: "20px", left: "20px", color: "white"}}
        >
            <ArrowBackIcon />
        </IconButton>
        <img src="/scoop-portal/orange_black/RIT_rgb_hor_k1.png" alt="RIT logo" style={{ position: "absolute", top: "20px", right: "20px", width: "300px"}}/>
         <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100vh"
            sx={{
                backgroundImage: "url('/scoop-portal/aerial_drone_09-web.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "100vh",
            }}
        >
            <img src="/scoop-portal/Roaring Tiger/rgb/Roaring Tiger_rgb.png" alt="RIT logo" style={{width: "100px", marginBottom: "20px"}} />
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{
                    border: "1px solid #F76902",
                    borderRadius: "16px",
                    padding: "40px 36px",
                    backgroundColor:"#000000BF"
                }}
            >
                <Typography variant="h4" mb={2}>
                    {isSignup ? "Create an Account" : "Login"}
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
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{
                        width: "300px",
                        mb: 1,
                        backgroundColor: "#F76902",
                        color: "#fff",
                    }}
                >
                    {isSignup ? "Create" : "Login"}
                </Button>
                {/** This is incase we want to give anyone who visits the site, the ability to create an account */}
                {/* <Button variant="text" onClick={() => setIsSignup(!isSignup)}>
                {isSignup
                    ? "Already have an account? Log in"
                    : "Don't have an account? Sign up"}
                </Button> */}
            </Box>
        </Box>
      </Box>
    </Box>
  );
}
