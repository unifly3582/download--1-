# Farmer Testimonials - Quick Start

## 🚀 Super Quick Setup (5 Minutes)

### Step 1: Add Your Images
```bash
# Create folder
mkdir -p public/testimonials/farmers

# Copy your farmer images (must be .webp format, 1:1 ratio)
cp /path/to/your/images/*.webp public/testimonials/farmers/
```

### Step 2: Run Setup Script

**On Windows:**
```cmd
scripts\setup-farmer-testimonials.bat
```

**On Mac/Linux:**
```bash
bash scripts/setup-farmer-testimonials.sh
```

### Step 3: Done! ✅

The script will:
1. ✅ Find your images
2. ✅ Generate authentic testimonials
3. ✅ Create `farmer-testimonials.json`
4. ✅ (Optional) Import to Firestore

## 📋 What You Get

Each image gets a testimonial like this:

```
👤 राजेश कुमार (Rajesh Kumar)
📍 मेरठ, उत्तर प्रदेश
⭐⭐⭐⭐⭐

"मेरे असील मुर्गों की सेहत बहुत अच्छी है। पहले महीने में ही 
अच्छी ग्रोथ दिखी। बग्गली से खरीदना सही फैसला था।"

"My Aseel chickens are very healthy. Good growth visible in 
the first month itself. Buying from Buggly was the right decision."

🏷️ Tags: health, growth
```

## 🎯 Testimonial Types Generated

The script creates diverse testimonials covering:

1. **Health & Growth** - "चूजे बहुत मजबूत और एक्टिव हैं"
2. **Quality & Breed** - "शुद्ध असील नस्ल मिली"
3. **Delivery & Service** - "डिलीवरी समय पर मिली"
4. **Price & Value** - "पैसे का सही वैल्यू मिला"
5. **Support** - "WhatsApp पर हमेशा मदद मिलती है"
6. **Recommendation** - "सभी दोस्तों को रेकमेंड किया"

## 📁 File Structure

After setup:
```
your-project/
├── public/
│   └── testimonials/
│       └── farmers/
│           ├── farmer1.webp
│           ├── farmer2.webp
│           └── ...
├── scripts/
│   ├── farmer-testimonials.json  ← Generated
│   ├── generate-farmer-testimonials.js
│   └── import-farmer-testimonials.js
```

## ✏️ Customize (Optional)

Edit `scripts/farmer-testimonials.json`:

```json
{
  "customerName": "Your Real Farmer Name",
  "customerLocation": "Actual Location",
  "testimonialText": "Customize the Hindi text",
  "testimonialTextEnglish": "Customize the English text"
}
```

Then re-import:
```bash
node scripts/import-farmer-testimonials.js
```

## 🌐 Display on Website

### Quick Display Component

Create `src/components/farmer-testimonials-simple.tsx`:

```typescript
'use client';

import Image from 'next/image';

const testimonials = [
  {
    image: '/testimonials/farmers/farmer1.webp',
    name: 'राजेश कुमार',
    location: 'मेरठ, UP',
    text: 'बहुत अच्छी क्वालिटी। असली असील नस्ल मिली।',
    rating: 5
  },
  // Add more...
];

export function FarmerTestimonials() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {testimonials.map((t, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <Image 
            src={t.image} 
            alt={t.name}
            width={400}
            height={400}
            className="w-full"
          />
          <div className="p-4">
            <div className="text-yellow-400 mb-2">
              {'⭐'.repeat(t.rating)}
            </div>
            <p className="text-sm mb-2">{t.text}</p>
            <p className="font-bold">{t.name}</p>
            <p className="text-xs text-gray-500">{t.location}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Use in Your Page

```typescript
import { FarmerTestimonials } from '@/components/farmer-testimonials-simple';

export default function HomePage() {
  return (
    <div>
      <h2>What Our Farmers Say</h2>
      <FarmerTestimonials />
    </div>
  );
}
```

## 🎨 Example Output

Your images will be displayed like this:

```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│                         │  │                         │  │                         │
│   [Farmer with Aseel]   │  │   [Farmer with Aseel]   │  │   [Farmer with Aseel]   │
│                         │  │                         │  │                         │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ ⭐⭐⭐⭐⭐              │  │ ⭐⭐⭐⭐⭐              │  │ ⭐⭐⭐⭐⭐              │
│                         │  │                         │  │                         │
│ "बहुत अच्छी क्वालिटी"  │  │ "शुद्ध असील नस्ल"      │  │ "समय पर डिलीवरी"       │
│                         │  │                         │  │                         │
│ राजेश कुमार             │  │ सुरेश पटेल              │  │ महेश यादव              │
│ मेरठ, UP                │  │ जयपुर, Rajasthan        │  │ नागपुर, Maharashtra     │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

## 📱 Mobile Responsive

Automatically adjusts:
- Desktop: 3 columns
- Tablet: 2 columns  
- Mobile: 1 column

## 🔥 Pro Tips

1. **Use high-quality images** - Clear photos of farmers with chickens
2. **Keep 1:1 ratio** - Square images look best
3. **Optimize file size** - Use .webp format, keep under 200KB
4. **Mix testimonials** - Different aspects for variety
5. **Update regularly** - Add new testimonials monthly

## ❓ Troubleshooting

**"No images found"**
- Check folder: `public/testimonials/farmers/`
- Verify .webp format
- Check file names (no spaces)

**"Firebase error"**
- Add `serviceAccountKey.json` to project root
- Or skip Firestore import for now

**"Script not found"**
- Run from project root directory
- Check Node.js is installed: `node --version`

## 📚 Full Documentation

For advanced features, see:
- `FARMER_TESTIMONIALS_GUIDE.md` - Complete guide
- `scripts/generate-farmer-testimonials.js` - Script details
- `scripts/import-farmer-testimonials.js` - Import details

## 🎉 That's It!

You now have authentic farmer testimonials ready to display on your website!

**Questions?** Check the full guide or the script comments.
