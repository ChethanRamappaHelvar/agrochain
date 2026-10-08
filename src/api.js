// Fetch API helper that talks to the Spring Boot backend
export const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function request(path, method = "GET", body) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(
      "Cannot reach the AgroChain server (" +
        API +
        "). Please start the Spring Boot backend.",
    );
  }
  if (!res.ok) {
    let msg = "Something went wrong (" + res.status + ")";
    try {
      const j = await res.json();
      if (j.message) msg = j.message;
    } catch (e) {
      /* ignore */
    }
    throw new Error(msg);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, "POST", b),
  put: (p, b) => request(p, "PUT", b),
  del: (p) => request(p, "DELETE"),
};
