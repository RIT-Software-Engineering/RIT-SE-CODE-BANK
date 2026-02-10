"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ROLES } from "@/configuration/dashboard.config";

// API Configuration
const BASE_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
const DATABASE_API_EXTENSION = process.env.NEXT_PUBLIC_DATABASE_API_EXTENSION;

const FEATURE_LABELS = {
  MESSAGING: "Messaging (Slack Integration)",
  TIMECARD: "Timecard Management",
  POSITIONS: "Job Positions",
  APPLICATIONS: "Applications",
  PROFILES: "User Profiles",
  KRONOS: "Kronos Link",
  ORACLE: "Oracle Link",
  SLACK_WORKSPACE_URL: "Show Slack Workspace Join Link",
};

const FEATURE_DESCRIPTIONS = {
  MESSAGING: "Enable Slack messaging functionality for direct communication",
  TIMECARD: "Enable timecard tracking and management features",
  POSITIONS: "Enable job position creation and management",
  APPLICATIONS: "Enable job application submission and review",
  PROFILES: "Enable user profile viewing and editing",
  KRONOS: "Enable quick access link to Kronos timecard system",
  ORACLE: "Enable quick access link to Oracle MyInfo portal",
  SLACK_WORKSPACE_URL: "Show Slack workspace join link in notification settings. When disabled, users must contact the department for access.",
};

export default function FeatureFlagsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const userRole = currentUser?.role;
  const router = useRouter();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, featureName: null, newValue: null });

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && userRole !== ROLES.ADMIN) {
      router.push("/");
    }
  }, [userRole, authLoading, router]);

  // Fetch feature flags on mount
  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_API_URL}${DATABASE_API_EXTENSION}/feature-flags`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch feature flags");
      }

      const data = await response.json();
      setFeatures(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching feature flags:", err);
      setError("Failed to load feature flags. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (featureName) => {
    const currentValue = features[featureName];
    const newValue = !currentValue;
    
    // Open confirmation dialog
    setConfirmDialog({ open: true, featureName, newValue });
  };

  const handleConfirmToggle = async () => {
    const { featureName, newValue } = confirmDialog;
    const currentValue = features[featureName];
    
    // Close dialog
    setConfirmDialog({ open: false, featureName: null, newValue: null });

    // Optimistic update
    setFeatures((prev) => ({ ...prev, [featureName]: newValue }));
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await fetch(`${BASE_API_URL}${DATABASE_API_EXTENSION}/feature-flags/${featureName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to update feature flag");
      }

      setSuccessMessage(
        `${FEATURE_LABELS[featureName]} has been ${newValue ? "enabled" : "disabled"}.`
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating feature flag:", err);
      // Revert optimistic update on error
      setFeatures((prev) => ({ ...prev, [featureName]: currentValue }));
      setError(`Failed to update ${FEATURE_LABELS[featureName]}. Please try again.`);
    }
  };

  const handleCancelToggle = () => {
    setConfirmDialog({ open: false, featureName: null, newValue: null });
  };

  if (authLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Checking permissions...</Typography>
      </Container>
    );
  }

  if (userRole !== ROLES.ADMIN) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading feature flags...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Feature Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enable or disable features for all users. Changes take effect immediately.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        <Divider sx={{ mb: 3 }} />

        {Object.entries(features).map(([featureName, isEnabled]) => (
          <Box
            key={featureName}
            
            sx={(theme)=>({ mb: 3,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1, background: theme.palette.mode === 'dark'
                    ? ""
                    : "#e0e0e0" })}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={() => handleToggle(featureName)}
                  color="primary"
                />
              }
              label={
                <Box >
                  <Typography variant="h6">
                    {FEATURE_LABELS[featureName] || featureName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {FEATURE_DESCRIPTIONS[featureName] || "No description available"}
                  </Typography>
                </Box>
              }
            />
          </Box>
        ))}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelToggle}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          Confirm Feature Toggle
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Are you sure you want to {confirmDialog.newValue ? "enable" : "disable"}{" "}
            <strong>{FEATURE_LABELS[confirmDialog.featureName]}</strong>?
            {!confirmDialog.newValue && (
              <>
                <br /><br />
                This will hide the feature from all users immediately.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelToggle} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmToggle} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
