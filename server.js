import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ---------- MongoDB Connection ----------
const MONGO_URI = process.env.MONGO_URL;
if (!MONGO_URI) {
  console.error("MONGO_URL not set in environment variables");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// ---------- Schema ----------
const shinySchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: String,
  ability: String,
  notes: String
});

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  shinies: [shinySchema]
});

const Player = mongoose.model("Player", playerSchema);

// ---------- API Routes ----------

// Get all players
app.get("/players", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a shiny
app.post("/add", async (req, res) => {
  const { player, shiny } = req.body;
  if (!player || !shiny || !shiny.name) {
    return res.status(400).json({ error: "Missing player or shiny name" });
  }

  try {
    let doc = await Player.findOne({ name: player });
    if (!doc) doc = new Player({ name: player, shinies: [] });

    // Prevent duplicate
    if (doc.shinies.some(s => s.name.toLowerCase() === shiny.name.toLowerCase())) {
      return res.status(400).json({ error: "Duplicate shiny" });
    }

    doc.shinies.push(shiny);
    await doc.save();
    res.json({ success: true, player: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a shiny
app.post("/update", async (req, res) => {
  const { player, index, field, value } = req.body;
  if (!player || index == null || !field) return res.status(400).json({ error: "Missing data" });

  try {
    const doc = await Player.findOne({ name: player });
    if (!doc || !doc.shinies[index]) return res.status(404).json({ error: "Shiny not found" });

    doc.shinies[index][field] = value;
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a shiny
app.post("/remove", async (req, res) => {
  const { player, index } = req.body;
  if (!player || index == null) return res.status(400).json({ error: "Missing data" });

  try {
    const doc = await Player.findOne({ name: player });
    if (!doc || !doc.shinies[index]) return res.status(404).json({ error: "Shiny not found" });

    doc.shinies.splice(index, 1);
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
