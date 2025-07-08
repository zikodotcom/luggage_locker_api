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
    if (user && user.password === password && user.is_active) {
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
          last_name: user.last_name,
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
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "USER" }, // Fetch only users with role 'USER'
      orderBy: { first_name: "asc" }, // Sort users by first name in ascending order
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
app.put("/activate-user", async (req, res) => {
  try {
    const is_active = await prisma.user.findUnique({
      where: { id: req.body.id },
    });
    const user = await prisma.user.update({
      where: { id: req.body.id },
      data: { is_active: !is_active.is_active }, // Toggle the isActive status
    });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error activating/deactivating user:", error);
    res.status(500).json({ error: "Failed to update user status" });
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

// -------------- Place Routes -------------
app.post("/place", async (req, res) => {
  try {
    const place = await prisma.place.create({
      include: { city: true, lockers: true }, // Include city details in the response
      data: req.body,
    });
    res.status(201).json(place);
  } catch (error) {
    console.error("Error creating place:", error);
    res.status(500).json({ error: "Failed to create place" });
  }
});

app.put("/place", async (req, res) => {
  try {
    const place = await prisma.place.update({
      include: { city: true, lockers: true }, // Include city details in the response
      where: { id: req.body.id },
      data: req.body,
    });
    res.status(200).json(place);
  } catch (error) {
    console.error("Error updating place:", error);
    res.status(500).json({ error: "Failed to update place" });
  }
});
app.delete("/place", async (req, res) => {
  try {
    const place = await prisma.place.delete({
      where: { id: req.body.id },
    });
    res.status(200).json(place);
  } catch (error) {
    console.error("Error deleting place:", error);
    res.status(500).json({ error: "Failed to delete place" });
  }
});

app.get("/place", async (req, res) => {
  try {
    const places = await prisma.place.findMany({
      include: { city: true, lockers: true }, // Include city details in the response
      orderBy: { name: "asc" }, // Sort places by name in ascending order
    });
    res.status(200).json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});
app.get("/place/:id", async (req, res) => {
  try {
    const place = await prisma.place.findUnique({
      where: { id: req.params.id },
      include: { city: true, lockers: true }, // Include city details in the response
    });
    if (place) {
      res.status(200).json(place);
    } else {
      res.status(404).json({ error: "Place not found" });
    }
  } catch (error) {
    console.error("Error fetching place:", error);
    res.status(500).json({ error: "Failed to fetch place" });
  }
});
app.get("/counts", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const countryCount = await prisma.country.count();
    const cityCount = await prisma.city.count();
    const placeCount = await prisma.place.count();

    res.status(200).json({
      users: userCount,
      countries: countryCount,
      cities: cityCount,
      places: placeCount,
    });
  } catch (error) {
    console.error("Error fetching counts:", error);
    res.status(500).json({ error: "Failed to fetch counts" });
  }
});

// ------------------ Locker -------------
app.post("/locker", async (req, res) => {
  try {
    const locker = await prisma.locker.create({
      data: req.body,
    });
    res.status(201).json(locker);
  } catch (error) {
    console.error("Error creating locker:", error);
    res.status(500).json({ error: "Failed to create locker" });
  }
});
app.put("/locker", async (req, res) => {
  try {
    const locker = await prisma.locker.update({
      where: { id: req.body.id },
      data: req.body,
    });
    res.status(200).json(locker);
  } catch (error) {
    console.error("Error updating locker:", error);
    res.status(500).json({ error: "Failed to update locker" });
  }
});
app.delete("/locker", async (req, res) => {
  try {
    const locker = await prisma.locker.delete({
      where: { id: req.body.id },
    });
    res.status(200).json(locker);
  } catch (error) {
    console.error("Error deleting locker:", error);
    res.status(500).json({ error: "Failed to delete locker" });
  }
});
app.get("/locker", async (req, res) => {
  try {
    const lockers = await prisma.locker.findMany({
      orderBy: { name: "asc" }, // Sort lockers by name in ascending order
    });
    res.status(200).json(lockers);
  } catch (error) {
    console.error("Error fetching lockers:", error);
    res.status(500).json({ error: "Failed to fetch lockers" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
