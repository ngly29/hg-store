import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest){
    const token = request.cookies.get('token')?.value;
    const role = request.cookies.get('role')?.value;
    const {pathname} = request.nextUrl;

    // Cho phép /admin/login không cần token
    if(pathname === '/admin/login'){
        return NextResponse.next();
    }

    // Chặn route /admin
    if(pathname.startsWith('/admin')){
        if(!token){
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        if(role !== 'ADMIN'){
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Chặn route user
    const protectedRoutes = ['/cart', '/checkout', '/orders'];
    if(protectedRoutes.some((route) => pathname.startsWith(route))) {
        if(!token){
            return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/cart/:path*',
        '/checkout/:path*',
        '/orders/:path*'
    ],
};