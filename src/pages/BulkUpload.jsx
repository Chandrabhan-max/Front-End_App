import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Box, Typography, Button, Paper, IconButton, Divider, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function BulkInvoice() {
  const nav = useNavigate();
  const [tableData, setTableData] = useState([]);
   const [selectedRows, setSelectedRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [masterCustomers, setMasterCustomers] = useState([]);
    const [masterItems, setMasterItems] = useState([]);

  // Modal
  const [modal, setModal] = useState({ open: false, type: 'info', title: '', message: '' });
  const openModal = (type, title, message) => setModal({ open: true, type, title, message });
  const closeModal = () => setModal({ ...modal, open: false });

  
  useEffect(() => {
    const loadMaster = async () => {
      try {
        const [custRes, itemRes] = await Promise.all([api.get('/customer'), api.get('/item')]);
         setMasterCustomers(custRes.data?.data || []);
        setMasterItems(itemRes.data?.data || []);
      } catch (err) { console.error(err); }
    };
    loadMaster();
  }, []);

  //Format
  const handleDownloadFormat = () => {
    const csvContent = "data:text/csv;charset=utf-8,Customer_ID,Item_Code (comma separated),Quantity (comma separated)\nC101,\"IT01, IT02\",\"1, 2\"\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "Bulk_Invoice_Format.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result; const rows = text.split('\n');
      const invoiceGroups = {}; let uniqueId = 1;
      const parseCSVRow = (str) => {
        const arr = []; let quote = false; let col = '';
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '"') { quote = !quote; continue; }
          if (str[i] === ',' && !quote) { arr.push(col.trim()); col = ''; continue; }
          col += str[i];
        }
        arr.push(col.trim()); return arr;
      };
      for (let i = 1; i < rows.length; i++) {
        const currentRow = rows[i].trim();
        if (currentRow === '') continue;
        const cols = parseCSVRow(currentRow);
        const cId = cols[0]?.trim();
        const iCodes = (cols[1] || "").split(',').map(s => s.trim()).filter(Boolean);
        const qties = (cols[2] || "").split(',').map(s => s.trim()).filter(Boolean);
        const cust = masterCustomers.find(c => String(c.cust_id).trim().toUpperCase() === String(cId).toUpperCase());
        let custStatus = "Valid";
        if (!cust) custStatus = "Not Found"; else if (cust.is_active === false) custStatus = "Inactive";
        if (!invoiceGroups[cId]) {
          invoiceGroups[cId] = { id: uniqueId++, customer_id: cId, customer_db_id: cust ? cust.id : null, customer_name: cust ? cust.name : "Unknown", cust_status: custStatus, items: [], hasError: custStatus !== "Valid" };
        }
        iCodes.forEach((iCode, index) => {
          const qty = qties[index] || "1"; 
          const item = masterItems.find(it => String(it.item_code).trim().toUpperCase() === String(iCode).toUpperCase());
          let itemStatus = "Valid";
          if (!item) itemStatus = "Not Found"; else if (item.is_active === false) itemStatus = "Inactive";
          if (itemStatus !== "Valid") invoiceGroups[cId].hasError = true;
          invoiceGroups[cId].items.push({ item_code: iCode, item_name: item ? item.name : "Unknown", item_db_id: item ? item.id : null, item_status: itemStatus, quantity: qty });
        });
      }
      setTableData(Object.values(invoiceGroups)); setSelectedRows([]);
    };
    reader.readAsText(file); e.target.value = null;
  };

  // row select
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(tableData.map(row => row.id)); else setSelectedRows([]);
  };
  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rowId => rowId !== id)); else setSelectedRows([...selectedRows, id]);
  };

  // Generate invoice
  const handleGenerate = async (type) => {
    let rowsToProcess = type === 'selected' ? tableData.filter(row => selectedRows.includes(row.id)) : tableData;
    if (rowsToProcess.length === 0) { return openModal('warning', 'No Selection', 'Please select at least one invoice to generate.'); }
    const hasError = rowsToProcess.some(row => row.hasError);
    if (hasError) { return openModal('error', 'Validation Error', 'Some selected invoices have Inactive or Not Found items. Please fix the file or unselect them.'); }
    const payload = { preview: rowsToProcess.map(row => ({ customer_id: row.customer_db_id, items: row.items.map(it => ({ item_id: it.item_db_id, quantity: Number(it.quantity) })) })) };
    try {
      const response = await api.post('/bulk/create', payload);
      const results = response.data?.data || [];
      const successful = results.filter(r => r.status === 'created');
      const failed = results.filter(r => r.status === 'failed');
      if (failed.length > 0) {
        openModal('error', 'Partial Failure', `Successfully generated ${successful.length} invoices. Failed: ${failed.length}. Reason: ${failed[0].error}`);
      } else {
        openModal('success', 'Success!', `Successfully generated all ${successful.length} Invoices.`);
        setTableData([]); setSelectedRows([]); setFileName("");
      }
    } catch (err) {
      console.error(err); openModal('error', 'Server Error', 'Failed to communicate with the server.');
    }
  };

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

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={() => nav("/billing")} sx={{ color: "#111827", p: 0, mr: 1 }}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" fontWeight="bold" color="#111827" letterSpacing="-0.5px">BULK INVOICE GENERATION</Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e5e7eb', borderRadius: '12px', mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <InfoOutlinedIcon sx={{ color: '#4f46e5' }} />
              <Typography variant="h6" fontWeight="bold" color="#1e1b4b">Instructions for Bulk Upload</Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography variant="body2" color="text.secondary"><b>1. Download Template:</b> Get the latest CSV format by clicking the download button.</Typography>
              <Typography variant="body2" color="text.secondary"><b>2. Fill Data:</b> Enter the exact <b>Customer ID</b> and <b>Item Code</b> from your master list.</Typography>
              <Typography variant="body2" color="text.secondary"><b>3. Multiple Items:</b> To add multiple items for one customer, separate them with commas (e.g., Item Code: <code>IT01, IT02</code> | Quantity: <code>2, 5</code>).</Typography>
              <Typography variant="body2" color="text.secondary"><b>4. Upload & Verify:</b> Upload the saved file, verify the fetched names in the preview table, and click generate.</Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2} pt={1}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadFormat} sx={{ color: '#4f46e5', borderColor: '#4f46e5', textTransform: 'none', borderRadius: '8px', fontWeight: 'bold', height: '42px' }}>Download Format</Button>
            <Button variant="contained" component="label" startIcon={<CloudUploadIcon />} sx={{ bgcolor: '#2e2a5d', textTransform: 'none', borderRadius: '8px', fontWeight: 'bold', height: '42px', '&:hover': { bgcolor: '#1e1b4b' } }}>Upload CSV File<input type="file" hidden accept=".csv" onChange={handleFileUpload} /></Button>
          </Box>
        </Box>
      </Paper>

      {tableData.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <Box p={2} bgcolor="#f8f9fa" borderBottom="1px solid #e5e7eb" display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontWeight="bold" color="#111827">Preview: {fileName}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">{tableData.length} Invoices will be generated</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                <TableCell padding="checkbox"><Checkbox checked={selectedRows.length === tableData.length && tableData.length > 0} onChange={handleSelectAll} sx={{ color: '#4f46e5' }}/></TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#4b5563' }}>Customer Details</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#4b5563' }}>Items inside this Invoice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row) => {
                const isSelected = selectedRows.includes(row.id);
                return (
                  <TableRow key={row.id} selected={isSelected} sx={{ '&.Mui-selected': { bgcolor: '#eef2ff' }, verticalAlign: 'top' }}>
                    <TableCell padding="checkbox"><Checkbox checked={isSelected} onChange={() => handleSelectRow(row.id)} sx={{ color: '#4f46e5' }}/></TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold" color={row.cust_status !== "Valid" ? "error" : "inherit"}>{row.customer_name} {row.cust_status === "Inactive" && "(INACTIVE)"}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {row.customer_id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        {row.items.map((it, idx) => {
                          let chipColor = "primary";
                          if (it.item_status === "Not Found") chipColor = "error";
                          if (it.item_status === "Inactive") chipColor = "warning";
                          return (
                            <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: idx !== row.items.length - 1 ? 1 : 0, pb: idx !== row.items.length - 1 ? 1 : 0, borderBottom: idx !== row.items.length - 1 ? '1px dashed #d1d5db' : 'none' }}>
                              <Typography variant="body2" fontWeight="600" color={it.item_status !== "Valid" ? "error" : "#374151"}>• {it.item_name} <Typography component="span" variant="caption" color="text.secondary">({it.item_code})</Typography></Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                {it.item_status !== "Valid" && (<Chip label={it.item_status.toUpperCase()} color={chipColor} size="small" sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 'bold' }} />)}
                                <Typography variant="caption" fontWeight="bold" sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', px: 1, py: 0.5, borderRadius: '4px' }}>Qty: {it.quantity}</Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Box p={3} display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f8f9fa" borderTop="1px solid #e5e7eb">
            <Typography variant="body2" fontWeight="bold" color="#4f46e5">{selectedRows.length} Invoices selected</Typography>
            <Box display="flex" gap={2}>
              <Button variant="outlined" color="error" onClick={() => { setTableData([]); setFileName(""); setSelectedRows([]); }} sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Cancel / Clear</Button>
              <Button variant="outlined" onClick={() => handleGenerate('selected')} disabled={selectedRows.length === 0} sx={{ borderColor: '#4f46e5', color: '#4f46e5', textTransform: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Generate Selected</Button>
              <Button variant="contained" onClick={() => handleGenerate('all')} sx={{ bgcolor: '#4f46e5', textTransform: 'none', borderRadius: '8px', fontWeight: 'bold', '&:hover': { bgcolor: '#4338ca' } }}>Generate All Invoices</Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}