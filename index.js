const { PrismaClient } = require("./generated/prisma");

const prisma = new PrismaClient();

const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
const jwt = require("jsonwebtoken");
const multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

// Middleware to parse JSON bodies
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Adjust this to your frontend's URL
    credentials: true, // Allow cookies to be sent
  })
);

// ----------------- Authentication route -----------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists and password matches
    if (user && user.password === password) {
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "10h",
        }
      );
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 10 * 60 * 60 * 1000, // 10 hours
      });
      res.status(200).json({
        message: "Login successful",
        user: {
          email: user.email,
          first_name: user.first_name,
          role: user.role,
        },
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ------------- User Routes -------------
// app.get("/user", async (req, res) => {
//   const user = await prisma.user.find({ where: { role:  } });
// });

app.post("/user", async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: req.body,
    });
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/user", async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.body.id },
      data: req.body,
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/user", async (req, res) => {
  try {
    const user = await prisma.user.delete({
      where: { id: req.body.id },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});
app.get("/user", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// -------------- Country Routes -------------
app.post("/country", upload.single("picture"), async (req, res) => {
  console.log(req.file);
  const bd = req.body;
  try {
    const country = await prisma.country.create({
      data: {
        name: bd.name,
        picture: req.file ? req.file.path : null, // Save the file path if uploaded
        code: bd.code,
      },
    });
    res.status(201).json(country);
  } catch (error) {
    console.error("Error creating country:", error);
    res.status(500).json({ error: "Failed to create country" });
  }
});

app.put("/country", upload.single("picture"), async (req, res) => {
  const bd = req.body;
  try {
    const country = await prisma.country.update({
      where: { id: bd.id },
      data: {
        name: bd.name,
        picture: req.file ? req.file.path : null, // Update the file path if uploaded
        code: bd.code,
      },
    });
    res.status(200).json(country);
  } catch (error) {
    console.error("Error updating country:", error);
    res.status(500).json({ error: "Failed to update country" });
  }
});

app.delete("/country", async (req, res) => {
  try {
    const country = await prisma.country.delete({
      where: { id: req.body.id },
    });
    res.status(200).json(country);
  } catch (error) {
    console.error("Error deleting country:", error);
    res.status(500).json({ error: "Failed to delete country" });
  }
});

app.get("/country", async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" }, // Sort countries by name in ascending order
    });
    console.log(countries);
    res.status(200).json(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({ error: "Failed to fetch countries" });
  }
});

// -------------- City Routes -------------
app.post("/city", async (req, res) => {
  let data = { ...req.body };
  data.countryId = data.country;
  delete data.country; // Remove country field to avoid conflict with foreign key
  try {
    const city = await prisma.city.create({
      include: { Country: true, Place: true }, // Include country details in the response
      data: data,
    });
    res.status(201).json(city);
  } catch (error) {
    console.error("Error creating city:", error);
    res.status(500).json({ error: "Failed to create city" });
  }
});

app.put("/city", async (req, res) => {
  try {
    let data = { ...req.body };
    data.countryId = data.country;
    delete data.country; // Remove country field to avoid conflict with foreign key
    const city = await prisma.city.update({
      include: { Country: true, Place: true }, // Include country details
      where: { id: req.body.id },
      data: data,
    });
    res.status(200).json(city);
  } catch (error) {
    console.error("Error updating city:", error);
    res.status(500).json({ error: "Failed to update city" });
  }
});
app.delete("/city", async (req, res) => {
  try {
    const city = await prisma.city.delete({
      where: { id: req.body.id },
    });
    res.status(200).json(city);
  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({ error: "Failed to delete city" });
  }
});

app.get("/city", async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      include: { Country: true, Place: true }, // Include country details
      orderBy: { name: "asc" }, // Sort cities by name in ascending order
    });
    res.status(200).json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
