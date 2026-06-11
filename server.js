const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// folder "public" sebagai halaman static (Tempat index.html berada)
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Database SQLite
const db = new sqlite3.Database('./database_ppdb.db', (err) => {
    if (err) {
        console.error('Gagal terhubung ke database SQLite:', err.message);
    } else {
        console.log('Berhasil terhubung ke database SQLite.');
        // Buat tabel calon_siswa jika belum ada
        db.run(`CREATE TABLE IF NOT EXISTS calon_siswa (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            email TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            asal_sekolah TEXT NOT NULL,
            jalur TEXT NOT NULL,
            gelombang TEXT NOT NULL,
            tanggal_daftar DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Endpoint API POST: Menerima data pendaftaran
app.post('/api/daftar', (req, res) => {
    const { nama, email, whatsapp, asal_sekolah, jalur, gelombang } = req.body;

    // Validasi basic backend
    if (!nama || !email || !whatsapp || !asal_sekolah || !jalur || !gelombang) {
        return res.status(400).json({ message: "Semua field harus diisi!" });
    }

    const query = `INSERT INTO calon_siswa (nama, email, whatsapp, asal_sekolah, jalur, gelombang) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [nama, email, whatsapp, asal_sekolah, jalur, gelombang];

    db.run(query, values, function(err) {
        if (err) {
            console.error('Database Error:', err.message);
            return res.status(500).json({ message: "Terjadi kesalahan pada server database." });
        }
        console.log(`Pendaftar baru masuk: ${nama} (ID: ${this.lastID})`);
        res.status(201).json({ 
            message: "Pendaftaran berhasil disimpan",
            id: this.lastID 
        });
    });
});

// Jalur untuk melihat dan mencetak data pendaftar
app.get('/admin/cetak', (req, res) => {
    db.all("SELECT * FROM calon_siswa ORDER BY tanggal_daftar DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).send("Gagal mengambil data database.");
        }
        
        // Membuat tampilan tabel HTML sederhana untuk dicetak
        let html = `
            <html>
            <head>
                <title>Cetak Data Pendaftar PPDB</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .btn-cetak { padding: 10px 20px; background: blue; color: white; border: none; cursor: pointer; }
                    @media print { .btn-cetak { display: none; } } /* Sembunyikan tombol saat dicetak */
                </style>
            </head>
            <body>
                <h2>DAFTAR CALON SISWA BARU - SMA AN NAHL</h2>
                <button class="btn-cetak" onclick="window.print()">Cetak Halaman Ini</button>
                <table>
                    <tr>
                        <th>No</th><th>Nama</th><th>Email</th><th>WhatsApp</th><th>Asal Sekolah</th><th>Jalur</th><th>Tanggal Daftar</th>
                    </tr>
        `;
        
        rows.forEach((siswa, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${siswa.nama}</td>
                    <td>${siswa.email}</td>
                    <td>${siswa.whatsapp}</td>
                    <td>${siswa.asal_school || siswa.asal_sekolah}</td>
                    <td>${siswa.jalur}</td>
                    <td>${siswa.tanggal_daftar}</td>
                </tr>
            `;
        });
        
        html += `</table></body></html>`;
        res.send(html);
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 Server PPDB Berjalan di http://localhost:${PORT}`);
    console.log(`===========================================`);
});