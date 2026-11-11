const path = require("path");
const fs = require("fs").promises;
const express = require("express");
const app = express();

app.use(express.json());

// Handle invalid JSON requests
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            message: "Invalid JSON format. Please check your request."
        });
    }

    next(error);
});

// USER SIGNUP

app.post("/api/signup", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "data", "users.json");

        const data = await fs.readFile(filePath, "utf8");
        const users = JSON.parse(data);

        if (!Array.isArray(users)) {
            return res.status(500).json({
                message: "Invalid user data format."
            });
        }

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                message: "Invalid signup information."
            });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please complete all fields."
            });
        }

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid information provided."
            });
        }

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedName.length < 2) {
            return res.status(400).json({
                message: "Name must contain at least 2 characters."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                message: "Password must contain at least 4 characters."
            });
        }

        const existingUser = users.find(
            user => user.email === normalizedEmail
        );

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const newUser = {
            id: Date.now().toString(),
            name: normalizedName,
            email: normalizedEmail,
            password: password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        await fs.writeFile(
            filePath,
            JSON.stringify(users, null, 2),
            "utf8"
        );

        res.status(201).json({
            message: "Account created successfully.",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to create account."
        });
    }
});

// USER LOGIN

app.post("/api/login", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "data", "users.json");

        const data = await fs.readFile(filePath, "utf8");
        const users = JSON.parse(data);

        if (!Array.isArray(users)) {
            return res.status(500).json({
                message: "Invalid user data format."
            });
        }

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                message: "Invalid login information."
            });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter your email and password."
            });
        }

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid login information."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 4) {
            return res.status(400).json({
                message: "Password must contain at least 4 characters."
            });
        }
        const user = users.find(
            account =>
                account.email === normalizedEmail &&
                account.password === password
        );

        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password."
            });
        }

        res.status(200).json({
            message: "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to log in."
        });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/styles.css", (req, res) => {
    res.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/app.js", (req, res) => {
    res.sendFile(path.join(__dirname, "app.js"));
});


// GET PLANTS

app.get("/api/plants", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "data", "plants.json");

        const data = await fs.readFile(filePath, "utf8");
        const plants = JSON.parse(data);

        if (!Array.isArray(plants)) {
            return res.status(500).json({
                message: "Invalid plant data format."
            });
        }

        // Validate search and filter parameters
        const allowedParameters = [
            "search",
            "type",
            "health",
            "owner"
        ];

        for (const parameter of allowedParameters) {
            if (
                req.query[parameter] !== undefined &&
                typeof req.query[parameter] !== "string"
            ) {
                return res.status(400).json({
                    message: `Invalid ${parameter} parameter.`
                });
            }
        }

        // Get search and filter values from the URL
        const search = (req.query.search || "").trim().toLowerCase();
        const type = (req.query.type || "").trim().toLowerCase();
        const health = (req.query.health || "").trim().toLowerCase();
        const owner = (req.query.owner || "").trim().toLowerCase();

        // Find plants that match the conditions
        const filteredPlants = plants.filter(plant => {

            const searchableText = [
                plant.name,
                plant.species,
                plant.type,
                plant.notes
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(search);

            const matchesType =
                !type || type === "all" ||
                (plant.type || "").toLowerCase() === type;

            const matchesHealth =
                !health || health === "all" ||
                (plant.health || "").toLowerCase() === health;

            const matchesOwner =
                !owner ||
                (plant.owner || "").toLowerCase() === owner;

            return (
                matchesSearch &&
                matchesType &&
                matchesHealth &&
                matchesOwner
            );
        });

        res.status(200).json(filteredPlants);

    } catch (error) {
        console.error("Error retrieving plants:", error);

        res.status(500).json({
            message: "Unable to retrieve plants."
        });
    }
});


// ADD PLANT

