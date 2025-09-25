# UnityWallet Frontend

UnityWallet is a digital wallet application that transforms loyalty points into digital assets using the Solana blockchain. This is the React frontend component of the UnityWallet ecosystem.

## 🚀 Features

- **Digital Asset Management**: View and manage SkyPoints (SYP), XLM, and USDC balances
- **QR Payments**: Create and scan QR codes for seamless payments
- **Asset Swapping**: Exchange assets through Solana DEX with real-time quotes
- **Financial Insights**: AI-powered spending analysis and recommendations
- **Credit Scoring**: Internal credit assessment based on transaction history
- **Smart Assistant**: Rule-based financial assistant for queries and advice

## 🛠 Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom design system
- **TanStack Query** for efficient data fetching
- **Zustand** for lightweight state management
- **React Router** for navigation
- **Recharts** for data visualization
- **QRCode libraries** for QR generation and scanning
- **Lucide React** for icons

## 🎨 Design System

The app uses a carefully crafted color palette:

- **Primary Red**: #E31E24 (brand primary)
- **Accent Gold**: #FFC107 (highlights and CTAs)
- **Navy**: #0F172A (text and backgrounds)
- **Success Green**: #16A34A (positive actions)

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=true
VITE_SOLANA_NETWORK=devnet
VITE_RPC_URL=https://api.devnet.solana.com
```

## 📱 App Structure

```
src/
├── app/              # App configuration and layout
├── pages/            # Page components
│   ├── Login.tsx     # Authentication
│   ├── Home.tsx      # Dashboard with balances
│   ├── Pay.tsx       # QR payments
│   ├── Swap.tsx      # Asset exchange
│   ├── Insights.tsx  # Financial analytics
│   ├── Assistant.tsx # AI assistant
│   └── Settings.tsx  # User preferences
├── components/       # Reusable components
│   ├── Navbar.tsx    # Top navigation
│   ├── BottomNav.tsx # Bottom navigation
│   ├── QRCodeGenerator.tsx
│   └── QRScanner.tsx
├── api/              # API layer
│   ├── client.ts     # HTTP client
│   ├── auth.ts       # Authentication
│   ├── wallet.ts     # Wallet operations
│   └── analytics.ts  # Financial insights
├── store/            # State management
│   ├── session.ts    # Auth state
│   └── ui.ts         # UI state
└── lib/              # Utilities
    └── utils.ts      # Helper functions
```

## 🔗 API Integration

The frontend connects to the FastAPI backend with the following endpoints:

- `POST /auth/login` - User authentication
- `GET /wallet/balances` - Asset balances
- `POST /wallet/payment` - Send payments
- `POST /wallet/swap` - Exchange assets
- `GET /wallet/quote` - Get exchange rates
- `POST /qr/create` - Generate payment QR
- `POST /qr/pay` - Process QR payment
- `GET /analytics/*` - Financial insights

## 🎯 Demo Features

### 1. Home Dashboard
- Multi-asset balance display
- Quick action buttons
- Recent transaction history

### 2. QR Payments
- **Create**: Generate payment request QRs
- **Scan**: Camera-based QR scanning with fallback image upload
- Real-time payment processing

### 3. Asset Swapping
- Real-time exchange rates
- Path payment routing
- Transaction confirmation

### 4. Financial Insights
- Spending categorization
- Monthly trend analysis
- Personalized savings recommendations
- Credit score monitoring

### 5. AI Assistant
- Natural language queries
- Rule-based responses
- Quick question templates

## 🔒 Security Features

- JWT-based authentication
- Secure API communication
- Input validation and sanitization
- Error boundary handling

## 📱 Mobile-First Design

The app is built with a mobile-first approach:

- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for mobile performance
- PWA-ready architecture

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel/Netlify

The built files in the `dist/` directory can be deployed to any static hosting service.

### Docker Deployment

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🎬 Demo Script

Follow this 90-second demo flow:

1. **Login** → Home dashboard shows balances
2. **Swap** → Exchange SYP to USDC with live quotes
3. **Pay** → Create QR payment request
4. **Scan** → Scan QR and process payment
5. **Insights** → View spending analysis and AI recommendations

## 🔄 Mock Data

When `VITE_USE_MOCK=true`, the app uses realistic mock data for:

- User balances (SYP, XLM, USDC)
- Exchange rates and quotes
- Transaction results
- Spending analytics
- AI assistant responses

## 🛡️ Error Handling

- Graceful network error handling
- Loading states for all async operations
- Toast notifications for user feedback
- Retry mechanisms for failed requests

## 📊 Performance

- Code splitting by route
- Lazy loading of components
- Optimized bundle size
- Efficient re-rendering with React Query

## 🤝 Contributing

This is a hackathon demo project. For the full UnityWallet ecosystem, see the main repository structure.

## 📄 License

Built for hackathon demonstration purposes.

---

**UnityWallet** - Transforming loyalty into digital wealth 🚀
