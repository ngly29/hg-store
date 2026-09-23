import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest){
    const token = request.cookies.get('token')?.value;
    const role = request.cookies.get('role')?.value;
    const {pathname} = request.nextUrl;

    // Public routes: website, product list, product detail, login page
    const publicRoutes = ['/', '/login', '/register'];
    if (publicRoutes.includes(pathname) || pathname.startsWith('/products') || pathname.startsWith('/product')) {
        return NextResponse.next();
    }

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

    // Chỉ chặn các route thao tác cần login: cart, checkout, orders
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
        '/',
        '/login',
        '/register',
        '/products/:path*',
        '/product/:path*',
        '/admin/:path*',
        '/cart/:path*',
        '/checkout/:path*',
        '/orders/:path*'
    ],
};