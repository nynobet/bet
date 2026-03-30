import { UserRole } from '@prisma/client';
import { auth } from 'auth';
import { NextResponse } from 'next/server';

const ROLE_HOME: Record<UserRole, string> = {
  USER: '/',
  AGENT: '/agent/dashboard',
  MARKETER: '/affiliate/dashboard',
  ACCOUNTANT: '/finance/dashboard',
  CALL_SUPPORT: '/support/dashboard',
  ADMIN: '/dashboard',
  SUPER_ADMIN: '/dashboard',
  // New affiliate hierarchy roles
  AFFILIATE_TL: '/tl/dashboard',
  AFFILIATE_MANAGER: '/partner/dashboard',
  AFFILIATE: '/partner/dashboard'
};

type RoleGroup = {
  prefix: string;
  allowed: UserRole[];
};

const PROTECTED_GROUPS: RoleGroup[] = [
  { prefix: '/agent', allowed: [UserRole.AGENT] },
  {
    prefix: '/dashboard',
    allowed: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
  },
  { prefix: '/affiliate', allowed: [UserRole.MARKETER] },
  { prefix: '/finance', allowed: [UserRole.ACCOUNTANT] },
  { prefix: '/support', allowed: [UserRole.CALL_SUPPORT] },
  // New affiliate hierarchy routes
  { prefix: '/tl', allowed: [UserRole.AFFILIATE_TL] },
  {
    prefix: '/partner',
    allowed: [UserRole.AFFILIATE_MANAGER, UserRole.AFFILIATE]
  }
];

// Auth paths that unauthenticated users can access
const AUTH_PATH_PREFIXES = [
  '/auth',
  '/tl/login',
  '/partner/login',
  '/partner/register'
];

// Public paths accessible to everyone (including authenticated users)
const PUBLIC_PATH_PREFIXES = ['/apply'];

const isPathWithin = (pathname: string, prefix: string) => {
  if (prefix === '/') return pathname === '/';
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
};

const getRoleHome = (role?: UserRole) =>
  role ? (ROLE_HOME[role] ?? '/') : '/';

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;

  const role = session?.user?.role as UserRole | undefined;
  const isAuthenticated = Boolean(session?.user);
  const homePath = getRoleHome(role);

  const matchedGroup = PROTECTED_GROUPS.find((group) =>
    isPathWithin(pathname, group.prefix)
  );

  const isAuthPath = AUTH_PATH_PREFIXES.some((prefix) =>
    isPathWithin(pathname, prefix)
  );

  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) =>
    isPathWithin(pathname, prefix)
  );

  // Allow public paths for everyone
  if (isPublicPath) {
    return NextResponse.next();
  }

  const isAtHome =
    homePath === '/' ? pathname === '/' : isPathWithin(pathname, homePath);

  // Unauthenticated users trying to access protected areas get sent to appropriate login
  if (!isAuthenticated) {
    // Allow auth paths (login/register pages) through for unauthenticated users
    if (isAuthPath) {
      return NextResponse.next();
    }
    if (matchedGroup) {
      // Redirect to role-specific login pages
      if (matchedGroup.prefix === '/tl') {
        return NextResponse.redirect(new URL('/tl/login', nextUrl));
      }
      if (matchedGroup.prefix === '/partner') {
        return NextResponse.redirect(new URL('/partner/login', nextUrl));
      }
      return NextResponse.redirect(new URL('/auth/login', nextUrl));
    }
    return NextResponse.next();
  }

  // Authenticated users are generally not allowed on auth pages.
  // EXCEPTION: role-specific portals (/partner/login, /tl/login) are always
  // accessible even if the user is authenticated with a different role —
  // this lets someone switch accounts (e.g. a USER logging into partner portal).
  if (isAuthPath) {
    const partnerLoginRoles: UserRole[] = [
      UserRole.AFFILIATE_MANAGER,
      UserRole.AFFILIATE
    ];
    const isTLLogin =
      pathname === '/tl/login' || pathname.startsWith('/tl/login/');
    const isPartnerLogin =
      pathname === '/partner/login' ||
      pathname.startsWith('/partner/login/') ||
      pathname === '/partner/register' ||
      pathname.startsWith('/partner/register/');

    if (isTLLogin && role !== UserRole.AFFILIATE_TL) {
      // Allow a non-TL user to see the TL login page so they can authenticate
      return NextResponse.next();
    }
    if (isPartnerLogin && role && !partnerLoginRoles.includes(role)) {
      // Allow a non-partner user to see the partner login/register page so they can authenticate
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(homePath, nextUrl));
  }

  // Block cross-area access
  if (matchedGroup && role && !matchedGroup.allowed.includes(role)) {
    return NextResponse.redirect(new URL(homePath, nextUrl));
  }

  // USER ছাড়া অন্য role-রা public routes (including "/") এ থাকতে পারবে না
  // তাদের root হবে তাদের assigned area/home (e.g. /agent/dashboard, /affiliate/dashboard)
  if (role && role !== UserRole.USER && !matchedGroup) {
    return NextResponse.redirect(new URL(homePath, nextUrl));
  }

  // If user is already logged in and hits public home, send to role home
  if (pathname === '/' && homePath !== '/') {
    return NextResponse.redirect(new URL(homePath, nextUrl));
  }

  // If user hits a protected area root (e.g. /agent, /affiliate), send to role home
  // Keeps deeper routes accessible (e.g. /agent/withdrawals), but avoids blank roots.
  if (
    matchedGroup &&
    pathname === matchedGroup.prefix &&
    homePath !== pathname
  ) {
    return NextResponse.redirect(new URL(homePath, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'
  ]
};
