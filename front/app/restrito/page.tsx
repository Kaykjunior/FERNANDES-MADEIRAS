"use client"
import { Metadata } from "next"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, LockKeyhole, Crown, Building2, Eye, EyeOff } from "lucide-react"
import { API_URL } from "@/lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao fazer login")
      }

      localStorage.setItem("token", data.access_token)
      localStorage.setItem("user", JSON.stringify(data.user))

      document.cookie = `token=${data.access_token}; path=/; max-age=${60 * 60 * 8}; SameSite=Strict`

      router.push("/restrito/home")

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 overflow-hidden">
      {/* Background Moderno com Padrões Sutis */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />
      </div>

      <div className="z-10 w-full max-w-[480px] p-6">
        {/* Header Corporativo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative w-16 h-16">
              <Image
                src="/logoFM.png"
                alt="Fernandes Madeira"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-3xl tracking-tight text-white">
                  Fernandes Madeira
                </h1>
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">
                SISTEMA CORPORATIVO
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
              Gestão Empresarial Integrada
            </span>
          </div>
        </div>

        {/* Card de Login Moderno */}
        <Card className="border-gray-800 bg-gray-900/70 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />

          <CardHeader className="space-y-3 pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <ShieldCheck className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    Acesso Seguro
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Portal Corporativo • v2026.1.0
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/50">
                  <p className="text-red-300 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      E-mail Corporativo
                    </div>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-800/50 border-gray-700 text-white h-12 focus:border-amber-500/50 focus:ring-amber-500/20"
                    placeholder="seu.email@reidasmadeiras.com.br"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      Senha de Acesso
                    </div>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-gray-800/50 border-gray-700 text-white h-12 focus:border-amber-500/50 focus:ring-amber-500/20 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AUTENTICANDO...
                    </div>
                  ) : (
                    "ACESSAR SISTEMA"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pb-8">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider leading-relaxed font-medium">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ACESSO RESTRITO
                </span>
                {" • "}
                Monitorado em conformidade com a LGPD
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Rodapé Corporativo */}
        <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-600 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SISTEMA ONLINE</span>
          </div>

          <div className="text-center">
            <p className="uppercase tracking-wider">
              © 2026 Fernandes Madeira LTDA
            </p>
            <p className="text-[11px] text-gray-700">
              Todos os direitos reservados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <LockKeyhole className="w-3 h-3" />
            <span>SSL 256-BIT ENCRYPTED</span>
          </div>
        </div>

        {/* Elementos Decorativos */}
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950/80 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}