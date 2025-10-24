export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">Portal NN</h1>
            <p className="text-xl text-muted-foreground text-balance">Bem-vindo ao seu portal</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Início</h3>
                <p className="text-sm text-muted-foreground">Página inicial do portal</p>
              </div>
            </div>

            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Recursos</h3>
                <p className="text-sm text-muted-foreground">Acesse os recursos disponíveis</p>
              </div>
            </div>

            <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Suporte</h3>
                <p className="text-sm text-muted-foreground">Central de ajuda e suporte</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
