import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import sharp from "sharp";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface GiftRecommendation {
  name: string;
  description: string;
  price: number;
  match_reason: string;
  amazon_link?: string;
  etsy_link?: string;
}

async function compressImage(buffer: Buffer): Promise<string> {
  try {
    if (!buffer || buffer.length === 0) {
      console.error("[Image Compression] Empty buffer received");
      return "";
    }

    const compressedImageBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 40,
        progressive: true,
        optimizeScans: true,
        chromaSubsampling: "4:2:0",
      })
      .toBuffer();

    const base64 = compressedImageBuffer.toString("base64");
    const truncatedBase64 = base64.slice(0, 50000);

    return truncatedBase64;
  } catch (error) {
    console.error("[Image Compression] Error:", error);
    return "";
  }
}

async function analyzeImage(base64Image: string): Promise<string> {
  try {
    console.log("[Image Analysis] Starting image analysis...");

    const completion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing Instagram profiles. Provide a detailed analysis of the person's lifestyle, activities, and preferences to help recommend thoughtful gifts.",
        },
        {
          role: "user",
          content: `Analyze this Instagram profile grid and describe what you observe:
1. What activities and hobbies are shown?
2. What locations or environments appear?
3. What lifestyle elements are visible?
4. What appears to be their main interests?
5. What themes or patterns do you notice?

Provide a detailed analysis that could help recommend personalized gifts.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const analysis = completion.choices[0]?.message?.content || "";
    console.log("[Image Analysis] Full analysis:", analysis);
    return analysis;
  } catch (error) {
    console.error("[Image Analysis] Error:", error);
    return "";
  }
}

async function generateGiftRecommendations(
  age: number,
  budget: number,
  profileAnalysis: string
): Promise<GiftRecommendation[]> {
  try {
    const response = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content:
            "You are a creative gift recommendation expert who specializes in unique, personalized gifts. Avoid common or generic suggestions like gift cards or passes. Instead, focus on specific items that match the person's exact interests and activities. Each recommendation should be distinct and tailored to different aspects of their lifestyle.",
        },
        {
          role: "user",
          content: `Based on this Instagram profile analysis:
${profileAnalysis}

Generate 3 UNIQUE and SPECIFIC gift recommendations for a ${age} year old with a budget of $${budget}. 
Each gift should be different from the others and relate to different interests/activities shown in their profile.
Avoid generic items like passes, gift cards, or common accessories.

Format as JSON array: [{"name": "Gift Name", "description": "Description", "price": number, "match_reason": "Reason"}].
Keep descriptions concise and avoid apostrophes.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 800,
      top_p: 0.95,
    });

    let recommendationsText =
      response.choices[0].message.content?.trim() || "[]";

    // Extract JSON if it's wrapped in other text
    const jsonMatch = recommendationsText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      recommendationsText = jsonMatch[0];
    }

    // Clean up the JSON string
    recommendationsText = recommendationsText
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/'/g, "'")
      .replace(/\n/g, " ")
      .replace(/,\s*}/g, "}")
      .replace(/\s+/g, " ")
      .replace(/\s*:\s*/g, ":")
      .replace(/\s*,\s*/g, ",")
      .replace(/it['']s/gi, "it is")
      .replace(/['']s\s/g, "s ")
      .replace(/['']re\s/g, " are ")
      .replace(/['']t\s/g, "t ");

    const recommendations = JSON.parse(recommendationsText);

    return recommendations.map((rec: any) => ({
      name: rec.name || "Gift suggestion",
      description: rec.description || "",
      price: parseFloat(String(rec.price || budget).replace(/[$,]/g, "")),
      match_reason: rec.match_reason || "",
      amazon_link: `https://www.amazon.com/s?k=${encodeURIComponent(
        rec.name || ""
      )}`,
      etsy_link: `https://www.etsy.com/search?q=${encodeURIComponent(
        rec.name || ""
      )}`,
    }));
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // Return fallback recommendations
    return [
      {
        name: "No recommendations available",
        description: "No personalized gift recommendations available.",
        price: budget,
        match_reason: "No profile analysis available.",
        amazon_link: `https://www.amazon.com/s?k=${encodeURIComponent("gift")}`,
        etsy_link: `https://www.etsy.com/search?q=${encodeURIComponent(
          "gift"
        )}`,
      },
    ];
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const age = Number(formData.get("age"));
    const budget = Number(formData.get("budget"));
    const imageFile = formData.get("instagram-grid") as File | null;

    console.log("\n[API] Starting new request:", {
      age,
      budget,
      hasImage: !!imageFile,
    });

    if (!age || !budget) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let profileAnalysis = "";
    if (imageFile) {
      console.log("\n[API] Processing Instagram profile image...");
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = await compressImage(buffer);

      console.log("\n[API] Starting profile analysis...");
      profileAnalysis = await analyzeImage(base64Image);

      console.log("\n[API] Profile Analysis Results:");
      console.log("----------------------------------------");
      console.log(profileAnalysis);
      console.log("----------------------------------------");
    } else {
      console.log("\n[API] No profile image provided");
    }

    console.log("\n[API] Generating gift recommendations based on analysis...");
    const recommendations = await generateGiftRecommendations(
      age,
      budget,
      profileAnalysis || "No profile analysis available."
    );

    console.log("\n[API] Generated recommendations:", recommendations);
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get gift recommendations" },
      { status: 500 }
    );
  }
}
