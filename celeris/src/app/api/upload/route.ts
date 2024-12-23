import { NextResponse } from "next/server";
import { NextRequest } from "next/server"; // Import the correct type

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Process the file (this example assumes it's a text file)
        const fileBuffer = Buffer.from(await (file as Blob).arrayBuffer());
        const fileName = (file as File).name;

        // Example: Save to disk (replace with your own logic)
        const fs = require("fs");
        fs.writeFileSync(`./uploads/${fileName}`, fileBuffer);

        return NextResponse.json({ success: true, fileName });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}
