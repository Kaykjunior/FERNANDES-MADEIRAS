import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Página de login fica em /restrito (raiz) — libera acesso
  const isLoginPage = pathname === "/restrito" || pathname === "/restrito/"

  // Rotas protegidas: tudo dentro de /restrito/* exceto a própria página de login
  const isProtectedRoute = pathname.startsWith("/restrito/")

  if (isProtectedRoute && !isLoginPage) {
    const token = request.cookies.get("token")?.value

    if (!token) {
      // Redireciona para o login mantendo a URL de destino como parâmetro
      const loginUrl = new URL("/restrito", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Aplica o middleware apenas nas rotas /restrito e subrotas
  matcher: ["/restrito", "/restrito/:path*"],
}