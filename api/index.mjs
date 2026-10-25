// Vercel invokes this handler per request; importing server.mjs does not open a port.
export { handleRequest as default } from '../server.mjs';
