import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function middleware(request: NextRequest) {
    const ref = request.nextUrl.searchParams.get('ref');
    const response = NextResponse.next();

    if (!ref) {
        return response;
    }

    response.cookies.set('ca_ref', ref, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
    });

    fetch(`${API_BASE_URL}/ca/referral/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: ref }),
    }).catch(() => {
        // Fire-and-forget: a failed click ping should never block the visitor.
    });

    return response;
}

export const config = {
    matcher: '/register',
};
