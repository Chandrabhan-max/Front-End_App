import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Box, Typography, Button, Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardActionArea, IconButton, TextField, InputAdornment } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function Billing() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [custModal, setCustModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [custSearchQuery, setCustSearchQuery] = useState("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  // Modal
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '' });
  const openModal = (type, title, message) => setModal({ open: true, type, title, message });
  const closeModal = () => setModal({ ...modal, open: false });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const c = await api.get('/customer');
      const i = await api.get('/item');
       setCustomers(c.data?.data || []);
      setItems(i.data?.data || []);
    } catch (err) { console.error("Failed to load master data", err); }
  };

  const handleSelectCustomer = (c) => {
    setSelectedCustomer(c); setCustModal(false); setCustSearchQuery(""); 
  };

  const toggleItem = (item) => {
    const exists = selectedItems.find(p => p.item_id === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(p => p.item_id !== item.id));
    } else { setSelectedItems([...selectedItems, { item_id: item.id, quantity: 1, ...item }]); }
  };

  const updateQuantity = (itemId, delta) => {
    setSelectedItems(selectedItems.map(p => {
      if (p.item_id === itemId) {
        const newQ = p.quantity + delta; return { ...p, quantity: newQ > 0 ? newQ : 1 };
      }
      return p;
    }));
  };

  const calculateSubTotal = () => { return selectedItems.reduce((acc, curr) => acc + (curr.selling_price * curr.quantity), 0); };

  const createInvoice = async () => {
    if (!selectedCustomer) return openModal('warning', 'Missing Details', "Please select a customer first.");
    if (selectedItems.length === 0) return openModal('warning', 'Missing Details', "Please select at least one item.");
    if (selectedCustomer.is_active === false) { return openModal('error', 'Customer Inactive', `Cannot create invoice. The customer "${selectedCustomer.name}" is currently Inactive.`); }
    const inactiveItems = selectedItems.filter(i => i.is_active === false);
    if (inactiveItems.length > 0) {
      const itemNames = inactiveItems.map(i => i.name).join(', ');
      return openModal('error', 'Item Inactive', `Cannot create invoice. The following items are Inactive: ${itemNames}. Please remove them first.`);
    }
    try {
      const payloadItems = selectedItems.map(i => ({ item_id: i.item_id, quantity: i.quantity }));
      const res = await api.post('/invoice/create', { customer_id: selectedCustomer.id, items: payloadItems });
      nav(`/invoice/${res.data.data.invoice_id}`);
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message || 'Server error occurred.';
      openModal('error', 'Invoice Failed', backendMsg);
    }
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(custSearchQuery.toLowerCase()));
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(itemSearchQuery.toLowerCase()));

  return (
    <Box>
      <Dialog open={modal.open} onClose={closeModal} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          {modal.type === 'error' && <ErrorOutlineIcon color="error" fontSize="large" />}
          {modal.type === 'warning' && <WarningAmberIcon color="warning" fontSize="large" />}
          {modal.type === 'success' && <CheckCircleOutlineIcon color="success" fontSize="large" />}
          <Typography variant="h6" fontWeight="bold">{modal.title}</Typography>
        </DialogTitle>
        <DialogContent><Typography color="text.secondary" fontSize="1.05rem">{modal.message}</Typography></DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button variant="contained" onClick={closeModal} sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: modal.type === 'error' ? '#d32f2f' : '#4f46e5' }}>Understood</Button>
        </DialogActions>
      </Dialog>

      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Typography variant="h5" fontWeight="bold" color="#111827">Billing</Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e5e7eb', mb: 3, borderRadius: '8px' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight="bold" variant="h6">Customer Details</Typography>
          {!selectedCustomer && (<Button variant="outlined" sx={{ textTransform: 'none', borderRadius: '6px' }} startIcon={<AddCircleOutlineIcon />} onClick={() => setCustModal(true)}>Add Customer</Button>)}
        </Box>
        <Divider sx={{ mb: 2 }} />
        {selectedCustomer ? (
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="body1" mb={1} color={selectedCustomer.is_active === false ? "error" : "inherit"}><b>Name :</b> {selectedCustomer.name} {selectedCustomer.is_active === false && "(INACTIVE)"}</Typography>
              <Typography variant="body2" mb={1}><b>Address :</b> {selectedCustomer.address || 'N/A'}</Typography>
              <Typography variant="body2" mb={1}><b>Pan Card :</b> {selectedCustomer.pan || 'N/A'}</Typography>
              <Typography variant="body2"><b>GST Num :</b> {selectedCustomer.gst || 'N/A'}</Typography>
            </Box>
            <Button size="small" sx={{ textTransform: 'none', fontWeight: 'bold' }} color="primary" onClick={() => setCustModal(true)}>Change</Button>
          </Box>
        ) : (<Typography color="text.secondary" align="center" py={3}>No Customer Selected</Typography>)}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight="bold" variant="h6">Items</Typography>
          <Button variant="outlined" sx={{ textTransform: 'none', borderRadius: '6px' }} startIcon={<AddCircleOutlineIcon />} onClick={() => setItemModal(true)}>Add Items</Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {selectedItems.length > 0 ? (
          <Box>
            {selectedItems.map(item => (
              <Box key={item.item_id} display="flex" justifyContent="space-between" alignItems="center" py={1.5} borderBottom="1px dashed #f3f4f6">
                <Typography sx={{ width: '40%', fontWeight: '500' }} color={item.is_active === false ? "error" : "inherit"}>{item.name} {item.is_active === false && "(INACTIVE)"}</Typography>
                <Box display="flex" alignItems="center" sx={{ border: '1px solid #e5e7eb', borderRadius: '6px', bgcolor: '#f9fafb' }}>
                  <IconButton size="small" onClick={() => updateQuantity(item.item_id, -1)}><RemoveCircleOutlineIcon fontSize="small" /></IconButton>
                  <Typography px={2} fontWeight="bold">{item.quantity}</Typography>
                  <IconButton size="small" onClick={() => updateQuantity(item.item_id, 1)}><AddCircleOutlineIcon fontSize="small" /></IconButton>
                </Box>
                <Typography sx={{ width: '20%', textAlign: 'right', fontWeight: 'bold' }}>₹{item.selling_price * item.quantity}</Typography>
              </Box>
            ))}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
              <Typography fontWeight="bold" variant="h6" color="text.secondary">Subtotal</Typography>
              <Typography fontWeight="bold" variant="h6">₹{calculateSubTotal()}</Typography>
            </Box>
          </Box>
        ) : (<Typography color="text.secondary" align="center" py={3}>No Items Added</Typography>)}
      </Paper>

      <Box display="flex" justifyContent="flex-end" mt={4} gap={2}>
        <Button variant="outlined" color="error" onClick={() => nav('/')} sx={{ textTransform: 'none', px: 4, py: 1, borderRadius: '8px', fontSize: '1rem' }}>Cancel</Button>
        <Button variant="contained" sx={{ bgcolor: '#4f46e5', textTransform: 'none', px: 4, py: 1, borderRadius: '8px', fontSize: '1rem', '&:hover': { bgcolor: '#4338ca' } }} onClick={createInvoice}>Create Invoice</Button>
      </Box>

      <Dialog open={custModal} onClose={() => setCustModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Select Customer</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth size="small" placeholder="Search Customer by Name..." value={custSearchQuery} onChange={(e) => setCustSearchQuery(e.target.value)} sx={{ mb: 3, bgcolor: "#f3f4f6", borderRadius: "4px", "& fieldset": { border: "none" } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment>, }} />
          <Grid container spacing={2}>
            {filteredCustomers.map(c => (
              <Grid item xs={12} sm={6} key={c.id}>
                <Card variant="outlined" sx={{ borderColor: selectedCustomer?.id === c.id ? '#4f46e5' : '#e5e7eb', bgcolor: selectedCustomer?.id === c.id ? '#eef2ff' : 'white' }}>
                  <CardActionArea onClick={() => handleSelectCustomer(c)} sx={{ p: 2 }}>
                    <Typography fontWeight="bold" textAlign="center" color={c.is_active === false ? "error" : "inherit"}>{c.name} {c.is_active === false && "(INACTIVE)"}</Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          {filteredCustomers.length === 0 && (<Typography color="text.secondary" align="center" mt={2}>No customer found.</Typography>)}
        </DialogContent>
      </Dialog>

      <Dialog open={itemModal} onClose={() => setItemModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Select Items</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth size="small" placeholder="Search Item by Name..." value={itemSearchQuery} onChange={(e) => setItemSearchQuery(e.target.value)} sx={{ mb: 3, bgcolor: "#f3f4f6", borderRadius: "4px", "& fieldset": { border: "none" } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#9ca3af" }} /></InputAdornment>, }} />
          <Grid container spacing={2}>
            {filteredItems.map(i => {
              const isSelected = selectedItems.find(p => p.item_id === i.id);
              return (
                <Grid item xs={12} sm={6} key={i.id}>
                  <Card variant="outlined" sx={{ borderColor: isSelected ? '#4f46e5' : '#e5e7eb', bgcolor: isSelected ? '#eef2ff' : 'white', transition: '0.2s' }}>
                    <CardActionArea onClick={() => toggleItem(i)} sx={{ p: 2 }}>
                      <Typography fontWeight="bold" textAlign="center" color={i.is_active === false ? "error" : "#111827"}>{i.name} {i.is_active === false && "(INACTIVE)"}</Typography>
                      <Typography variant="caption" display="block" textAlign="center" color="text.secondary">₹{i.selling_price}</Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {filteredItems.length === 0 && (<Typography color="text.secondary" align="center" mt={2}>No item found.</Typography>)}
        </DialogContent>
        <Box p={2} display="flex" justifyContent="flex-end">
          <Button variant="contained" sx={{ bgcolor: '#4f46e5', textTransform: 'none', borderRadius: '6px', px: 4, '&:hover': { bgcolor: '#1e1b4b' } }} onClick={() => setItemModal(false)}>Done</Button>
        </Box>
      </Dialog>
    </Box>
  );
}