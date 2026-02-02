# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PersonaPop is a React Native (Expo) mobile app that generates hand-drawn style MBTI personality cards. Users take an MBTI test or select their type, choose a "vibe" (mood/aesthetic), and receive an AI-generated persona card.

**Core Tech Stack:**
- **Framework**: Expo SDK 54 with Expo Router (file-based routing)
- **Language**: TypeScript with strict mode
- **Backend**: Supabase (Auth + PostgreSQL)
- **AI Services**: DeepSeek API (text insights), apifree.ai (image generation)
- **Styling**: React Native StyleSheet with custom hand-drawn design system
- **Fonts**: Google Fonts (Kalam, Patrick Hand)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (opens Expo DevTools)
npx expo start

# Platform-specific
npx expo start --android    # Android
npx expo start --ios        # iOS
npx expo start --web        # Web

# Linting
npm run lint                # or: npx expo lint

# Build APK (requires EAS CLI and Expo account)
eas build -p android --profile preview
```

## Environment Configuration

Required `.env` variables:
```bash
EXPO_PUBLIC_SUPABASE_URL=<supabase_project_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
EXPO_PUBLIC_DEEPSEEK_API_KEY=<deepseek_api_key>       # Optional - for AI insights
EXPO_PUBLIC_AI_API_KEY=<apifree_api_key>              # Optional - for AI image generation
EXPO_PUBLIC_AI_API_URL=https://api.apifree.ai/v1     # Optional - defaults to apifree.ai
EXPO_PUBLIC_AI_MODEL=bytedance/seedream-4.5          # Optional - image model
EXPO_PUBLIC_DISABLE_AI=true                           # Optional - forces local images
```

## Architecture

### Routing (Expo Router)
- `app/_layout.tsx` - Root layout with theme provider
- `app/index.tsx` - Entry redirect
- `app/persona.tsx` - Main application (single-page app with internal state-based navigation)

The app uses a single main screen (`persona.tsx`) with step-based navigation (`step` state: 0=hero, 1=type selection, 2=vibe selection, 3=loading, 4=result) and tab-based navigation (`activeTab` state: 'home' | 'create' | 'profile').

### Component Organization
- `components/persona/` - Feature-specific components (AuthView, ProfileView, MbtiTest, etc.)
- `components/ui/` - Reusable UI primitives
- Hand-drawn UI components: `HandButton`, `HandCard`, `HandInput`, `StickyNote`

### Data Layer
- `lib/supabase.ts` - Supabase client initialization
- `lib/ai-service.ts` - AI image generation with fallback to local MBTI character images
- `lib/deepseek-service.ts` - DeepSeek chat API for generating MBTI insights
- `lib/settings.ts` - AsyncStorage-based settings persistence
- `lib/share-utils.ts` - Image sharing and gallery saving utilities

### Constants
- `constants/persona.ts` - COLORS, MBTI_TYPES, VIBES, COPY_TEMPLATES, MBTI_IMAGES mappings
- `constants/mbti-facts.ts` - Per-type traits, facts, and funny quotes
- `constants/mbti-test.ts` - Test questions and result calculation logic

### Image Assets
- `MMM/` - MBTI character images (transparent PNG, used in app)
- `MTIB/` - MBTI character images backup (Chinese-named files)
- `assets/images/` - App icons, mascots, splash screen

## Key Patterns

### Styling Convention
All components use the hand-drawn aesthetic with these characteristics:
- Bold borders (3-4px, `COLORS.fg`)
- Shadow effects using offset (no blur): `shadowOffset: { width: 4-8, height: 4-8 }, shadowOpacity: 1, shadowRadius: 0`
- Slight rotation transforms for organic feel
- `Kalam_700Bold` for titles, `PatrickHand_400Regular` for body text

### AI Service Fallback
`lib/ai-service.ts` implements a graceful degradation pattern:
1. If `EXPO_PUBLIC_DISABLE_AI=true` → use local MBTI images
2. If no API key configured → use local MBTI images with warning
3. If API call fails → fall back to placeholder images (Unsplash or local)

### Auth Flow
Authentication is handled in `persona.tsx`:
- If no session → render `<AuthView />`
- If session exists → render main app content
- Session state managed via Supabase `onAuthStateChange` listener

### Database Schema
Supabase `personas` table:
```sql
id uuid primary key
user_id uuid references auth.users
created_at timestamptz
mbti_type text
vibe text
result_text text
image_url text
is_favorite boolean
```

## Conventions

- **Language**: UI text is in Chinese (Simplified)
- **Path aliases**: Use `@/` for root imports (configured in `tsconfig.json`)
- **Image imports**: Local images use `require()` with path from project root
- **State management**: Local component state with useState/useEffect (no global store)
