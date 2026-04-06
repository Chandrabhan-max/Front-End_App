import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; 
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

/* Card */
const StatCard = ({ title, value, subtitle, accentColor }) => (
  <Card elevation={0} sx={{ borderRadius: 3, border: `2px solid ${accentColor}`, borderLeft: `8px solid ${accentColor}`, transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", height: "100%", "&:hover": { transform: "translateY(-4px)", boxShadow: `0 10px 20px ${accentColor}33` } }} >
    <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
      <Typography fontSize={13} fontWeight="700" color="text.secondary" textTransform="uppercase" mb={1}>{title}</Typography>
      <Typography variant="h4" fontWeight="800" color="#111827" mb={1}>{value}</Typography>
      <Typography fontSize={13} fontWeight="600" color={accentColor} mt="auto">{subtitle}</Typography>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const nav = useNavigate();
  const [search, setSearch] = useState("");
   const [showAll, setShowAll] = useState(false); 
  const [stats, setStats] = useState({ revenue: 0, todayInvoices: 0, monthInvoices: 0, activeCustomers: 0, activeItems: 0, invoices: [] });

  useEffect(() => { loadDashboardData(); }, []);

  /* Fetch */
  const loadDashboardData = async () => {
    try {
      const [custRes, itemRes, invRes] = await Promise.all([api.get("/customer"), api.get("/item"), api.get("/invoice")]);
      const customers = custRes.data?.data || [];
       const items = itemRes.data?.data || [];
      const invoices = invRes.data?.data || [];
      const todayStr = new Date().toDateString(); const currMonth = new Date().getMonth();
      let revenue = 0, todayCount = 0, monthCount = 0;
      invoices.forEach((inv) => {
        revenue += Number(inv.total_amount || 0); const date = new Date(inv.created_at);
        if (date.toDateString() === todayStr) todayCount++;
        if (date.getMonth() === currMonth) monthCount++;
      });
      setStats({ revenue, todayInvoices: todayCount, monthInvoices: monthCount, activeCustomers: customers.filter(c => c.is_active !== false).length, activeItems: items.filter(i => i.is_active !== false).length, invoices });
    } catch (err) { console.error("Dashboard data fetch failed:", err); }
  };

  /* Filter */
  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return stats.invoices.filter(inv => inv.invoice_id?.toLowerCase().includes(q) || inv.customer_name?.toLowerCase().includes(q) || inv.name?.toLowerCase().includes(q));
  }, [stats.invoices, search]);

  const displayInvoices = (showAll || search) ? filteredInvoices : filteredInvoices.slice(0, 10);

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} color="#111827" mb={{ xs: 3, md: 4 }} letterSpacing="-0.5px">Billing Overview</Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 5 }}>
        <StatCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} subtitle="Overall generated revenue" accentColor="#10b981" />
        <StatCard title="Invoices Today" value={stats.todayInvoices} subtitle="Generated today" accentColor="#3b82f6" />
        <StatCard title="This Month" value={stats.monthInvoices} subtitle="Monthly count" accentColor="#8b5cf6" />
        <StatCard title="Active Customers" value={stats.activeCustomers} subtitle="Currently active clients" accentColor="#f59e0b" />
        <StatCard title="Active Items" value={stats.activeItems} subtitle="Available items in stock" accentColor="#f43f5e" />
      </Box>

      <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid #e5e7eb" }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          
          {/* Search */}
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} mb={3} >
            <Typography variant="h6" fontWeight={800} color="#111827">Recent Transactions</Typography>
            <TextField size="small" placeholder="Search Invoices..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ bgcolor: "#f3f4f6", borderRadius: 2, width: { xs: '100%', sm: '280px' }, "& fieldset": { border: "none" } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "#6b7280" }} /></InputAdornment>, }} />
          </Box>

          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#4b5563' }}>Invoice ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4b5563' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4b5563' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4b5563' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4b5563' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4b5563', textAlign: 'right' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayInvoices.length > 0 ? (
                  displayInvoices.map((inv, i) => (
                    <TableRow key={inv.invoice_id || i} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: "#4f46e5" }}>{inv.invoice_id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#111827' }}>{inv.customer_name || inv.name || "Unknown"}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#111827' }}>₹{inv.total_amount}</TableCell>
                      <TableCell><Chip label={inv.gst_applied ? "GST Applied" : "No GST"} color={inv.gst_applied ? "success" : "default"} size="small" sx={{ fontWeight: 600, borderRadius: 1.5 }} /></TableCell>
                      <TableCell sx={{ color: '#4b5563', fontWeight: 500 }}>{new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell align="right"><Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => nav(`/invoice/${inv.invoice_id}`)} sx={{ color: '#4f46e5', borderColor: '#cbd5e1', textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>View</Button></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><Typography color="text.secondary" fontWeight={500}>No invoices found</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          {/* view all */}
          {!showAll && filteredInvoices.length > 10 && !search && (
            <Box display="flex" justifyContent="center" mt={3} pt={3} borderTop="1px solid #f1f5f9"><Button onClick={() => setShowAll(true)} sx={{ textTransform: "none", fontWeight: 700, color: "#4f46e5", bgcolor: "#eef2ff", px: 4, py: 1, borderRadius: 2 }}>View All Transactions</Button></Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}