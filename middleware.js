import { next } from "@vercel/functions";

export const config = {
  matcher: ["/((?!_vercel|favicon).*)"],
};

export default function middleware(request) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !pass) {
    return new Response("Access control is not configured.", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded);
        const colon = decoded.indexOf(":");
        if (colon !== -1) {
          const u = decoded.slice(0, colon);
          const p = decoded.slice(colon + 1);
          if (u === user && p === pass) {
            return next();
          }
        }
      } catch {
        /* invalid credentials */
      }
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="VitalCap private deck"',
    },
  });
}