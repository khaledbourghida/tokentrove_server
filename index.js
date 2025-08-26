import express from "express";
import dotenv from "dotenv";
import admin from "firebase-admin";
// import referralRoutes from "./routes/referral.js";
import claimRoutes from "./routes/claim.js";

dotenv.config();

// Initialize Firebase Admin with your service account
// admin.initializeApp({
//   credential: admin.credential.cert("./serviceAccountKey.json"),
// });

const app = express();
app.use(express.json());

// Routes
// app.use(referralRoutes);
app.use(claimRoutes)

// Health check
app.get("/", (req, res) => res.send("TokenTrove API running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
