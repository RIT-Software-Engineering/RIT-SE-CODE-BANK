"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Header from "@components/Header";
import { useUser } from "../../utils/user-context/page";

export default function OfferPage() {
  const router = useRouter();
  const theme = useTheme();
  const { user, setUser } = useUser();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchPendingOffer = async () => {
      if (!user?.id) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/offer/user/${user.id}/pending`
        );

        if (res.status === 404) {
          setOffer(null);
        } else if (!res.ok) {
          throw new Error("Failed to fetch offer");
        } else {
          const data = await res.json();
          setOffer(data);
        }
      } catch (err) {
        console.error("Error fetching offer:", err);
        setNotification({
          open: true,
          message: "Failed to load offer",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOffer();
  }, [user]);

  const handleOfferResponse = async (response) => {
    setResponding(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/offer/${offer.id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to respond to offer");
      }

      setNotification({
        open: true,
        message: response === "ACCEPTED"
          ? "Congratulations! You've accepted your SCOOP offer."
          : "Your response has been recorded.",
        severity: "success",
      });

    setTimeout(async () => {
        try {
            const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.id}`
            );

            if (!res.ok) throw new Error("Failed to refresh user");

            const updatedUser = await res.json();

            setUser(updatedUser);

            router.push("/dashboard");
        } catch (err) {
            console.error("Failed to refresh user:", err);
            router.push("/dashboard");
        }
    }, 2000);
    } catch (err) {
      setNotification({
        open: true,
        message: `Failed to respond: ${err.message}`,
        severity: "error",
      });
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (!offer) {
    return (
      <>
        <Header />
        <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: 2 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" color="text.secondary">
              No Pending Offers
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              You don&apos;t have any pending SCOOP offers at this time.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </Paper>
        </Box>
      </>
    );
  }

  const expiresAt = new Date(offer.offerExpiresAt);
  const daysRemaining = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <Box>
      <Header />

      <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, px: 2 }}>
        <Card elevation={3} sx={{ overflow: "visible" }}>
          <Box
            sx={{
              background: theme.palette.primary.main,
              color: "white",
              p: 4,
              textAlign: "center",
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Congratulations!
            </Typography>
            <Typography variant="h5" sx={{ mt: 1, opacity: 0.95 }}>
              You&apos;ve Been Approved for SCOOP
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Dear {offer.firstName} {offer.lastName},
            </Typography>

            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              We are pleased to inform you that your application for the Software Engineering
              Co-Op Program (SCOOP) has been approved. After careful review of your qualifications,
              academic background, and demonstrated commitment to finding a co-op position, we
              believe you would be an excellent fit for the program.
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              What is SCOOP?
            </Typography>

            <Typography variant="body1" paragraph>
              SCOOP is a unique opportunity for Software Engineering students who are actively
              seeking co-op positions but haven&apos;t yet secured one. Through SCOOP, you&apos;ll:
            </Typography>

            <Box component="ul" sx={{ pl: 4, mb: 2, listStyleType: 'disc' }}>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Work on real-world software projects with faculty supervision
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Gain valuable professional experience and technical skills
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Collaborate with other SCOOP participants in a team environment
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Continue your co-op search while building your portfolio
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Next Steps
            </Typography>

            <Typography variant="body1" paragraph>
              Please review this offer carefully and respond by{" "}
              <strong>{expiresAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</strong>{" "}
              ({daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining).
            </Typography>

            <Typography variant="body1" paragraph>
              Upon acceptance, you will:
            </Typography>

            <Box component="ol" sx={{ pl: 4, mb: 2, listStyleType: 'decimal' }}>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Be assigned to a project team
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Receive access to team resources (GitHub, Slack, etc.)
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Meet with your SCOOPervisor to discuss project details
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Begin your SCOOP experience on the official start date
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Accepting this offer does not prevent you from
                continuing your external co-op search. We encourage you to keep applying to
                positions, as finding an industry co-op remains your primary goal.
              </Typography>
            </Alert>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                mt: 4,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleOfferResponse("ACCEPTED")}
                disabled={responding}
                sx={{
                  minWidth: 100,
                  minHeight: 50,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                {responding ? <CircularProgress size={24} /> : "Accept Offer"}
              </Button>

              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={() => handleOfferResponse("DECLINED")}
                disabled={responding}
                sx={{
                  minWidth: 100,
                  minHeight: 50,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                Decline Offer
              </Button>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 3 }}
            >
              If you have any questions about this offer, please contact your SCOOPdinator.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification((p) => ({ ...p, open: false }))}
      >
        <Alert
          onClose={() => setNotification((p) => ({ ...p, open: false }))}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}