import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Box, Typography, Card, Chip, Button, Dialog, DialogContent, TextField, MenuItem, Select, FormControl, IconButton, Divider, Grid, InputAdornment } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

const inputSx = { bgcolor: "#f3f4f6", borderRadius: "4px", "& fieldset": { border: "none" } };

export default function Customers() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");
  const [openForm, setOpenForm] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({ id: null, name: "", address: "", pan: "", gst: "", is_active: true });

  // Fetch
  const fetchData = async () => {
    try {
      const res = await api.get("/customer"); setList(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // Handlers
  const handleOpenAdd = () => {
    setFormData({ id: null, name: "", address: "", pan: "", gst: "", is_active: true }); setIsEditMode(false); setOpenForm(true);
  };
  const handleCardClick = (customer) => { setFormData(customer); setOpenDetails(true); };
  const handleEditClick = () => { setOpenDetails(false); setIsEditMode(true); setOpenForm(true); };

  // Save krne ka logic
  const handleSave = async () => {
    if (!formData.name || !formData.address || !formData.pan) { return alert("Please fill Customer Name, Address, and PAN."); }
    try {
      if (isEditMode) { await api.put(`/customer/update/${formData.id}`, formData); } else { await api.post("/customer/add", { cust_id: "C" + Math.floor(Math.random() * 100000), ...formData }); }
      setOpenForm(false); fetchData(); 
    } catch (err) { console.error(err); alert("Failed to save customer."); }
  };

  // Filter
  const filteredList = list.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.cust_id.toLowerCase().includes(searchQuery.toLowerCase()));

  // UI start
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => nav("/master")} sx={{ color: "#111827", p: 0, mr: 1 }}><ArrowBackIcon /></IconButton>
          <Typography variant="h6" fontWeight="bold" color="#111827">CUSTOMERS</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField size="small" placeholder="Search by Name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ bgcolor: "#fff", borderRadius: "6px", width: "250px" }} InputProps={{ startAdornment: ( <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment> ), }} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ bgcolor: "#4f46e5", borderRadius: "6px", textTransform: "none", height: "40px", px: 3, "&:hover": { bgcolor: "#4338ca" } }}>ADD CUSTOMER</Button>
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 3 }}>
        {filteredList.map((c) => (
          <Card key={c.id} onClick={() => handleCardClick(c)} elevation={0} sx={{ p: 2.5, borderRadius: "8px", border: "1px solid #d1d5db", height: "120px", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", transition: "0.2s", "&:hover": { borderColor: "#4f46e5", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" } }}>
            <Typography fontWeight="bold" variant="h6" color="#111827" sx={{ lineHeight: 1.2, fontSize: "1.15rem" }}>{c.name}</Typography>
            <Box display="flex" justifyContent="flex-end">
              <Chip label={c.is_active !== false ? "Active" : "In-Active"} sx={{ bgcolor: c.is_active !== false ? "#dcfce7" : "#fee2e2", color: c.is_active !== false ? "#166534" : "#991b1b", fontWeight: "bold", borderRadius: "4px", height: "28px", fontSize: "0.85rem", px: 1 }} />
            </Box>
          </Card>
        ))}
        {filteredList.length === 0 && ( <Typography color="text.secondary" sx={{ gridColumn: "1 / -1", textAlign: "center", mt: 4 }}>No customers found.</Typography> )}
      </Box>

      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2} borderBottom="1px solid #e5e7eb">
          <Button startIcon={<ArrowBackIcon />} onClick={() => setOpenDetails(false)} sx={{ color: "#4b5563", textTransform: "none" }}>Back</Button>
          <Button startIcon={<EditIcon />} onClick={handleEditClick} sx={{ color: "#4f46e5", textTransform: "none", fontWeight: "bold" }}>Edit</Button>
        </Box>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" mb={4} color="#111827">{formData.name}</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">CUSTOMER ID</Typography><Typography variant="body1" fontWeight="500" fontSize="1.1rem">{formData.cust_id}</Typography></Box>
            <Divider />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">ADDRESS</Typography><Typography variant="body1" fontWeight="500" fontSize="1.1rem">{formData.address}</Typography></Box>
            <Divider />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">PAN CARD</Typography><Typography variant="body1" fontWeight="500" fontSize="1.1rem">{formData.pan}</Typography></Box>
            <Divider />
            <Box><Typography variant="caption" color="text.secondary" fontWeight="bold">GST NUMBER</Typography><Typography variant="body1" fontWeight="500" fontSize="1.1rem">{formData.gst || "N/A"}</Typography></Box>
            <Divider />
            <Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="caption" color="text.secondary" fontWeight="bold">STATUS</Typography><Chip label={formData.is_active !== false ? "Active" : "In-Active"} sx={{ bgcolor: formData.is_active !== false ? "#dcfce7" : "#fee2e2", color: formData.is_active !== false ? "#166534" : "#991b1b", fontWeight: "bold", borderRadius: "4px", fontSize: "0.9rem" }} /></Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth PaperProps={{ sx: { p: 2, borderRadius: "8px" } }}>
        <DialogContent>
          <Typography variant="h5" fontWeight="bold" mb={4}>{isEditMode ? "Edit Customer" : "Add New Customer"}</Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}><Typography variant="body2" fontWeight="bold" mb={1} fontSize="1rem">Customer Name</Typography><TextField fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2" fontWeight="bold" mb={1} fontSize="1rem">Customer Address</Typography><TextField fullWidth value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2" fontWeight="bold" mb={1} fontSize="1rem">Customer Pan Card Number</Typography><TextField fullWidth value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value })} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2" fontWeight="bold" mb={1} fontSize="1rem">Customer GST Number</Typography><TextField fullWidth value={formData.gst} onChange={(e) => setFormData({ ...formData, gst: e.target.value })} sx={inputSx} /></Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" fontWeight="bold" mb={1} fontSize="1rem">Customer Status</Typography>
              <FormControl fullWidth sx={inputSx}>
                <Select value={formData.is_active !== false} onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}>
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>In-Active</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box mt={6} display="flex" gap={2}>
            <Button variant="outlined" color="error" onClick={() => setOpenForm(false)} sx={{ textTransform: "none", px: 4, fontSize: "1rem" }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} sx={{ bgcolor: "#4f46e5", textTransform: "none", px: 4, fontSize: "1rem", "&:hover": { bgcolor: "#1e1b4b" } }}>{isEditMode ? "Update" : "Create"}</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}