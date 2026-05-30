import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-revalidate-secret');

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { message: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const tag = body.tag;

    if (!tag) {
      return NextResponse.json(
        { message: 'Missing tag' }, 
        { status: 400 }
      );
    }

    const tagsArray = Array.isArray(tag) ? tag : [tag];

    tagsArray.forEach(t => {
      try {
        revalidateTag(t, 'default');
      } catch (err) {}

      try {
        revalidateTag(encodeURIComponent(t), 'default');
      } catch (err) {}

      if (t === 'products' || t === 'all') {
        revalidatePath('/', 'layout');
      }
    });

    return NextResponse.json({ 
      revalidated: true, 
      tag: tag,
      now: Date.now() 
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Server error' }, 
      { status: 500 }
    );
  }
}