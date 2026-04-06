import React from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Master = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Customer",
      desc: "Manage customer data",
      path: "/master/customers",
    },
    {
      title: "Items",
      desc: "Manage items",
      path: "/master/items",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={3}>
        Master
      </Typography>

      {/* Cards */}
      <Grid container spacing={3}>
        {cards.map((card, i) => (
          <Grid key={i} size={{ xs: 12, md: 4 }}>
            <Card
              onClick={() => navigate(card.path)}
              sx={{
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
                cursor: "pointer",
                transition: "0.3s",
                background: "#fff",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                  border: "1px solid #5b5bd6",
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={1}>
                  {card.title}
                </Typography>

                <Typography fontSize={13} color="text.secondary">
                  {card.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Master;