const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../lib/supabase");

// Store file in memory so we can pass the buffer to Supabase
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// POST /images/upload
router.post("/upload", upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;
    const bucket = "images"; // your Supabase Storage bucket name

    const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) return res.status(500).json({ error: error.message });

    // Get the public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

    res.status(201).json({ url: data.publicUrl, fileName });
});

// DELETE /images/:fileName
router.delete("/:fileName", async (req, res) => {
    const { error } = await supabase.storage
        .from("images")
        .remove([req.params.fileName]);
    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
});

module.exports = router;