# Farmer Testimonial Images

## 📸 Add Your Images Here

Place your farmer images in this folder.

### Requirements:
- ✅ Format: `.webp`
- ✅ Aspect Ratio: 1:1 (square)
- ✅ Size: Optimized for web (< 200KB recommended)
- ✅ Content: Farmers with their Aseel chickens

### Example File Names:
```
farmer1.webp
farmer2.webp
farmer3.webp
farmer-rajesh-kumar.webp
farmer-merath-up.webp
```

### After Adding Images:

Run the generation script:

**Windows:**
```cmd
scripts\setup-farmer-testimonials.bat
```

**Mac/Linux:**
```bash
bash scripts/setup-farmer-testimonials.sh
```

Or manually:
```bash
node scripts/generate-farmer-testimonials.js
```

### What Happens Next:

1. Script scans this folder for .webp images
2. Generates authentic testimonials for each image
3. Creates `scripts/farmer-testimonials.json`
4. Ready to import to Firestore

### Tips:

- Use clear, high-quality photos
- Show farmers with their chickens
- Natural lighting works best
- Authentic farm settings
- Happy, satisfied farmers

---

**Need help?** Check `FARMER_TESTIMONIALS_QUICKSTART.md` in the project root.
