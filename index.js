const express = require('express');
var cors = require('cors')
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
app.use(cors()) 
const port = 8080;

// Middleware
app.use(express.json());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    console.log(file)
    cb(null, file.originalname.split(".")[0] + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Load data from file
async function loadData() {
  const data = await fs.readFile('data.json', 'utf8');
  return JSON.parse(data);
}

// Save data to file
async function saveData(data) {
  await fs.writeFile('data.json', JSON.stringify(data, null, 2));
}

// GET /countries
app.get('/countries', async (req, res) => {
  try {
    const data = await loadData();
    const countries = data.countries.map(({ id, name }) => ({ id, name }));
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /country/{country-id}
app.get('/country/:id', async (req, res) => {
  
  try {
    const data = await loadData();
    const country = data.countries.find(c => c.id == parseInt(req.params.id));
   
    if (country) {
      res.json(country);
    } else {
      res.status(404).json({ error: 'Country not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /country
app.post('/country', upload.single('flag'), async (req, res) => {
  try {
    const data = await loadData();
    const newCountry = req.body;
    newCountry.id = Date.now(); // Generate a unique ID

    if (req.file) {
      newCountry.flag = `/images/${req.file.filename}`;
    }

    data.countries.push(newCountry);
    await saveData(data);

    res.status(201).json(newCountry);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

