
/**
 * Process image using Groq's Llama 3.2 Vision API
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 */
export const processImageWithGroq = async (imageBlob, apiKey) => {
    try {
        // 1. Resize and Convert to Base64
        // Large images can cause 400 Bad Request or 413 Payload Too Large
        const base64Image = await resizeAndConvertImage(imageBlob);

        // 2. Prepare Request
        const cleanKey = apiKey ? apiKey.trim() : '';
        if (!cleanKey) throw new Error("INVALID_KEY: API Key is empty");

        const today = new Date().toISOString().split('T')[0];
        const url = "https://api.groq.com/openai/v1/chat/completions";

        const payload = {
            model: "llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this image (receipt/subscription). Return ONLY a JSON object with these fields:
                - name (string): Service name (e.g. Netflix, Spotify)
                - cost (number): Total amount/price
                - currency (string): ISO code (USD, EUR, INR)
                - nextBillingDate (string): YYYY-MM-DD. Today is ${today}. Calculate relative dates (e.g. 'in 1 month') from today.
                - billingCycle (string): 'monthly' or 'yearly'
                
                If a value is missing, use null. Do not write markdown or explanations. Just the JSON object.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64Image // Now guaranteed to be optimized
                            }
                        }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        };

        // 3. Send Request
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // Try to read the error body
            const errorBody = await response.text();
            console.error("Groq Error Body:", errorBody);

            let errorMsg = `Groq Error (${response.status})`;
            try {
                const errorJson = JSON.parse(errorBody);
                if (errorJson.error && errorJson.error.message) {
                    errorMsg = `Groq: ${errorJson.error.message}`;
                }
            } catch (e) {
                // ignore JSON parse error
            }

            if (response.status === 401) throw new Error("INVALID_KEY: Invalid Groq API Key.");
            if (response.status === 429) throw new Error("Quota Exceeded (Groq). Try again later.");

            throw new Error(errorMsg);
        }

        const data = await response.json();

        // 4. Parse Response
        if (!data.choices || !data.choices[0].message.content) {
            throw new Error("Groq returned no content.");
        }

        const content = data.choices[0].message.content;
        console.log("Groq Raw Response:", content);

        const result = JSON.parse(content);

        // Normalize result
        return {
            name: result.name || '',
            cost: result.cost ? String(result.cost) : '',
            currency: result.currency || 'USD',
            date: result.nextBillingDate,
            billingCycle: result.billingCycle || 'monthly'
        };

    } catch (error) {
        console.error("Groq Processing Failed:", error);
        throw error;
    }
};

/**
 * Helper to resize image to max 1024px and convert to base64
 */
const resizeAndConvertImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 1024;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Get base64 with 0.8 quality jpeg
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(new Error("Failed to load image for resizing"));
        };
        reader.onerror = (err) => reject(new Error("Failed to read file"));
    });
};
