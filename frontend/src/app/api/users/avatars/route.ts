import fs from "fs";
import path from "path";

export async function GET() {
  const imagesDirectory = path.join(process.cwd(), "public/avatars");

  try {
    const images = fs
      .readdirSync(imagesDirectory)
      .filter((file) => file.endsWith(".png"))
      .map((file) => `${file}`);

    return Response.json(images);
  } catch (error) {
    console.error("Error reading images directory:", error);
    return new Response(
      JSON.stringify({ error: "Error reading images directory" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
