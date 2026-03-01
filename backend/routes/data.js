const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

// GET all items
router.get("/", async (req, res) => {
    const { data, error } = await supabase.from("items").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET single item
router.get("/:id", async (req, res) => {
    const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", req.params.id)
        .single();
    if (error) return res.status(404).json({ error: error.message });
    res.json(data);
});

// POST create item
router.post("/", async (req, res) => {
    const { data, error } = await supabase
        .from("items")
        .insert(req.body)
        .select()
        .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// PATCH update item
router.patch("/:id", async (req, res) => {
    const { data, error } = await supabase
        .from("items")
        .update(req.body)
        .eq("id", req.params.id)
        .select()
        .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// DELETE item
router.delete("/:id", async (req, res) => {
    const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", req.params.id);
    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
});

module.exports = router;