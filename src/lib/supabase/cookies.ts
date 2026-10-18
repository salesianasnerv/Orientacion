// Teams abre la web dentro de un marco de otro dominio: el navegador solo le pasa
// las cookies de sesión si llevan SameSite=None y Secure (en local, http, se dejan como siempre).
export const opcionesCookies =
  process.env.NODE_ENV === "production" ? ({ sameSite: "none", secure: true } as const) : undefined;
