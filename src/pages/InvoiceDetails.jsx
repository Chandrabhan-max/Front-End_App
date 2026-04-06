import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Box, Typography, Paper, Divider, Button, Table, TableBody, TableCell, TableHead, TableRow, Grid } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function InvoiceDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { 
    fetchData(); 
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/invoice/${id}`); 
      setData(res.data.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  const handlePrint = () => { 
    window.print(); 
  };

  const handleDownload = () => {
    const input = document.getElementById('invoice-printable-area');
    html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_id}_Invoice.pdf`);
    });
  };

  if (!data) return <Typography p={4} variant="h6">Loading Invoice...</Typography>;

  const { invoice, items } = data;
  const subTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
  const hasGstApplied = invoice.gst_applied === true; 
  const gstAmount = hasGstApplied ? subTotal * 0.18 : 0;

  return (
    <Box>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #invoice-printable-area, #invoice-printable-area * { visibility: visible; }
            #invoice-printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          }
        `}
      </style>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} sx={{ '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => nav('/')} sx={{ color: '#4b5563', textTransform: 'none', fontWeight: 'bold' }}>
          Dashboard
        </Button>
        
        <Box display="flex" gap={2}>
          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />} 
            onClick={handlePrint} 
            sx={{ color: '#4f46e5', borderColor: '#4f46e5', textTransform: 'none', borderRadius: '8px', fontWeight: 'bold' }}
          >
            Print
          </Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={handleDownload} 
            sx={{ bgcolor: '#4f46e5', textTransform: 'none', borderRadius: '8px', fontWeight: 'bold', '&:hover': { bgcolor: '#4338ca' } }}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      <Box id="invoice-printable-area">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, border: '1px solid #e5e7eb', borderRadius: '12px', bgcolor: '#fff' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={5}>
            <Box>
              <Typography variant="h4" fontWeight="900" color="#2e2a5d" letterSpacing="-1px">INVOICE</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>LogiEdge Billing Systems</Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="h6" fontWeight="bold">ID: {invoice.invoice_id}</Typography>
              <Typography variant="body2" color="text.secondary">Date: {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid container mb={5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" letterSpacing="1px">BILLED TO</Typography>
              <Typography variant="h6" fontWeight="bold" mt={1}>{invoice.name}</Typography>
              <Typography variant="body2" mt={0.5} color="text.secondary">{invoice.address || 'Address not provided'}</Typography>
              <Box mt={2}>
                <Typography variant="body2"><b>PAN:</b> {invoice.pan || 'N/A'}</Typography>
                <Typography variant="body2"><b>GSTIN:</b> {invoice.gst ? invoice.gst : 'Not Registered'}</Typography>
              </Box>
            </Grid>
          </Grid>

          <Table size="medium" sx={{ mb: 4 }}>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Item Description</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((i, index) => (
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: '500' }}>{i.name}</TableCell>
                  <TableCell align="center">{i.quantity}</TableCell>
                  <TableCell align="right">₹{i.price}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{i.quantity * i.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ mb: 4 }} />

          <Box display="flex" justifyContent="flex-end">
            <Box width={{ xs: '100%', sm: '300px' }}>
              <Box display="flex" justifyContent="space-between" mb={1.5}>
                <Typography color="text.secondary">Subtotal:</Typography>
                <Typography fontWeight="bold">₹{subTotal}</Typography>
              </Box>
              
              {hasGstApplied && (
                <Box display="flex" justifyContent="space-between" mb={1.5} pb={1.5} borderBottom="1px solid #e5e7eb">
                  <Typography color="text.secondary">GST (18%):</Typography>
                  <Typography fontWeight="bold">₹{gstAmount}</Typography>
                </Box>
              )}
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} p={2} sx={{ bgcolor: '#f8f9fa', borderRadius: '8px' }}>
                <Typography variant="h6" fontWeight="bold">Grand Total:</Typography>
                <Typography variant="h5" fontWeight="900" color="#2e2a5d">₹{invoice.total_amount}</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}