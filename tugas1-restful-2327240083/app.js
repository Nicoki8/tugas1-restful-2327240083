const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();
app.use(express.json());

// -----------------------------------------------------------------------------
// 1. KONEKSI KE MONGODB MEMORY SERVER (AUTO-START)
// -----------------------------------------------------------------------------
const startMemoryServer = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log("Terhubung ke MongoDB Memory Server");
    await seedDatabase();
  } catch (err) {
    console.error("Koneksi MongoDB gagal:", err);
  }
};

// -----------------------------------------------------------------------------
// 2. SCHEMA & MODEL (EMBEDDING & REFERENCING)
// -----------------------------------------------------------------------------
const StafSchema = new mongoose.Schema({
  namaStaf: { type: String, required: true },
  spesialisasi: { type: String, required: true }
});

const SalonServiceSchema = new mongoose.Schema(
  {
    namaLayanan: { type: String, required: true },
    kategori: { type: String, required: true },
    durasiMenit: { type: Number, required: true },
    harga: { type: Number, required: true },
    tersedia: { type: Boolean, default: true },
    stafTersedia: [StafSchema] // <-- EMBEDDING
  },
  { timestamps: true }
);

const TransaksiPelangganSchema = new mongoose.Schema(
  {
    namaPelanggan: { type: String, required: true },
    tanggal: { type: Date, default: Date.now },
    layananId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalonService", // <-- REFERENCING
      required: true
    }
  },
  { timestamps: true }
);

const SalonService = mongoose.model("SalonService", SalonServiceSchema);
const TransaksiPelanggan = mongoose.model("TransaksiPelanggan", TransaksiPelangganSchema);

// Seeding Data Awal
const seedDatabase = async () => {
  const count = await SalonService.countDocuments();
  if (count === 0) {
    await SalonService.insertMany([
      {
        namaLayanan: "Creambath",
        kategori: "rambut",
        durasiMenit: 60,
        harga: 85000,
        tersedia: true,
        stafTersedia: [{ namaStaf: "Siti", spesialisasi: "Hair Specialist" }]
      },
      {
        namaLayanan: "Facial Mask",
        kategori: "wajah",
        durasiMenit: 45,
        harga: 100000,
        tersedia: true,
        stafTersedia: [{ namaStaf: "Budi", spesialisasi: "Skincare Specialist" }]
      },
      {
        namaLayanan: "Manicure",
        kategori: "kuku",
        durasiMenit: 30,
        harga: 50000,
        tersedia: false,
        stafTersedia: [{ namaStaf: "Rina", spesialisasi: "Nail Artist" }]
      }
    ]);
    console.log("Data awal berhasil di-seed ke MongoDB");
  }
};

// -----------------------------------------------------------------------------
// 3. ENDPOINT API
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    nama: "Nico Ramadhan Wijaya",
    nim: "2327240083",
    topik: "Salon",
    nomorTopik: 4,
    database: "MongoDB Memory Server",
    endpoints: [
      "GET /salon-services",
      "GET /salon-services/:id",
      "POST /salon-services",
      "PUT /salon-services/:id",
      "DELETE /salon-services/:id",
      "POST /transaksi",
      "GET /transaksi"
    ]
  });
});

// GET /salon-services (Filtering, Pagination, Sorting, Projection)
app.get("/salon-services", async (req, res) => {
  try {
    const { kategori, minHarga, maxHarga, page = 1, limit = 5, sortBy = "createdAt", order = "desc", fields } = req.query;

    const query = {};
    if (kategori) query.kategori = { $regex: kategori, $options: "i" };
    if (minHarga || maxHarga) {
      query.harga = {};
      if (minHarga) query.harga.$gte = Number(minHarga);
      if (maxHarga) query.harga.$lte = Number(maxHarga);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = order === "asc" ? 1 : -1;

    let projection = "";
    if (fields) projection = fields.split(",").join(" ");

    const data = await SalonService.find(query).select(projection).sort(sortOptions).skip(skip).limit(limitNum);
    const totalData = await SalonService.countDocuments(query);

    res.json({
      status: "success",
      page: pageNum,
      limit: limitNum,
      totalData,
      totalPages: Math.ceil(totalData / limitNum),
      data
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message, data: null });
  }
});

// GET /salon-services/:id
app.get("/salon-services/:id", async (req, res) => {
  try {
    const service = await SalonService.findById(req.params.id);
    if (!service) return res.status(404).json({ status: "error", message: "Data tidak ditemukan", data: null });
    res.json(service);
  } catch (error) {
    res.status(400).json({ status: "error", message: "ID tidak valid", data: null });
  }
});

// POST /salon-services (Embedding)
app.post("/salon-services", async (req, res) => {
  try {
    const { namaLayanan, kategori, durasiMenit, harga, tersedia, stafTersedia } = req.body;
    if (!namaLayanan || !kategori || durasiMenit === undefined || harga === undefined || tersedia === undefined) {
      return res.status(400).json({ status: "error", message: "Semua field wajib diisi", data: null });
    }
    const newService = await SalonService.create({ namaLayanan, kategori, durasiMenit, harga, tersedia, stafTersedia: stafTersedia || [] });
    res.status(201).json({ status: "success", message: "Data berhasil ditambahkan", data: newService });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message, data: null });
  }
});

// PUT /salon-services/:id
app.put("/salon-services/:id", async (req, res) => {
  try {
    const updatedService = await SalonService.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedService) return res.status(404).json({ status: "error", message: "Data tidak ditemukan", data: null });
    res.status(200).json({ status: "success", message: "Data berhasil diubah", data: updatedService });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message, data: null });
  }
});

// DELETE /salon-services/:id
app.delete("/salon-services/:id", async (req, res) => {
  try {
    const deletedService = await SalonService.findByIdAndDelete(req.params.id);
    if (!deletedService) return res.status(404).json({ status: "error", message: "Data tidak ditemukan", data: null });
    res.status(200).json({ status: "success", message: "Data berhasil dihapus", data: null });
  } catch (error) {
    res.status(400).json({ status: "error", message: "ID tidak valid", data: null });
  }
});

// POST /transaksi (Referencing)
app.post("/transaksi", async (req, res) => {
  try {
    const { namaPelanggan, layananId } = req.body;
    const transaksi = await TransaksiPelanggan.create({ namaPelanggan, layananId });
    res.status(201).json({ status: "success", data: transaksi });
  } catch (error) {
    res.status(400).json({ status: "error", message: error.message, data: null });
  }
});

// GET /transaksi (Populate Referencing)
app.get("/transaksi", async (req, res) => {
  try {
    const transaksi = await TransaksiPelanggan.find().populate("layananId", "namaLayanan harga kategori");
    res.json({ status: "success", data: transaksi });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message, data: null });
  }
});

app.use((req, res) => res.status(404).json({ status: "error", message: "Endpoint tidak ditemukan", data: null }));

// -----------------------------------------------------------------------------
// 4. JALANKAN SERVER & MONGODB MEMORY SERVER
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
startMemoryServer().then(() => {
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
});

module.exports = app;