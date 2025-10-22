import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { useForm, Controller } from "react-hook-form";

// Use your api layer exactly as given
import { getCourses, createCourse, deleteCourse, getDepartments } from "../../api/course_api_imports";

export default function CoursesPage() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Map department_id -> department_name for table rendering
  const deptNameById = useMemo(() => {
    const m = new Map();
    departments?.forEach((d) => m.set(d.id, d.department_name ?? `Dept #${d.id}`));
    return m;
  }, [departments]);

  // Initial data load
  useEffect(() => {
    let mounted = true;
    Promise.all([getCourses(), getDepartments()])
      .then(([c, d]) => {
        if (!mounted) return;
        setRows(c?.data ?? []);
        setDepartments(d?.data ?? []);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, []);

  // Delete flow
  const requestDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCourse(deleteId);
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.3, minWidth: 70 },
    { field: "course_code", headerName: "Course Code", flex: 0.8, minWidth: 120,
      renderCell: (params) => (
        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{params.value}</span>
      )
    },
    { field: "course_name", headerName: "Course Name", flex: 1.2, minWidth: 180, maxWidth: 380,
      renderCell: (params) => (
        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{params.value}</span>
      )
    },
    { field: "credits", headerName: "Credits", type: "number", flex: 0.5, minWidth: 80 },
    {
      field: "department_id",
      headerName: "Department",
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const id = params;
        return id ? deptNameById.get(id) || `Dept #${id}` : "—";
      },
      renderCell: (params) => (
        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{params.formattedValue}</span>
      )
    },
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton onClick={() => requestDelete(params.row.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Typography variant="h5">Courses</Typography>

      {/* WIDTH-STABLE WRAPPER */}
      <Paper sx={{ maxWidth: 1000, mx: "auto" }}>
        <Box sx={{ height: 430, width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
            disableRowSelectionOnClick
            sx={{
              width: "100%",
              "& .MuiDataGrid-cell": {
                whiteSpace: "normal",
                wordBreak: "break-word",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                whiteSpace: "normal",
                lineHeight: 1.2,
              },
            }}
          />
        </Box>
      </Paper>

      <CreateCourseForm
        departments={departments}
        onCreated={(createdRow) => setRows((prev) => [...prev, createdRow])}
      />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <Box sx={modalBoxStyle}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Delete this course?
          </Typography>
          <Typography sx={{ mb: 2 }}>This cannot be undone.</Typography>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button color="error" variant="contained" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

function CreateCourseForm({ departments, onCreated }) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      course_code: "",
      course_name: "",
      credits: "",
      department_id: "", // optional if DB allows null
    },
  });

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      credits: Number(values.credits) || 0,
      department_id: values.department_id ? Number(values.department_id) : null,
    };

    const res = await createCourse(payload);

    // If API returns only { id }, merge with payload; else use full row
    const created = res?.data?.id ? { ...payload, id: res.data.id } : res?.data ?? payload;

    onCreated(created);
    reset();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Add Course
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "grid", gridTemplateColumns: { sm: "1fr 1fr" }, gap: 2 }}
      >
        <FormControl>
          <Controller
            name="course_code"
            control={control}
            rules={{ required: "Course code is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Course Code"
                error={!!errors.course_code}
                helperText={errors.course_code?.message}
              />
            )}
          />
        </FormControl>

        <FormControl>
          <Controller
            name="course_name"
            control={control}
            rules={{ required: "Course name is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Course Name"
                error={!!errors.course_name}
                helperText={errors.course_name?.message}
              />
            )}
          />
        </FormControl>

        <FormControl>
          <Controller
            name="credits"
            control={control}
            rules={{
              required: "Credits are required",
              validate: (v) => (Number(v) >= 0 ? true : "Must be a non-negative number"),
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Credits"
                type="number"
                inputProps={{ min: 0 }}
                error={!!errors.credits}
                helperText={errors.credits?.message}
              />
            )}
          />
        </FormControl>

        <FormControl>
          <InputLabel id="dept-label">Department</InputLabel>
          <Controller
            name="department_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                labelId="dept-label"
                label="Department"
                displayEmpty
                value={field.value || ""}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>
                    {d.department_name ?? `Dept #${d.id}`}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
          <FormHelperText>
            Optional if your DB allows null; recommended to select a department.
          </FormHelperText>
        </FormControl>

        <Box sx={{ gridColumn: { sm: "1 / span 2" }, display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => reset()} disabled={isSubmitting}>
            Clear
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Submit
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

const modalBoxStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  bgcolor: "background.paper",
  border: "1px solid",
  boxShadow: 24,
  p: 3,
};
