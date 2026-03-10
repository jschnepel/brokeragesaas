# Intake Module — Deployment to apps/rlsir

## 1. Install recharts (if not already in apps/rlsir)

```bash
cd apps/rlsir
pnpm add recharts
```

Check first — it may already be there from analytics work:
```bash
grep "recharts" apps/rlsir/package.json
```

---

## 2. Place the component file

```bash
mkdir -p apps/rlsir/components/intake
cp <path-to>/intake-ui.jsx apps/rlsir/components/intake/IntakeUI.jsx
```

The component file is self-contained. No changes needed inside it.

---

## 3. Create the route files

Create these two files (contents in adjacent files in this folder):

```
apps/rlsir/app/intake/page.tsx        ← the Next.js route
apps/rlsir/app/intake/IntakeClient.tsx ← dynamic wrapper (avoids SSR crash from Recharts)
```

---

## 4. Verify it runs locally

```bash
pnpm dev --filter=rlsir
# open http://localhost:3000/intake
```

---

## 5. Commit and push to your deploy branch

```bash
git add apps/rlsir/app/intake apps/rlsir/components/intake
git commit -m "feat: add intake marketing module route"
git push origin dev   # or main, whichever triggers Amplify
```

---

## 6. Enable Amplify Access Control (free, HTTP basic auth)

1. AWS Console → Amplify → your app → the branch (dev or main)
2. Left nav: **Access control**
3. Toggle: **Apply access control to all branches**
4. Set username + password → Save
5. Share the URL + credentials with Lex and David

Cost: $0. This is Amplify's built-in feature, not a separate service.

---

## Notes

- The intake module uses only client-side state (all data is mocked).
- No DB, no API routes, no env vars needed for this prototype.
- Recharts requires `ssr: false` in the dynamic import — that's handled in IntakeClient.tsx.
- When you're ready to wire real data, each mock constant (MOCK_REQUESTS, DESIGNER_ALL_REQUESTS, etc.)
  becomes a server component fetch or a React Query call — the component structure stays identical.
