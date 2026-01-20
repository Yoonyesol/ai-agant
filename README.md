# 돌다리 (Dol-dari) - 안심 창업 법률 가이드

**박 과장님(58세)을 위한 가맹점 창업 필수 앱**

## 📱 프로젝트 소개

돌다리는 예비 창업자(은퇴 예정자)가 프랜차이즈 가맹 계약 시 겪는 정보 비대칭과 법률적 위험을 해결해주는 AI 서비스입니다.

### 핵심 기능

1.  **안심 계약 독소조항 스캐너 (The Guardian)**: 계약서 PDF/이미지를 업로드하면 7대 핵심 위험 조항을 자동 분석 및 경고.
2.  **브랜드 안전성 분석 (The Comparator)**: 공정위 데이터를 기반으로 폐점률, 성장성 등 핵심 지표 분석.
3.  **AI 음성/채팅 비서**: "이 조항이 무슨 뜻이야?"라고 물으면 알기 쉽게 설명해주는 시니어 친화적 인터페이스.

## 🛠 기술 스택

- **Frontend**: React (Vite), TypeScript
- **Styling**: Tailwind CSS (Premium Design System), Framer Motion (Animations)
- **State Management**: Zustand
- **Routing**: React Router DOM (Mobile First Layout)
- **Icons**: Lucide React

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📂 프로젝트 구조

- `src/layout`: 모바일 친화적 하단 네비게이션 레이아웃
- `src/pages`:
  - `Home`: 직관적인 계약서 업로드 UI
  - `Chat`: AI 비서와의 실시간 대화 및 조항 하이라이팅 (Voice Visualizer 포함)
  - `Result`: 종합 분석 리포트 (계약 안전성 점수, 리스크 상세)
- `src/store`: Zustand 전역 상태 관리
