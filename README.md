# pay

Demo deployed via [demo-tools](https://github.com/BosTheCoder/demo-tools).

- **Stack:** html
- **Deploy target:** pages
- **Local dev:** `just dev` — serves these files on http://localhost:8000. No build step and no container: what you edit is what ships.
- **Deploy:** `just deploy` — pushes `main`; Pages serves the repo root. Then it registers the Pages config, the `CNAME`, and the DNS record.
- **Live URL:**
  - https://pay.github.io (until a custom domain is attached)
  - Put a hostname in a `CNAME` file at the repo root and `just deploy` points it at Pages. DNS-only — a proxied record breaks GitHub's certificate issuance.
- **First deploy?** The HTTPS certificate can take up to an hour. `just status` shows its state, which is the usual answer to "why does http work but https doesn't?".
- **No server here.** `just secret` deliberately fails: anything this page can read, a visitor can read. Public config belongs in the source; a real credential needs `DEMO_TARGET=fly just deploy`.
- **Status / logs / destroy:** `just status` / `just logs` (Pages build history) / `just destroy` (disables Pages, leaves the repo).
- **Update infra files:** `just sync`
