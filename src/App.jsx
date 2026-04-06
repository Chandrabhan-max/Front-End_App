import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/layout'; 

import Dashboard from './pages/Dashboard';
import Master from './pages/Master';
import Customers from './pages/Customers';
import Items from './pages/Items';
import BulkUpload from './pages/BulkUpload';
import Billing from './pages/Billing';
import InvoiceDetails from './pages/InvoiceDetails';

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/master" element={<Master />} />
                    <Route path="/master/customers" element={<Customers />} />
                    <Route path="/master/items" element={<Items />} />
                    <Route path="/master/bulk-upload" element={<BulkUpload />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/invoice/:id" element={<InvoiceDetails />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;