import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Grid,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton as MuiIconButton,
  Tooltip,
  Checkbox,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { CiViewTable } from "react-icons/ci";
import axiosInstance from "../utils/axiosInstance";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(3),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(2),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: "var(--primary-color)",
  color: "var(--primary-text)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2),
}));

const FormField = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const UploadButton = styled(Button)(({ theme }) => ({
  border: "2px dashed var(--primary-color)",
  backgroundColor: "var(--primary-light)",
  "&:hover": {
    backgroundColor: "var(--primary-light-hover)",
    border: "2px dashed var(--primary-hover)",
  },
}));

const dataTypes = [
  "TEXT",
  "INTEGER",
  "BIGINT",
  "NUMERIC",
  "REAL",
  "DOUBLE PRECISION",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
  "JSON",
  "UUID",
];

const CreateTableDialog = ({ open, onClose, dbName, onSubmit }) => {
  const [tableName, setTableName] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [columns, setColumns] = useState([
    {
      name: "",
      type: "TEXT",
      isPrimary: false,
      isNotNull: false,
      isUnique: false,
      defaultValue: "",
      isForeignKey: false,
      foreignKeyTable: "",
      foreignKeyColumn: "",
    },
  ]);

  const [availableTables, setAvailableTables] = useState([]);
  const [tableColumnsCache, setTableColumnsCache] = useState({});
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableTables();
    }
  }, [open, dbName]);

  const fetchAvailableTables = async () => {
    setLoadingTables(true);
    try {
      const response = await axiosInstance.get(
        `/api/databases/${dbName}/tables`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const tableNames = response.data
        .map((table) => table.tablename)
        .filter((name) => name);
      setAvailableTables(tableNames);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchTableColumns = async (tableName) => {
    if (!tableName) return [];

    setLoadingColumns(true);
    try {
      const response = await axiosInstance.get(
        `/api/databases/${dbName}/tables/${tableName}/columns`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const columnNames = response.data.map((col) => col.column_name);
      setTableColumnsCache((prev) => ({
        ...prev,
        [tableName]: columnNames,
      }));

      return columnNames;
    } catch (error) {
      console.error(`Failed to fetch columns for table ${tableName}:`, error);
      return [];
    } finally {
      setLoadingColumns(false);
    }
  };

  const handleForeignKeyTableSelect = async (index, tableName) => {
    handleColumnChange(index, "foreignKeyColumn", "");
    handleColumnChange(index, "foreignKeyTable", tableName);

    if (!tableColumnsCache[tableName]) {
      const columns = await fetchTableColumns(tableName);
      setTableColumnsCache((prev) => ({
        ...prev,
        [tableName]: columns,
      }));
    }
  };

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: "",
        type: "TEXT",
        isPrimary: false,
        isNotNull: false,
        isUnique: false,
        defaultValue: "",
        isForeignKey: false,
        foreignKeyTable: "",
        foreignKeyColumn: "",
      },
    ]);
  };

  const handleRemoveColumn = (index) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];

    if (field === "isPrimary" && value === true) {
      newColumns.forEach((col) => (col.isPrimary = false));
    }

    if (field === "isForeignKey" && value === false) {
      newColumns[index].foreignKeyTable = "";
      newColumns[index].foreignKeyColumn = "";
    }

    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "text/csv") {
        alert("Please upload a CSV file");
        return;
      }
      setCsvFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!tableName) {
      alert("Table name is required");
      return;
    }

    if (columns.every((col) => !col.name.trim()) && !csvFile) {
      alert("Either define columns or upload a CSV file");
      return;
    }

    for (const column of columns) {
      if (column.name.trim() && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
        alert(
          "Column names must start with a letter or underscore and contain only letters, numbers, and underscores"
        );
        return;
      }

      if (column.isForeignKey) {
        if (!column.foreignKeyTable || !column.foreignKeyColumn) {
          alert(
            "Please specify both table and column for foreign key constraints"
          );
          return;
        }
      }
    }

    const filteredColumns = columns
      .filter((col) => col.name.trim())
      .map((col) => ({
        name: col.name,
        type: col.type,
        isPrimary: col.isPrimary,
        isNotNull: col.isNotNull,
        isUnique: col.isUnique,
        defaultValue: col.defaultValue,
        isForeignKey: col.isForeignKey,
        foreignKeyTable: col.foreignKeyTable,
        foreignKeyColumn: col.foreignKeyColumn,
      }));

    const formData = new FormData();
    formData.append("tableName", tableName);
    formData.append("columns", JSON.stringify(filteredColumns));
    if (csvFile) {
      formData.append("csvFile", csvFile);
    }

    setIsSubmitting(true);
    try {
      await onSubmit(dbName, formData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating table:", error);
      alert("Failed to create table. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTableName("");
    setCsvFile(null);
    setColumns([
      {
        name: "",
        type: "TEXT",
        isPrimary: false,
        isNotNull: false,
        isUnique: false,
        defaultValue: "",
        isForeignKey: false,
        foreignKeyTable: "",
        foreignKeyColumn: "",
      },
    ]);
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-container": {
          alignItems: "flex-start",
          marginTop: "5vh",
        },
      }}
    >
      <StyledDialogTitle>
        <Typography
          variant="h6"
          style={{
            color: "var(--primary-text)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CiViewTable size={20} style={{ marginRight: "8px" }} />
          Create New Table in {dbName}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: "var(--primary-text)" }}
          disabled={isSubmitting}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent
        dividers
        sx={{
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <Box component="form" noValidate>
          <Grid container spacing={2}>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Table Name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                required
                variant="outlined"
                disabled={isSubmitting}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "var(--border-radius)",
                  },
                }}
              />
            </FormField>

            <FormField item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Table Columns (Optional - define or upload CSV)
              </Typography>
              <Box
                sx={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-sm)",
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Column Name</TableCell>
                      <TableCell>Data Type</TableCell>
                      <TableCell>Primary</TableCell>
                      <TableCell>Not Null</TableCell>
                      <TableCell>Unique</TableCell>
                      <TableCell>Default</TableCell>
                      <TableCell>Foreign Key</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {columns.map((column, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={column.name}
                            onChange={(e) =>
                              handleColumnChange(index, "name", e.target.value)
                            }
                            placeholder="Column name"
                            disabled={isSubmitting}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={column.type}
                              onChange={(e) =>
                                handleColumnChange(
                                  index,
                                  "type",
                                  e.target.value
                                )
                              }
                              disabled={column.isForeignKey || isSubmitting}
                            >
                              {dataTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Primary Key">
                            <Checkbox
                              checked={column.isPrimary}
                              onChange={(e) =>
                                handleColumnChange(
                                  index,
                                  "isPrimary",
                                  e.target.checked
                                )
                              }
                              icon={<KeyIcon />}
                              checkedIcon={<KeyIcon color="primary" />}
                              disabled={column.isForeignKey || isSubmitting}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Not Null">
                            <Checkbox
                              checked={column.isNotNull}
                              onChange={(e) =>
                                handleColumnChange(
                                  index,
                                  "isNotNull",
                                  e.target.checked
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Unique">
                            <Checkbox
                              checked={column.isUnique}
                              onChange={(e) =>
                                handleColumnChange(
                                  index,
                                  "isUnique",
                                  e.target.checked
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={column.defaultValue}
                            onChange={(e) =>
                              handleColumnChange(
                                index,
                                "defaultValue",
                                e.target.value
                              )
                            }
                            placeholder="Default"
                            disabled={column.isForeignKey || isSubmitting}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Foreign Key">
                            <Checkbox
                              checked={column.isForeignKey}
                              onChange={(e) =>
                                handleColumnChange(
                                  index,
                                  "isForeignKey",
                                  e.target.checked
                                )
                              }
                              icon={<LinkIcon />}
                              checkedIcon={<LinkIcon color="secondary" />}
                              disabled={column.isPrimary || isSubmitting}
                            />
                          </Tooltip>
                          {column.isForeignKey && (
                            <Box sx={{ mt: 1 }}>
                              <FormControl
                                fullWidth
                                size="small"
                                sx={{ mb: 1 }}
                              >
                                <Select
                                  value={column.foreignKeyTable}
                                  onChange={(e) =>
                                    handleForeignKeyTableSelect(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  displayEmpty
                                  disabled={
                                    availableTables.length === 0 || isSubmitting
                                  }
                                  renderValue={(value) =>
                                    value || "Select reference table"
                                  }
                                >
                                  {availableTables.map((tableName) => (
                                    <MenuItem key={tableName} value={tableName}>
                                      {tableName}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={column.foreignKeyColumn}
                                  onChange={(e) =>
                                    handleColumnChange(
                                      index,
                                      "foreignKeyColumn",
                                      e.target.value
                                    )
                                  }
                                  displayEmpty
                                  disabled={
                                    !column.foreignKeyTable ||
                                    !tableColumnsCache[
                                      column.foreignKeyTable
                                    ] ||
                                    isSubmitting
                                  }
                                  renderValue={(value) =>
                                    value || "Select reference column"
                                  }
                                >
                                  {column.foreignKeyTable &&
                                    tableColumnsCache[
                                      column.foreignKeyTable
                                    ]?.map((colName) => (
                                      <MenuItem key={colName} value={colName}>
                                        {colName}
                                      </MenuItem>
                                    ))}
                                </Select>
                              </FormControl>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove column">
                            <span>
                              <MuiIconButton
                                onClick={() => handleRemoveColumn(index)}
                                disabled={isSubmitting}
                              >
                                <DeleteIcon />
                              </MuiIconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddColumn}
                  variant="outlined"
                  disabled={isSubmitting}
                  sx={{
                    borderColor: "var(--primary-color)",
                    color: "var(--primary-color)",
                    "&:hover": {
                      borderColor: "var(--primary-hover)",
                      backgroundColor: "var(--primary-light)",
                    },
                  }}
                >
                  Add Column
                </Button>
              </Box>
            </FormField>

            <FormField item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Optional CSV Upload
              </Typography>
              <input
                type="file"
                accept=".csv"
                id="csv-upload-table"
                hidden
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <label htmlFor="csv-upload-table">
                <UploadButton
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  disabled={isSubmitting}
                  sx={{
                    borderRadius: "var(--border-radius)",
                    textTransform: "none",
                  }}
                >
                  Upload CSV File (Optional)
                </UploadButton>
              </label>
              {csvFile && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Chip
                    label={csvFile.name}
                    onDelete={() => setCsvFile(null)}
                    disabled={isSubmitting}
                    sx={{
                      backgroundColor: "var(--primary-color)",
                      color: "var(--primary-text)",
                    }}
                  />
                </Box>
              )}
            </FormField>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          disabled={isSubmitting}
          sx={{
            borderRadius: "var(--border-radius)",
            borderColor: "var(--primary-color)",
            color: "var(--primary-color)",
            "&:hover": {
              borderColor: "var(--primary-hover)",
              backgroundColor: "var(--primary-light)",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          startIcon={
            isSubmitting ? <CircularProgress size={20} color="inherit" /> : null
          }
          sx={{
            backgroundColor: "var(--primary-color)",
            borderRadius: "var(--border-radius)",
            "&:hover": {
              backgroundColor: "var(--primary-hover)",
            },
          }}
        >
          {isSubmitting ? "Creating..." : "Create Table"}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default CreateTableDialog;
