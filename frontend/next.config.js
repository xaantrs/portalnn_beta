/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Redireciona as chamadas de API para o seu backend Flask na porta 5001
  async rewrites() {
    return [
      {
        // De: /api/auth/qualquercoisa
        // Para: http://localhost:5001/api/auth/qualquercoisa
        source: '/api/auth/:path*', 
        destination: 'http://localhost:5001/api/auth/:path*', 
      },
      {
        // ESTA É A MUDANÇA IMPORTANTE
        // De: /api/consulta-sql
        // Para: http://localhost:5001/api/geo/consulta-sql
        source: '/api/consulta-sql',
        destination: 'http://localhost:5001/api/geo/consulta-sql',
      }
    ];
  },
};

module.exports = nextConfig;