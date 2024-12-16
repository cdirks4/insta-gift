import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { Groq } from "groq-sdk";

interface InstagramProfile {
  username: string;
  bio?: string;
  posts: {
    imageUrl?: string;
    caption?: string;
    likes?: number;
    hashtags?: string[];
    mentions?: string[];
  }[];
}

async function scrapeInstagramProfile(
  username: string
): Promise<InstagramProfile | null> {
  try {
    console.log("[Instagram Scraper] Launching browser...");
    const browser = await puppeteer.launch({
      headless: "new",
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("[Instagram Scraper] Navigating to profile...");
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: "networkidle0",
    });

    // Wait for posts to load
    await page.waitForSelector("article a", { timeout: 5000 });

    // Get profile data and first 10 post URLs
    const postUrls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("article a"))
        .slice(0, 10)
        .map((a) => a.href);
    });

    console.log(
      `[Instagram Scraper] Found ${postUrls.length} posts to analyze`
    );

    // Visit each post to get detailed info
    const posts = [];
    for (const url of postUrls) {
      await page.goto(url, { waitUntil: "networkidle0" });

      const postData = await page.evaluate(() => {
        const caption = document.querySelector("h1")?.textContent || "";
        const image = document.querySelector("article img");
        const likes = document.querySelector("section span")?.textContent;

        return {
          imageUrl: image?.src,
          caption,
          likes: parseInt(likes || "0"),
          hashtags: caption.match(/#[\w]+/g) || [],
          mentions: caption.match(/@[\w]+/g) || [],
        };
      });

      posts.push(postData);
      console.log("[Instagram Scraper] Scraped post:", postData);
    }

    // Get bio
    await page.goto(`https://www.instagram.com/${username}/`);
    const bio = await page.evaluate(() => {
      return document.querySelector(".-vDIg span")?.textContent || "";
    });

    await browser.close();

    return {
      username,
      bio,
      posts,
    };
  } catch (error) {
    console.error("[Instagram Scraper] Error:", error);
    return null;
  }
}

async function analyzeProfile(profileData: InstagramProfile): Promise<string> {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const profileSummary = `
Bio: ${profileData.bio}

Posts Analysis:
${profileData.posts
  .map(
    (post, i) => `
Post ${i + 1}:
Caption: ${post.caption}
Hashtags: ${post.hashtags?.join(", ")}
Likes: ${post.likes}
`
  )
  .join("\n")}
`;

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
          content: `Analyze this Instagram profile and describe what you observe:
${profileSummary}

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
    console.log("[Profile Analysis] Full analysis:", analysis);
    return analysis;
  } catch (error) {
    console.error("[Profile Analysis] Error:", error);
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    console.log("[Instagram Scraper] Fetching profile for:", username);
    const profileData = await scrapeInstagramProfile(username);

    if (!profileData) {
      return NextResponse.json(
        { error: "Failed to fetch Instagram data" },
        { status: 404 }
      );
    }

    // Get AI analysis of the profile
    const analysis = await analyzeProfile(profileData);

    // Extract interests from posts
    const interests = new Set<string>();

    // Add hashtags
    profileData.posts.forEach((post) => {
      post.hashtags?.forEach((tag) =>
        interests.add(tag.slice(1).toLowerCase())
      );
    });

    // Extract keywords from captions
    profileData.posts.forEach((post) => {
      const words = post.caption
        ?.toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 3);
      words?.forEach((word) => interests.add(word));
    });

    // Add bio keywords
    const bioWords = profileData.bio
      ?.toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);
    bioWords?.forEach((word) => interests.add(word));

    console.log(
      "[Instagram Scraper] Extracted interests:",
      Array.from(interests)
    );

    return NextResponse.json({
      profile: profileData,
      interests: Array.from(interests),
      analysis,
    });
  } catch (error) {
    console.error("[Instagram Scraper] API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Instagram data" },
      { status: 500 }
    );
  }
}
