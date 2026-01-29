import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const response = NextResponse.next()

  // 允许的域名列表（支持所有 wanpuxx.com 和 lengdo.com 的子域名）
  const allowedDomains = [
    'zjerp.lengdo.com',
    'kaifa.wanpuxx.com',
    'www.wanpuxx.com',
  ]

  // 检查请求来源是否在允许列表中
  if (origin) {
    const originDomain = origin.replace(/^https?:\/\//, '')
    const isAllowed = allowedDomains.some(domain => originDomain === domain)
    
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie,X-Requested-With')
    }
  }

  return response
}

export const config = {
  matcher: '/:path*',
}
