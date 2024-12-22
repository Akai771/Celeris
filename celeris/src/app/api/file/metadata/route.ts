import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileSize } = body;

    if (!fileName || !fileSize) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Logic to handle file metadata, e.g., save to DB
    return NextResponse.json({ message: "File metadata received", file: { fileName, fileSize } });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
