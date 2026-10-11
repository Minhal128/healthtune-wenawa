# HealthTune Mobile — AI Context

> Verified against source @ `57e358f` (master), 2026-10-11.  
> Load this file first. Prefer code over README when they disagree (they do — see §9).

## 1. What this is

Expo Router mobile app (iOS/Android) for **healthcare providers**: patients, appointments, therapy sessions (record → transcribe → AI notes), quick voice notes.  
Owner: Wenawa. Bundle ID: `com.wenawa.healthtune`. Scheme: `healthtune`.

**Not in this repo:** backend API. Client talks to hardcoded hosts (see §5).

## 2. Stack (actual)

| Layer | Choice |
|-------|--------|
| Runtime | Expo `~53`, RN `0.79.4`, React `19`, TS `~5.8` strict |
| Entry | `expo-router/entry` → `app/` |
| Auth | `@clerk/clerk-expo` + `tokenCache` |
| HTTP | axios (`utils/config/`) + Clerk Bearer |
| Server state | TanStack Query v5 |
| Forms | react-hook-form + zod (**auth only**) |
| Audio | `expo-audio` (`useAudioRecording`, `useNoteAudioPlayer`) — **not** `expo-av` (dep present, unused in TS) |
| UI | Gorhom bottom sheet, Reanimated, LinearGradient, sonner-native |
| Alias | `@/*` → repo root (`tsconfig.json`) |
| New Arch | `newArchEnabled: true` (`app.json`) |

Scripts: `npm start` / `android` / `ios` / `web` / `lint`. Typecheck: `npx tsc --noEmit`. Builds: EAS (`eas.json` profiles: development, preview, production).

## 3. Directory map

```
app/                    # screens only (Expo Router)
  (auth)/               # sign-in
  (tabs)/               # home, session, notes, session-history, profile
  (primary)/            # stack: create-quick-notes, session-notes, note-player, session-details
features/               # domain modules (api + types + components/hooks)
  auth/ patients/ patient-sessions/ quick-notes/ templates/ appointments/ shared/
utils/config/           # axios instance + interceptors
utils/constants/        # API_BASEURL, languages, AssemblyAI key source
assets/                 # fonts, images
```

**Rule for agents:** put domain logic in `features/<domain>/`. Screens in `app/` stay thin (compose hooks/components). Shared UI/audio/query → `features/shared/`.

## 4. Boot & auth flow

```
app/_layout.tsx
  fonts → SplashScreen.hide → setup() axios interceptors
  SafeArea → GestureHandler → BottomSheetModal
  → ClerkProvider(EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, tokenCache)
  → QueryClientProvider → Stack[index | (tabs) | (auth) | (primary)]
```

| Step | File | Behavior |
|------|------|----------|
| Gate | `app/index.tsx` | `isSignedIn` ? `/home` : `/sign-in` |
| Auth layout | `app/(auth)/_layout.tsx` | signed-in → `/` |
| Sign-in | `app/(auth)/sign-in.tsx` | Clerk email/password → `setActive` → `router.replace('/')` |
| Google SSO | `features/auth/hooks/useGoogleSSO.ts` | exists; **UI commented out** in sign-in |
| Sign-out | `app/(tabs)/profile.tsx` | → `/sign-in` |

**Pitfall:** `(tabs)` and `(primary)` layouts do **not** check auth. Deep link can open screens; API 401 → interceptor `signOut()`.

Token on requests: `utils/config/axios-interceptors.ts` → `getClerkInstance().session?.getToken()` → `Authorization: Bearer`. Logs token to console. `PUBLIC_ENDPOINTS` list is leftover (`/auth/login/` etc.) — mobile paths never match it.

Language preference: `features/shared/hooks/useLanguage.ts` ↔ Clerk `user.unsafeMetadata.language`.

## 5. API & env

### Hosts (hardcoded — not env-driven)

| Constant / call site | URL |
|----------------------|-----|
| `API_BASEURL` in `utils/constants/index.ts` | `https://dev-api.healthtune.io/api` |
| Session AI / transcription absolute posts in `features/patient-sessions/api/sessions.api.ts` | `https://dev-app.healthtune.io/api/...` |
| Quick-note media in `features/quick-notes/api/notes.api.ts` | `https://dev-api.healthtune.io/media/${file}` (**no `/api`**) |
| Playback URLs in `note-player.tsx` / `session-details.tsx` | `${API_BASEURL}/media/${file}` (= `.../api/media/...`) |

