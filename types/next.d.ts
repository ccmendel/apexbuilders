declare module 'next/server' {
  export * from 'next/dist/server/web/spec-extension/request'
  export * from 'next/dist/server/web/spec-extension/response'
  export { NextRequest } from 'next/dist/server/web/spec-extension/request'
  export { NextResponse } from 'next/dist/server/web/spec-extension/response'
}

declare module 'next/server.js' {
  export * from 'next/server'
}
