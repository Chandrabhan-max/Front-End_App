import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden", bgcolor: "#f8fafc" }}>
      
      <Sidebar />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
            overflowY: "auto",
            WebkitOverflowScrolling: "touch" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;