import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { getFacultyById, updateFaculty } from "../../api/faculty_api_imports";

export default function ProfilePage() {
  const [faculty, setFaculty] = useState(null);
  const [editing, setEditing] = useState(false);
  
  // TODO: Replace with actual logged-in faculty ID from your auth system
  const currentFacultyId = 6;

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      rank: "",
      unit: "",
      affiliations: "",
    },
  });

  // Load faculty data
  useEffect(() => {
    getFacultyById(currentFacultyId)
      .then((res) => {
        const data = res?.data;
        setFaculty(data);
        reset({
          name: data?.name || "",
          rank: data?.rank || "",
          unit: data?.unit || "",
          affiliations: data?.affiliations || "",
        });
      })
      .catch(console.error);
  }, [currentFacultyId, reset]);

  const onSubmit = async (values) => {
    try {
      await updateFaculty(currentFacultyId, values);
      setFaculty((prev) => ({ ...prev, ...values }));
      setEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // Parse user_role string into array
const roles = faculty?.user_role 
    ? String(faculty.user_role).split(",").filter(role => role.trim() !== '') 
    : [];
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Faculty Profile
      </Typography>

      {/* Display Mode */}
      {!editing && faculty && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">{faculty.name}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Rank
              </Typography>
              <Typography variant="body1">{faculty.rank}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Unit
              </Typography>
              <Typography variant="body1">{faculty.unit}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Affiliations
              </Typography>
              <Typography variant="body1">
                {faculty.affiliations || "None"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Roles
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {roles.map((role) => (
                  <Chip key={role} label={role} color="primary" />
                ))}
              </Box>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={() => setEditing(true)}
            sx={{ mt: 3 }}
          >
            Edit Profile
          </Button>
        </Paper>
      )}

      {/* Edit Mode */}
      {editing && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Profile
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "grid", gap: 2 }}
          >
            <FormControl>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </FormControl>

            <FormControl>
              <Controller
                name="rank"
                control={control}
                rules={{ required: "Rank is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Rank"
                    error={!!errors.rank}
                    helperText={errors.rank?.message}
                  />
                )}
              />
            </FormControl>

            <FormControl>
              <Controller
                name="unit"
                control={control}
                rules={{ required: "Unit is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unit"
                    error={!!errors.unit}
                    helperText={errors.unit?.message}
                  />
                )}
              />
            </FormControl>

            <FormControl>
              <Controller
                name="affiliations"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Affiliations"
                    helperText="Optional"
                  />
                )}
              />
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              Note: Contact an administrator to change your roles
            </Typography>

            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditing(false);
                  reset();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                Save Changes
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}