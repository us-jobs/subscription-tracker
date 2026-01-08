
import Tesseract from 'tesseract.js';

// 1. Image Pre-processing (Binarization)
const preprocessImage = (imageBlob) => {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Grayscale & Binarize (Thresholding)
            // This turns the image purely Black & White, which helps OCR significantly
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const threshold = 160; // Tuning value: > 128 usually works, lighter seems better for receipts
                const value = avg > threshold ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = value;
            }

            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
        };

        img.src = URL.createObjectURL(imageBlob);
    });
};

/* 
  2. OCR & Parsing Logic
  Extracts: Name, Cost, Date
*/
export const processImage = async (imageBlob) => {
    const processedBlob = await preprocessImage(imageBlob);

    const result = await Tesseract.recognize(
        processedBlob,
        'eng',
        { logger: m => console.log(m) }
    );

    const text = result.data.text;
    console.log('Raw OCR Text:', text);

    return parseReceiptText(text);
};


const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let name = '', cost = '', date = '';

    // --- A. NAME EXTRACTION ---
    // Expanded list of common services
    const services = [
        'netflix', 'spotify', 'amazon', 'prime', 'disney', 'hulu', 'apple', 'youtube',
        'jio', 'airtel', 'hotstar', 'zee5', 'sonyliv', 'voot', 'adobe', 'microsoft',
        'chatgpt', 'openai', 'midjourney', 'ps plus', 'xbox', 'game pass', 'uber',
        'zomato', 'swiggy', 'gym', 'fitness', 'plan', 'membership', 'subscription'
    ];

    // Check for exact service match
    for (const line of lines) {
        const lower = line.toLowerCase();
        const foundService = services.find(s => lower.includes(s));
        if (foundService) {
            // If the line is short (e.g. "Netflix"), take it. If long, clean it.
            name = foundService.charAt(0).toUpperCase() + foundService.slice(1);

            // If line has "Premium" or similar modifiers, append them
            if (lower.includes('premium')) name += ' Premium';
            if (lower.includes('plus')) name += ' Plus';
            if (lower.includes('ultra')) name += ' Ultra';
            break; // Stop after first strong match
        }
    }
    // Fallback: If no known service, look for "Payment to XYZ"
    if (!name) {
        const paymentLine = lines.find(l => /paid to|payment to|sent to/i.test(l));
        if (paymentLine) {
            name = paymentLine.replace(/paid to|payment to|sent to/i, '').trim();
        }
    }


    // --- B. COST EXTRACTION ---
    // Look for currency symbols or "Total" lines
    for (const line of lines) {
        // 1. High confidence: "Total $14.99"
        if (/total|amount|paid/i.test(line)) {
            const match = line.match(/[0-9]+(\.[0-9]{2})?/); // Simple number match
            if (match) {
                cost = match[0];
                break;
            }
        }
    }
    // Fallback: Just look for any price-like pattern ($XX.XX)
    if (!cost) {
        for (const line of lines) {
            const priceMatch = line.match(/[$₹€£]\s?([0-9]+(\.[0-9]{2})?)/);
            if (priceMatch) {
                cost = priceMatch[1];
                break;
            }
        }
    }


    // --- C. DATE EXTRACTION ---

    // 1. RELATIVE DATE CHECK (e.g. "expires in 27 days")
    const relativeMatch = text.match(/in\s+(\d+)\s*(day|month)/i);
    if (relativeMatch) {
        const amount = parseInt(relativeMatch[1]);
        const unit = relativeMatch[2].toLowerCase();
        const future = new Date();

        if (unit.includes('day')) {
            future.setDate(future.getDate() + amount);
        } else if (unit.includes('month')) {
            future.setMonth(future.getMonth() + amount);
        }
        date = future.toISOString().split('T')[0];
    } else {
        // 2. STRICT: Absolute Date Parsing
        for (const line of lines) {
            // Check for formats like 21 Mar, 2026 or 21 March 2026
            const textDateMatch = line.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,]?\s+(\d{4})/i);
            if (textDateMatch) {
                const d = new Date(`${textDateMatch[1]} ${textDateMatch[2]} ${textDateMatch[3]}`);
                if (!isNaN(d.getTime())) {
                    date = d.toISOString().split('T')[0];
                    break;
                }
            }

            // Standard numeric dates (DD/MM/YYYY or YYYY-MM-DD)
            const dateMatch = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
            if (dateMatch) {
                let day, month, year;
                // Simple heuristic: If YYYY is last
                if (dateMatch[3].length === 4) {
                    year = parseInt(dateMatch[3]);
                    day = parseInt(dateMatch[1]);
                    month = parseInt(dateMatch[2]);

                    // Swap if US format (MM/DD) seems likely (e.g. month > 12)
                    if (month > 12) {
                        const temp = day; day = month; month = temp;
                    }
                } else {
                    // Assume DD-MM-YY
                    year = 2000 + parseInt(dateMatch[3]);
                    day = parseInt(dateMatch[1]);
                    month = parseInt(dateMatch[2]);
                }

                if (month > 0 && month <= 12 && day > 0 && day <= 31) {
                    date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    if (/due|next|new|expire|bill/i.test(line)) break;
                }
            }
        }
    }

    return { name, cost, date };
};
