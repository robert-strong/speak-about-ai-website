import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@vercel/blob';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Generate a signed download URL that's valid for 1 hour
    const downloadUrl = await getDownloadUrl(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN!
    });

    // Redirect to the signed URL
    return NextResponse.redirect(downloadUrl, 302);
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate image URL', details: error.message },
      { status: 500 }
    );
  }
}