**Media URL inconsistency is real** — do not “normalize” without checking which path the backend serves.

### Env vars actually read in code

| Var | Where | Notes |
|-----|-------|-------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `app/_layout.tsx` | required |
| `EXPO_PUBLIC_ASSEMBLY_AI_KEY` | `utils/constants/index.ts` | optional; **hardcoded fallback key committed in source** — rotate / remove; never paste key into docs |

**README lies:** `EXPO_PUBLIC_API_URL` is **not used**. Changing it does nothing. `.gitignore` ignores `.env*.local` only (plain `.env` not ignored).

### Endpoint cheat sheet (relative to `API_BASEURL` unless absolute)

| Domain | Methods |
|--------|---------|
| Patients | `GET /patient/by-appointment`, `GET /patient/:id` |
| Sessions | `GET/POST /session`, `GET /session/:id`, `PUT /session/:id/transcript\|note\|diagnosis`, `PUT /session/details/:id` (multipart), `PUT /session/:id` `{status:'Approved'}` |
| Session AI (absolute) | `POST .../session-notes/consolidated`, `.../transcription`, `.../transcription/translate-ur` |
| Quick notes | `GET/POST /quick-notes/`, `GET/PATCH/DELETE /quick-notes/:id` |
| Templates | `GET /template`, `GET /template/:id` (`Accept-Language: en`) |
| Appointments | `GET /appointment` (+ query filters) |
| External | AssemblyAI `https://api.assemblyai.com/v2/*` from device (`transcription.service.ts`) |

## 6. Routes

| Path | File |
|------|------|
| `/` | `app/index.tsx` |
| `/sign-in` | `app/(auth)/sign-in.tsx` |
| `/home` | `app/(tabs)/home.tsx` |
| `/session` | `app/(tabs)/session.tsx` |
| `/notes` | `app/(tabs)/notes.tsx` |
| `/session-history` | `app/(tabs)/session-history.tsx` |
| `/profile` | `app/(tabs)/profile.tsx` |
| `/create-quick-notes` | `app/(primary)/create-quick-notes.tsx` |
| `/session-notes` | `app/(primary)/session-notes.tsx` |
| `/note-player` | `app/(primary)/note-player.tsx` |
| `/session-details` | `app/(primary)/session-details.tsx` |

Typical nav: FloatingVoiceButton → `/create-quick-notes`; session flow → `/(primary)/session-notes?sessionId=`; notes → `/(primary)/note-player`; history → `/(primary)/session-details?id=`.

## 7. Features (where to edit)

### `features/auth/`
Sign-in form (`useSignInForm` + zod), `FormInput`, Google SSO hook. No REST.

### `features/patients/`
List via `usePatientsService` / `PatientsAPI`. `PatientSelectionScreen` filters patients that have embedded `appointments` with status `Scheduled`. Types: `types/patient.ts`.

### `features/patient-sessions/`
Session CRUD + record→transcribe→AI→save in `sessions.service.ts` / `sessions.api.ts`. Types: `types/session.ts`. No local components — screens in `app/`.

Session create defaults (`app/(tabs)/session.tsx`): `sessionType: 'Telehealth'`, `sex: patient.gender || 'Male'`, `noteFormat: template.title`.

### `features/quick-notes/`
CRUD + AssemblyAI transcription. **`NotesAPI.getAllNotes` / `getNoteById` return mock notes on error** — failures look like success with fake data.

### `features/templates/`
Template picker; `noteFormat` = template `title`.

### `features/appointments/`
`AppointmentsAPI` only. Home tab fetches with local `useState` (no TanStack service). Dead assets under `api/public/fonts/` (SVGs; not imported by TS).

### `features/shared/`
`query-client.ts`, audio hooks, `useLanguage`, `GradientHeader`, `FloatingVoiceButton`, `DateFilterSheet`, `LanguageSelectionScreen`, `theme.ts` (`PRIMARY = '#134e4a'`), `dateUtils.ts` (+ `dateUtils.test.ts`).

## 8. Domain types (source of truth paths)

