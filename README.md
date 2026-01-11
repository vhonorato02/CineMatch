# CineMatch 🎬🍿

Tinder para filmes focado em casais. Decida o que assistir de forma rápida e divertida!

## 🚀 Deploy na Vercel (Recomendado)

1. Faça login em [vercel.com](https://vercel.com) com sua conta GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório **CineMatch**
4. A Vercel detecta automaticamente que é um projeto Vite
5. Em **Environment Variables**, adicione:
   - `GEMINI_API_KEY` = sua chave da API Gemini ([obtenha aqui](https://aistudio.google.com/app/apikey))
6. Clique em **Deploy**
7. Pronto! Seu app estará no ar em ~1 minuto 🎉

### Deploy Automático
Cada `git push` na branch `main` atualiza o app automaticamente.

---

## 🛠 Rodar Localmente

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Crie um arquivo `.env` baseado no `.env.example`
4. Rode: `npm run dev`
5. Abra: `http://localhost:3000`

---

## 📱 Gerar APK (Android)

1. Instale o Android Studio
2. Execute: `npm install`
3. Execute: `npm run mobile:init`
4. Execute: `npm run mobile:open`
5. No Android Studio: `Build > Build APK`

Para atualizar: `npm run mobile:sync`

---

## 🎯 Features

- **P2P Real-Time**: Conexão direta entre parceiros via PeerJS
- **IA Personalizada**: Gemini API sugere filmes baseados na sua vibe
- **Swipe Interface**: Tinder-like para decisão rápida
- **Shared Watchlist**: Lista persistente de matches
- **QR Code Pairing**: Conecte instantaneamente via QR
- **Haptic Feedback**: Vibrações em Super Likes
- **PWA Ready**: Instalável como app nativo

---

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run mobile:init  # Inicializa projeto Android
npm run mobile:sync  # Sincroniza mudanças para Android
npm run mobile:open  # Abre no Android Studio
```

---

## 📄 Licença

Feito com ❤️ por Zé pra Galinha
