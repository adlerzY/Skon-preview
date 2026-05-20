import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-revalidate-secret');

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { message: 'غیرمجاز: توکن نامعتبر است' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const tag = body.tag;

    if (!tag) {
      return NextResponse.json(
        { message: 'تگ ارسال نشده است' }, 
        { status: 400 }
      );
    }

    if (Array.isArray(tag)) {
      tag.forEach(t => revalidateTag(t));
    } else {
      revalidateTag(tag);
    }

    return NextResponse.json({ 
      revalidated: true, 
      tag: tag,
      now: Date.now() 
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'خطای سرور در عملیات Revalidation' }, 
      { status: 500 }
    );
  }
}