Reuse these files — do not invent parallel shapes.

- **Patient** — `features/patients/types/patient.ts` (`mreNumber`, demographics, nested address/contact/medical/insurance/admission, optional `appointments[]`).
- **Appointment (on Patient)** — same file; `consultationFee: number | null`.
- **Appointment (API)** — `features/appointments/api/appointments.api.ts`; `consultationFee: string`; nested `doctor`/`patient`; **not the same type**.
- **Session / CreateSessionPayload / Diagnosis / ConsolidatedNotesResponse** — `features/patient-sessions/types/session.ts`. Embedded Patient there differs slightly (e.g. `languagePreference`, `organizationId`).
- **Quick Note / Speaker** — `features/quick-notes/types/note.ts` (`file`, `transcript`, `speakers`, `isProcessing`…).
- **Template** — `features/templates/types/template.ts` (`title`, `prompt`, `language`).

Languages: `en` | `ar` | `ur` in `utils/constants/index.ts`.

## 9. Patterns agents must follow

1. **API layering:** `*.api.ts` (axios) ← `*.service.ts(x)` (TanStack hooks returning `useX`/`useMutation`) ← screen. Match existing factory style (`useSessionsService()` etc.).
2. **Query keys already in use:** `['sessions', page, limit, startDate, endDate]`, `['session', id]`, `['notes']`, `['patients', page, limit]`, `['templates', page, limit]`. Invalidate those families on mutations.
3. **Dates:** backend stores local time but suffixes `Z`. Always use `parseUTCDate` from `features/shared/utils/dateUtils.ts` for display — never raw `new Date(iso)`.
4. **Audio:** record with `useAudioRecording`; play with `useNoteAudioPlayer`. Do not add `expo-av` usage.
5. **Imports:** prefer `@/features/...` and `@/utils/...`.
6. **No new deps** unless existing stack cannot do it (axios, RQ, Clerk, expo-audio, zod already present).
7. **PHI / secrets:** do not log tokens (already does — do not add more). Do not commit new API keys. Prefer env over hardcoded hosts when changing config.

## 10. README vs reality (ignore README when conflicting)

| Claim | Reality |
|-------|---------|
| `EXPO_PUBLIC_API_URL` | unused; `API_BASEURL` hardcoded |
| Dark mode “support” | only `userInterfaceStyle: automatic`; no theme system |
| Expo SecureStore for tokens | Clerk `tokenCache` only; no app SecureStore imports |
| Google SSO | hook exists; UI disabled |
| Feature-complete dark/i18n UI | language picker + Clerk metadata only |

## 11. Commands

```bash
npm install
# .env: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=...
# optional: EXPO_PUBLIC_ASSEMBLY_AI_KEY=...
npm start          # Expo
npm run ios|android|web
npm run lint
npx tsc --noEmit
# native modules / Clerk: prefer expo-dev-client / eas build development
eas build --platform ios|android|all
```

## 12. Agent do / don't

**Do**
- Trace `features/*/api` before changing endpoints.
- Keep screens thin; extend services/hooks.
- Preserve dateUtils semantics and media URL patterns until backend confirmed.
- Run lint/tsc on touched TS.

**Don't**
- Trust README for env or architecture.
- “Fix” mock-note fallback without product intent (hides errors).
- Duplicate `Appointment`/`Patient`/`Note` types across modules.
- Point production builds at `dev-*` hosts without an explicit env strategy.
- Expand Google SSO / dark mode / new features unless asked.

## 13. High-value edit entry points

| Task | Start here |
|------|------------|
| Auth UI / SSO | `app/(auth)/sign-in.tsx`, `features/auth/` |
| Axios / 401 | `utils/config/axios-interceptors.ts`, `axios-instance.ts` |
| Base URL / langs | `utils/constants/index.ts` |
| Session pipeline | `features/patient-sessions/api/sessions.service.ts` |
| Quick notes + STT | `features/quick-notes/api/` |
| Home appointments | `app/(tabs)/home.tsx` + `features/appointments/api/appointments.api.ts` |
| Tab chrome | `app/(tabs)/_layout.tsx` |
| Theme color | `features/shared/utils/theme.ts` |

---

*Regenerate or refresh this file after structural/API changes. Prefer short verified facts over aspirational docs.*
