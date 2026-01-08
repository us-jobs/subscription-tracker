
/**
 * Process image using Google's Gemini Flash API
 * Expects a standard file/blob and a valid API Key
 */
export const processImageWithGemini = async (imageBlob, apiKey) => {
    try {
        // 1. Convert Blob to Base64
        const base64Image = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
            reader.readAsDataURL(imageBlob);
        });

        // 2. Prepare Request
        // Sanitize key to remove accidental whitespace/newlines
        const cleanKey = apiKey ;
        if (!cleanKey) throw new Error("INVALID_KEY: API Key is empty");

        const today = new Date().toISOString().split('T')[0];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;

        const payload = {
            contents: [{
                parts: [
                    { text: `Analyze this image. It is a receipt or subscription detail. Extract the following fields strictly as a JSON object: 'name' (string, service name), 'cost' (number, just the value), 'currency' (string, ISO code e.g. USD, EUR), 'nextBillingDate' (string, YYYY-MM-DD format. IMPORTANT: Today is ${today}. If the image says 'expires in X days', calculate the absolute date from today. If it says 'expires on 21 Mar', assume the year is 2026 or 2025 appropriately.), 'billingCycle' (string, 'monthly' or 'yearly'). If a field is not found, use null.` },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        };

        // 3. Send Request
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // Tag invalid key errors specifically for App.js to catch
            if (response.status === 400) throw new Error("INVALID_KEY: Invalid API Key. Please check settings.");
            if (response.status === 404) throw new Error("INVALID_KEY: Model not found or Key invalid (404).");
            if (response.status === 429) throw new Error("Quota Exceeded. Try again later.");
            if (response.status === 503) throw new Error("Gemini Service Overloaded.");
            throw new Error(`Gemini Error (${response.status}): ${response.statusText}`);
        }

        const data = await response.json();

        // 4. Parse Response
        if (!data.candidates || !data.candidates[0].content) {
            throw new Error("Gemini returned no content. Image might be unclear.");
        }

        const textResponse = data.candidates[0].content.parts[0].text;

        // Extract JSON from markdown code block if present
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || textResponse.match(/{[\s\S]*}/);

        if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            console.log("Gemini Raw JSON:", jsonStr);
            const result = JSON.parse(jsonStr);

            // Normalize result
            return {
                name: result.name || '',
                cost: result.cost ? String(result.cost) : '',
                currency: result.currency || 'USD',
                date: result.nextBillingDate,
                billingCycle: result.billingCycle || 'monthly'
            };
        }

        throw new Error("Failed to parse Gemini response");

    } catch (error) {
        console.error("Gemini Processing Failed:", error);
        throw error; // Caller handles fallback
    }
};