app.post("/api/plants", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "data", "plants.json");

        const data = await fs.readFile(filePath, "utf8");
        const plants = JSON.parse(data);

        if (!Array.isArray(plants)) {
            return res.status(500).json({
                message: "Invalid plant data format."
            });
        }

        // Check if the request body is valid
        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                message: "Invalid plant information."
            });
        }

        const {
            owner,
            name,
            type,
            species,
            health,
            sunlight,
            lastWatered,
            notes
        } = req.body;

        // Check required fields
        if (!owner || !name || !type || !health || !sunlight) {
            return res.status(400).json({
                message: "Please complete all required plant fields."
            });
        }

        // Check field data types
        if (
            typeof owner !== "string" ||
            typeof name !== "string" ||
            typeof type !== "string" ||
            typeof health !== "string" ||
            typeof sunlight !== "string" ||
            (species !== undefined && typeof species !== "string") ||
            (lastWatered !== undefined && typeof lastWatered !== "string") ||
            (notes !== undefined && typeof notes !== "string")
        ) {
            return res.status(400).json({
                message: "Invalid plant information provided."
            });
        }

        // Remove unnecessary spaces
        const normalizedName = name.trim();
        const normalizedOwner = owner.trim().toLowerCase();

        // Validate plant name
        if (!normalizedName) {
            return res.status(400).json({
                message: "Plant name cannot be empty."
            });
        }

        // Validate plant type
        const allowedTypes = [
            "Indoor",
            "Outdoor",
            "Herb",
            "Flower",
            "Succulent",
            "Other"
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid plant type."
            });
        }

        const allowedHealth = [
            "Healthy",
            "Needs Water",
            "Needs Attention"
        ];

        if (!allowedHealth.includes(health)) {
            return res.status(400).json({
                message: "Invalid plant health status."
            });
        }

        const allowedSunlight = [
            "Indirect light",
            "Bright light",
            "Low light",
            "Direct sunlight",
            "Shade"
        ];

        if (!allowedSunlight.includes(sunlight)) {
            return res.status(400).json({
                message: "Invalid sunlight requirement."
            });
        }

        // Validate last watered date if provided
        if (lastWatered) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;

            if (
                !datePattern.test(lastWatered) ||
                Number.isNaN(Date.parse(lastWatered)) ||
                new Date(lastWatered).toISOString().slice(0, 10) !== lastWatered
            ) {
                return res.status(400).json({
                    message: "Please provide a valid watering date."
                });
            }
        }

        const newPlant = {
            owner: normalizedOwner,
            name: normalizedName,
            type: type,
            species: (species || "").trim(),
            health: health,
            healthHistory: [
                {
                    health: health,
                    date: new Date().toISOString()
                }
            ],
            sunlight: sunlight,
            lastWatered: lastWatered || "",
            notes: (notes || "").trim(),
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        plants.push(newPlant);

        await fs.writeFile(
            filePath,
            JSON.stringify(plants, null, 2),
            "utf8"
        );

        res.status(201).json({
            message: "Plant added successfully.",
            plant: newPlant
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to save the plant."
        });
    }
});



// EDIT PLANT

