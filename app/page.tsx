"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Search, LogIn, User } from "lucide-react"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Portal NN</h1>
          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span className="text-sm font-medium">{username}</span>
            </div>
          )}
        </div>

        {!isLoggedIn ? (
          <div className="max-w-md mx-auto mt-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Login
                </CardTitle>
                <CardDescription>Entre com suas credenciais</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const user = formData.get("username") as string
                    setUsername(user)
                    setIsLoggedIn(true)
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <Input id="username" name="username" placeholder="Digite seu usuário" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" name="password" type="password" placeholder="Digite sua senha" required />
                  </div>
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="geosampa" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
              <TabsTrigger value="geosampa" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                GeoSampa Map
              </TabsTrigger>
              <TabsTrigger value="consulta" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Consulta
              </TabsTrigger>
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geosampa" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>GeoSampa Map</CardTitle>
                  <CardDescription>Visualize e consulte informações geográficas da cidade de São Paulo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                      <div className="text-center space-y-2">
                        <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Mapa interativo do GeoSampa</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Camada</Label>
                        <Input placeholder="Selecione uma camada" />
                      </div>
                      <div className="space-y-2">
                        <Label>Filtro</Label>
                        <Input placeholder="Filtrar por região" />
                      </div>
                    </div>
                    <Button className="w-full">Aplicar Filtros</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consulta" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Consulta de Dados</CardTitle>
                  <CardDescription>Realize consultas no banco de dados do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Buscar</Label>
                      <div className="flex gap-2">
                        <Input id="search" placeholder="Digite o termo de busca..." className="flex-1" />
                        <Button>
                          <Search className="h-4 w-4 mr-2" />
                          Buscar
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 min-h-[200px] bg-muted/50">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Os resultados da consulta aparecerão aqui
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="perfil" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Perfil do Usuário</CardTitle>
                  <CardDescription>Gerencie suas informações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Usuário</Label>
                      <Input value={username} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <Input placeholder="Seu departamento" />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">Salvar Alterações</Button>
                      <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
                        Sair
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  )
}
