# CIAP2 Landing Page - Agent Context

## Project Overview
Landing page for **CIAP2** - a mobile app for healthcare professionals to quickly look up CIAP-2 (International Classification of Primary Care) codes. The site was completely revamped in February 2026 with Apple-style design because **Apple expressed interest in acquiring the app**.

## Key App Facts
- **Age**: 9 years (2017-2026)
- **Downloads**: 50K+ (iOS + Android combined)
- **App Store Rating**: 4.8 stars
- **Price**: 100% free, no ads, no in-app purchases
- **Privacy**: No trackers, no personal data collection
- **Analytics**: TelemetryDeck only (anonymous signals)
- **Sync**: iCloud via CloudKit (Apple infrastructure)
- **Authorization**: SBMFC (Sociedade Brasileira de Medicina de Família e Comunidade)

## Scientific Publications
1. "Desenvolvimento de um aplicativo para consulta ao CIAP-2" - 15º Congresso Brasileiro de Medicina de Família e Comunidade (2019)
2. "Consulta ao Sistema de Classificação Internacional de Atenção Primária" - 9º Congresso Brasileiro de Telemedicina e Telessaúde (2019)

## Domain & Contact
- **Website**: https://ciap2.app
- **Support Email**: suporte@ciap2.app

## File Structure
```
ciap2/
├── index.html        # Main landing page (hero, features, stats, CTA)
├── artigos.html      # Scientific publications page
├── privacidade.html  # Privacy policy (LGPD compliant)
├── suporte.html      # Support page with FAQ
├── styles.css        # Legacy CSS (not used by new pages)
├── favicon.ico
└── images/
    ├── logo.png
    ├── phones/
    │   └── iphone-banner.png
    └── app-badge/
        ├── app-store.png
        └── google-play.png
```

## Design System
Apple-inspired design with:
- **Font**: Inter (Google Fonts) - similar to SF Pro
- **Colors**:
  - Text Primary: `#1d1d1f`
  - Text Secondary: `#86868b`
  - Background: `#ffffff` / `#f5f5f7`
  - Accent Blue: `#0071e3`
  - Accent Green: `#34c759`
- **Nav**: Frosted glass effect with `backdrop-filter: blur(20px)`
- **Animations**: Intersection Observer for fade-in effects
- **Responsive**: Mobile-first, breakpoints at 480px, 768px, 1024px

## Language
- **Brazilian Portuguese** throughout
- Watch for "é" (verb "is") vs "e" (conjunction "and") - common mistake
- Proper accents: ã, õ, ç, á, é, í, ó, ú, â, ê, ô, à

## App Store Links
- iOS: `https://apps.apple.com/app/apple-store/id1450836069?pt=95625862&ct=site&mt=8`
- Android: `https://play.google.com/store/apps/details?id=com.ciap2&hl=pt_BR`

## Important Notes
- All pages use inline `<style>` tags (no external CSS for new design)
- Privacy policy emphasizes: no ads, no trackers, no personal data, iCloud private
- TelemetryDeck section explains anonymous analytics approach
- Footer includes SBMFC authorization notice
- Copyright: 2017-2026

## Target Audience
Healthcare professionals: doctors, nurses, and other primary care workers who need quick access to CIAP-2 classification codes.

## Why This App Matters

### Healthcare Impact
- **CIAP-2** (Classificação Internacional de Atenção Primária) is the standard classification system used in Primary Healthcare across Brazil
- Doctors and nurses need to code patient encounters, symptoms, and diagnoses daily
- Before this app, professionals had to use printed books or clunky desktop systems
- **50,000+ healthcare workers** now have instant access to all CIAP-2 codes on their phones
- Works **100% offline** - critical for clinics in remote areas with poor connectivity
- Helps improve the quality of health records and epidemiological data in Brazil

### Unique Value Proposition
- **Only SBMFC-authorized** mobile app for CIAP-2 consultation
- Born from academic research, validated at national medical congresses
- Completely free with no monetization - built as a service to healthcare community
- Privacy-first approach rare in healthcare apps
- 9 years of continuous development and user trust

### Recognition
- Presented at Brazil's most important Primary Care congress (CBMFC)
- Presented at Brazil's Telemedicine congress (CBTMS)
- Authorized by SBMFC (the Brazilian equivalent of AAFP for family medicine)
- Consistently high App Store ratings (4.8) over many years

## Owner Context
- **Developer**: Ezequiel Santos
- Apple reached out expressing interest in acquiring the app
- This acquisition could be life-changing - funds needed for surgery
- Landing page revamp done urgently for Apple's review meeting