app.put("/api/plants/:id", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "data", "plants.json");

        const data = await fs.readFile(filePath, "utf8");
        const plants = JSON.parse(data);

        if (!Array.isArray(plants)) {
            return res.status(500).json({
                message: "Invalid plant data format."
            });
        }

        // Check if the request body is valid
        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                message: "Invalid plant information."
            });
        }

        const plantIndex = plants.findIndex(
            plant => plant.id === req.params.id
        );

        if (plantIndex === -1) {
            return res.status(404).json({
                message: "Plant not found."
            });
        }

        const existingPlant = plants[plantIndex];

        // Check the data types of submitted fields
        const stringFields = [
            "name",
            "type",
            "species",
            "health",
            "sunlight",
            "lastWatered",
            "notes"
        ];

        for (const field of stringFields) {
            if (
                req.body[field] !== undefined &&
                typeof req.body[field] !== "string"
            ) {
                return res.status(400).json({
                    message: `Invalid ${field} information.`
                });
            }
        }

        // Combine existing information with submitted changes
        const updatedData = {
            ...existingPlant,
            ...req.body
        };

        // Validate plant name
        if (!updatedData.name || !updatedData.name.trim()) {
            return res.status(400).json({
                message: "Plant name cannot be empty."
            });
        }

        // Validate plant type
        const allowedTypes = [
            "Indoor",
            "Outdoor",
            "Herb",
            "Flower",
            "Succulent",
            "Other"
        ];

        if (!allowedTypes.includes(updatedData.type)) {
            return res.status(400).json({
                message: "Invalid plant type."
            });
        }

        // Validate health status
        const allowedHealth = [
            "Healthy",
            "Needs Water",
            "Needs Attention"
        ];

        if (!allowedHealth.includes(updatedData.health)) {
            return res.status(400).json({
                message: "Invalid plant health status."
            });
        }

        // Validate sunlight
        const allowedSunlight = [
            "Indirect light",
            "Bright light",
            "Low light",
            "Direct sunlight",
            "Shade"
        ];

        if (!allowedSunlight.includes(updatedData.sunlight)) {
            return res.status(400).json({
                message: "Invalid sunlight requirement."
            });
        }

        // Validate last watered date if provided
        if (updatedData.lastWatered) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;

            if (
                !datePattern.test(updatedData.lastWatered) ||
                Number.isNaN(Date.parse(updatedData.lastWatered)) ||
                new Date(updatedData.lastWatered).toISOString().slice(0, 10) !== updatedData.lastWatered
            ) {
                return res.status(400).json({
                    message: "Please provide a valid watering date."
                });
            }
        }

        // Keep a record of the plant's health history
        const healthHistory = Array.isArray(existingPlant.healthHistory)
            ? [...existingPlant.healthHistory]
            : [
                {
                    health: existingPlant.health,
                    date: existingPlant.updatedAt || existingPlant.createdAt
                }
            ];

        // Add a new entry only when the health status changes
        if (updatedData.health !== existingPlant.health) {
            healthHistory.push({
                health: updatedData.health,
                date: new Date().toISOString()
            });
        }

        // Save the updated plant
        const updatedPlant = {
            ...updatedData,
            healthHistory: healthHistory,
            owner: existingPlant.owner,
            name: updatedData.name.trim(),
            species: (updatedData.species || "").trim(),
            notes: (updatedData.notes || "").trim(),
            id: existingPlant.id,
            createdAt: existingPlant.createdAt,
            updatedAt: new Date().toISOString()
        };

        plants[plantIndex] = updatedPlant;

        await fs.writeFile(
            filePath,
            JSON.stringify(plants, null, 2),
            "utf8"
        );

        res.status(200).json({
            message: "Plant updated successfully.",
            plant: updatedPlant
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to update the plant."
        });
    }
});

// DELETE PLANT

app.delete("/api/plants/:id", async (req, res) => {
    try {
        const filePath = path.join(__dirname, "data", "plants.json");

        const data = await fs.readFile(filePath, "utf8");
        const plants = JSON.parse(data);

        if (!Array.isArray(plants)) {
            return res.status(500).json({
                message: "Invalid plant data format."
            });
        }

        // Check if the plant ID was provided
        if (!req.params.id || !req.params.id.trim()) {
            return res.status(400).json({
                message: "Plant ID is required."
            });
        }

        // Find the plant
        const plantIndex = plants.findIndex(
            plant => plant.id === req.params.id
        );

        if (plantIndex === -1) {
            return res.status(404).json({
                message: "Plant not found."
            });
        }

        // Remove the plant
        plants.splice(plantIndex, 1);

        // Save the updated plant records
        await fs.writeFile(
            filePath,
            JSON.stringify(plants, null, 2),
            "utf8"
        );

        res.status(200).json({
            message: "Plant deleted successfully."
        });

    } catch (error) {
        console.error("Error deleting plant:", error);

        res.status(500).json({
            message: "Unable to delete the plant."
        });
    }
});


app.listen(3000, () => {
    console.log("Planti backend is running on port 3000");
});