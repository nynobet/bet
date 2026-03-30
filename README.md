# Agent Management System - Developer Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication System](#authentication-system)
5. [API Endpoints](#api-endpoints)
6. [Development Setup](#development-setup)
7. [Code Structure](#code-structure)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Security Considerations](#security-considerations)

## System Overview

The Agent Management System is a financial services platform built with Next.js 14, TypeScript, and Prisma. It enables agents to process deposits and withdrawals for users through mobile money services (bKash, Nagad, Rocket) while earning commissions.

### Key Features

- **Agent Dashboard**: Balance tracking, transaction history, commission management
- **Admin Portal**: Agent oversight, analytics, KYC management
- **Role-based Authentication**: Secure access control for agents and admins
- **Transaction Processing**: Deposit/withdrawal handling with commission calculation
- **Wallet Management**: Separate principal and commission balances

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT-based auth system
- **State Management**: React Context API

## Architecture

\`\`\`
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Frontend │ │ API Routes │ │ Database │
│ │ │ │ │ │
│ • Agent Portal │◄──►│ • Auth APIs │◄──►│ • Users │
│ • Admin Portal │ │ • Agent APIs │ │ • Agents │
│ • Auth Pages │ │ • Transaction │ │ • Transactions │
│ │ │ APIs │ │ • Wallets │
└─────────────────┘ └─────────────────┘ └─────────────────┘
\`\`\`

### Component Architecture

\`\`\`
app/
├── auth/ # Authentication pages
├── agent/ # Agent portal
├── admin/ # Admin portal
├── api/ # API routes
└── components/ # Shared components
├── auth-provider.tsx
├── protected-route.tsx
└── navigation.tsx
\`\`\`

## Database Schema

### Core Models

#### User

\`\`\`prisma
model User {
id String @id @default(cuid())
name String
username String @unique
email String @unique
phone String?
currency String? @default("BDT")
role UserRole @default(USER)
isActive Boolean @default(true)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations
wallet Wallet?
agentProfile AgentProfile?
transactions Transaction[]
}

enum UserRole {
USER
AGENT
ADMIN
}
\`\`\`

#### AgentProfile

\`\`\`prisma
model AgentProfile {
id String @id @default(cuid())
userId String @unique
depositBps Int @default(50) // Basis points for deposit commission
withdrawalBps Int @default(30) // Basis points for withdrawal commission
kycStatus KycStatus @default(PENDING)
isActive Boolean @default(true)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations
user User @relation(fields: [userId], references: [id])
agentWallet AgentWallet?
}

enum KycStatus {
PENDING
APPROVED
REJECTED
}
\`\`\`

#### AgentWallet

\`\`\`prisma
model AgentWallet {
id String @id @default(cuid())
agentProfileId String @unique
balance Decimal @default(0) // Principal balance
commissionBalance Decimal @default(0) // Commission earnings
status String @default("ACTIVE")
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations
agentProfile AgentProfile @relation(fields: [agentProfileId], references: [id])
}
\`\`\`

#### Transaction

\`\`\`prisma
model Transaction {
id String @id @default(cuid())
amount Decimal
type TransactionType
status TransactionStatus @default(PENDING)
channel Channel?
providerTxnId String?
idempotencyKey String? @unique
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

// Relations
userId String
agentId String?
user User @relation(fields: [userId], references: [id])
}

enum TransactionType {
DEPOSIT
WITHDRAWAL
TOP_UP
COMMISSION
}

enum TransactionStatus {
PENDING
COMPLETED
FAILED
}

enum Channel {
BKASH
NAGAD
ROCKET
}
\`\`\`

### Database Relationships

- **User** → **AgentProfile** (1:1, optional)
- **AgentProfile** → **AgentWallet** (1:1)
- **User** → **Transaction** (1:many)
- **User** → **Wallet** (1:1, for regular users)

## Authentication System

### Implementation Details

#### AuthProvider Context

\`\`\`typescript
interface AuthContextType {
user: User | null;
login: (email: string, password: string, role: 'agent' | 'admin') => Promise<void>;
logout: () => void;
loading: boolean;
}
\`\`\`

#### Protected Route Component

\`\`\`typescript
interface ProtectedRouteProps {
children: React.ReactNode;
requiredRole?: 'agent' | 'admin';
fallback?: React.ReactNode;
}
\`\`\`

### Demo Credentials

\`\`\`typescript
// For development/testing
const DEMO_CREDENTIALS = {
agent: {
email: 'agent@demo.com',
password: 'agent123',
role: 'agent'
},
admin: {
email: 'admin@demo.com',
password: 'admin123',
role: 'admin'
}
};
\`\`\`

### Session Management

- JWT tokens stored in localStorage
- Automatic token refresh on API calls
- Role-based route protection
- Session persistence across browser refreshes

## API Endpoints

### Authentication Routes

#### POST /api/auth/login

\`\`\`typescript
interface LoginRequest {
email: string;
password: string;
role: 'agent' | 'admin';
}

interface LoginResponse {
success: boolean;
user: {
id: string;
name: string;
email: string;
role: string;
isActive: boolean;
};
token: string;
}
\`\`\`

#### POST /api/auth/logout

\`\`\`typescript
interface LogoutResponse {
success: boolean;
message: string;
}
\`\`\`

### Agent Management Routes

#### GET /api/agents

\`\`\`typescript
interface GetAgentsQuery {
page?: number;
limit?: number;
status?: 'active' | 'inactive';
kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface GetAgentsResponse {
agents: AgentWithProfile[];
pagination: {
page: number;
limit: number;
total: number;
totalPages: number;
};
}
\`\`\`

#### GET /api/agents/[agentId]

\`\`\`typescript
interface AgentWithProfile {
id: string;
name: string;
username: string;
email: string;
phone?: string;
currency?: string;
isActive: boolean;
createdAt: Date;
updatedAt: Date;
wallet?: {
balance: number;
status: string;
} | null;
agentProfile?: {
depositBps: number;
withdrawalBps: number;
kycStatus: KycStatus;
isActive: boolean;
agentWallet: {
balance: number;
status: string;
} | null;
} | null;
}
\`\`\`

### Transaction Routes

#### POST /api/transactions/deposit

\`\`\`typescript
interface DepositRequest {
userId: string;
amount: number;
channel: 'BKASH' | 'NAGAD' | 'ROCKET';
providerTxnId: string;
idempotencyKey: string;
}

interface DepositResponse {
success: boolean;
transaction: {
id: string;
amount: number;
type: 'DEPOSIT';
status: 'COMPLETED';
commission: number;
createdAt: string;
};
}
\`\`\`

#### POST /api/transactions/withdrawal

\`\`\`typescript
interface WithdrawalRequest {
userId: string;
amount: number;
channel: 'BKASH' | 'NAGAD' | 'ROCKET';
providerTxnId: string;
idempotencyKey: string;
}
\`\`\`

### Wallet Routes

#### GET /api/wallet/balance

\`\`\`typescript
interface WalletBalanceResponse {
principalBalance: number;
commissionBalance: number;
status: string;
lastUpdated: string;
}
\`\`\`

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation Steps

1. **Clone Repository**
   \`\`\`bash
   git clone <repository-url>
   cd agent-management-system
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

Required environment variables:
\`\`\`env

# Database

DATABASE_URL="postgresql://username:password@localhost:5432/agent_system"

# JWT Secret

JWT_SECRET="your-super-secret-jwt-key"

# App URLs

NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Mobile Money Provider APIs (if integrating)

BKASH_API_KEY="your-bkash-api-key"
NAGAD_API_KEY="your-nagad-api-key"
ROCKET_API_KEY="your-rocket-api-key"
\`\`\`

4. **Database Setup**
   \`\`\`bash

# Generate Prisma client

npx prisma generate

# Run migrations

npx prisma migrate dev

# Seed database (optional)

npx prisma db seed
\`\`\`

5. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

### Development Commands

\`\`\`bash

# Start development server

npm run dev

# Build for production

npm run build

# Start production server

npm start

# Run database migrations

npx prisma migrate dev

# Reset database

npx prisma migrate reset

# View database in Prisma Studio

npx prisma studio

# Run tests

npm test

# Run linting

npm run lint

# Format code

npm run format
\`\`\`

## Code Structure

### Directory Organization

\`\`\`
agent-management-system/
├── app/ # Next.js app directory
│ ├── agent/ # Agent portal pages
│ │ └── dashboard/
│ ├── admin/ # Admin portal pages
│ │ └── agents/
│ ├── auth/ # Authentication pages
│ ├── api/ # API routes
│ │ ├── auth/
│ │ ├── agents/
│ │ ├── transactions/
│ │ └── wallet/
│ ├── globals.css # Global styles
│ ├── layout.tsx # Root layout
│ └── page.tsx # Home page
├── components/ # Shared components
│ ├── ui/ # shadcn/ui components
│ ├── auth-provider.tsx # Authentication context
│ ├── protected-route.tsx # Route protection
│ └── navigation.tsx # Navigation component
├── lib/ # Utility libraries
│ ├── auth.ts # Authentication utilities
│ ├── db.ts # Database connection
│ └── utils.ts # General utilities
├── prisma/ # Database schema and migrations
│ ├── schema.prisma
│ └── migrations/
├── types/ # TypeScript type definitions
│ ├── auth.ts
│ ├── agent.ts
│ └── transaction.ts
└── docs/ # Documentation
\`\`\`

### Key Components

#### AuthProvider

\`\`\`typescript
// components/auth-provider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);

// Authentication logic
const login = async (email: string, password: string, role: string) => {
// Implementation
};

const logout = () => {
// Implementation
};

return (
<AuthContext.Provider value={{ user, login, logout, loading }}>
{children}
</AuthContext.Provider>
);
}
\`\`\`

#### ProtectedRoute

\`\`\`typescript
// components/protected-route.tsx
export function ProtectedRoute({
children,
requiredRole,
fallback
}: ProtectedRouteProps) {
const { user, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <Navigate to="/auth/login" />;
if (requiredRole && user.role !== requiredRole) {
return fallback || <Navigate to="/unauthorized" />;
}

return <>{children}</>;
}
\`\`\`

### State Management Patterns

#### Context Usage

\`\`\`typescript
// Use authentication context
const { user, login, logout } = useAuth();

// Check user role
const isAgent = user?.role === 'agent';
const isAdmin = user?.role === 'admin';
\`\`\`

#### API Data Fetching

\`\`\`typescript
// Use React Query or SWR for data fetching
const { data: agents, error, isLoading } = useSWR('/api/agents', fetcher);
\`\`\`

## Deployment

### Production Build

\`\`\`bash

# Build the application

npm run build

# Start production server

npm start
\`\`\`

### Environment Variables (Production)

\`\`\`env

# Database (use connection pooling)

DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"

# Security

JWT_SECRET="production-jwt-secret-key"
NEXTAUTH_SECRET="production-nextauth-secret"

# URLs

NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Mobile Money APIs

BKASH_API_KEY="production-bkash-key"
NAGAD_API_KEY="production-nagad-key"
ROCKET_API_KEY="production-rocket-key"
\`\`\`

### Deployment Platforms

#### Vercel (Recommended)

\`\`\`bash

# Install Vercel CLI

npm i -g vercel

# Deploy

vercel --prod
\`\`\`

#### Docker Deployment

\`\`\`dockerfile

# Dockerfile

FROM node:18-alpine

WORKDIR /app
COPY package\*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Database Migration in Production

\`\`\`bash

# Run migrations

npx prisma migrate deploy

# Generate client

npx prisma generate
\`\`\`

## Testing

### Test Structure

\`\`\`
tests/
├── **mocks**/ # Mock files
├── components/ # Component tests
├── pages/ # Page tests
├── api/ # API route tests
└── utils/ # Utility tests
\`\`\`

### Testing Commands

\`\`\`bash

# Run all tests

npm test

# Run tests in watch mode

npm run test:watch

# Run tests with coverage

npm run test:coverage

# Run E2E tests

npm run test:e2e
\`\`\`

### Example Test

\`\`\`typescript
// tests/components/auth-provider.test.tsx
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/components/auth-provider';

describe('AuthProvider', () => {
it('provides authentication context', () => {
render(
<AuthProvider>

<div>Test Component</div>
</AuthProvider>
);

    expect(screen.getByText('Test Component')).toBeInTheDocument();

});
});
\`\`\`

## Security Considerations

### Authentication Security

- JWT tokens with expiration
- Role-based access control
- Protected API routes
- Input validation and sanitization

### Database Security

- Parameterized queries (Prisma handles this)
- Connection string encryption
- Database connection pooling
- Regular security updates

### API Security

\`\`\`typescript
// Middleware for API protection
export function withAuth(handler: NextApiHandler, requiredRole?: string) {
return async (req: NextApiRequest, res: NextApiResponse) => {
const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;

      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

};
}
\`\`\`

### Data Validation

\`\`\`typescript
// Use Zod for runtime validation
import { z } from 'zod';

const DepositSchema = z.object({
userId: z.string().cuid(),
amount: z.number().positive(),
channel: z.enum(['BKASH', 'NAGAD', 'ROCKET']),
providerTxnId: z.string().min(1),
idempotencyKey: z.string().uuid()
});
\`\`\`

### Rate Limiting

\`\`\`typescript
// Implement rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
windowMs: 15 _ 60 _ 1000, // 15 minutes
max: 100, // limit each IP to 100 requests per windowMs
message: 'Too many requests from this IP'
});
\`\`\`

## Performance Optimization

### Database Optimization

- Use database indexes on frequently queried fields
- Implement connection pooling
- Use read replicas for analytics queries
- Cache frequently accessed data

### Frontend Optimization

- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- Static generation for public pages
- Client-side caching with SWR/React Query

### Monitoring

- Set up error tracking (Sentry)
- Monitor API performance
- Database query monitoring
- User analytics

## Troubleshooting

### Common Issues

#### Database Connection Issues

\`\`\`bash

# Check database connection

npx prisma db pull

# Reset database if needed

npx prisma migrate reset
\`\`\`

#### Authentication Issues

- Verify JWT_SECRET is set
- Check token expiration
- Validate user roles

#### Build Issues

\`\`\`bash

# Clear Next.js cache

rm -rf .next

# Reinstall dependencies

rm -rf node_modules package-lock.json
npm install
\`\`\`

### Debug Mode

\`\`\`typescript
// Enable debug logging
console.log('[v0] User authentication:', user);
console.log('[v0] API request:', req.body);
\`\`\`

## Contributing

### Code Standards

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write tests for new features
- Document API changes

### Git Workflow

\`\`\`bash

# Create feature branch

git checkout -b feature/new-feature

# Make changes and commit

git add .
git commit -m "feat: add new feature"

# Push and create PR

git push origin feature/new-feature
\`\`\`

### Pull Request Guidelines

- Include tests for new features
- Update documentation
- Follow conventional commit messages
- Ensure CI passes

## Support

For technical support:

- Check this documentation first
- Review error logs and console output
- Test with demo credentials
- Contact the development team with specific error messages and steps to reproduce

---

**Last Updated**: January 2025
**Version**: 1.0.0

<!-- ts file code add -->

\`\`\`typescript
// verify-payment-action-new.ts
export async function verifyTransaction(data: {
transactionId: string;
trxId: string;
senderPhone: string;
currentAttempt?: number;
provider: Channel;
mobileBankingType: MobileBankingType;
agentNumber: string;
}): Promise<{
success: boolean;
message: string;
remainingAttempts?: number;
shouldCancel?: boolean;
details?: {
payerPhone?: string | null;
trxId?: string;
amount?: number;
};
}> {
const normalizedTrx = data.trxId.trim();
console.log('verifyTransaction--->', data);
try {
const transaction = await prisma.transaction.findUnique({
where: { id: data.transactionId },
include: {
wallet: true,
user: {
select: { id: true, name: true, username: true }
}
}
});

    if (!transaction) {
      return {
        success: false,
        message: 'Transaction not found. Please start over.'
      };
    }

    // Verify transaction type is DEPOSIT
    if (transaction.type !== TransactionType.DEPOSIT) {
      return {
        success: false,
        message:
          'Invalid transaction type. Only deposit transactions can be verified.'
      };
    }

    if (transaction.status === TransactionStatus.SUCCESS) {
      return {
        success: true,
        message: 'Payment already verified'
      };
    }

    if (transaction.status === TransactionStatus.CANCELLED) {
      return {
        success: false,
        message: 'This transaction has been cancelled.',
        shouldCancel: true
      };
    }

    const metadata = cloneTransactionMetadata(transaction.metadata);
    const attempts = Number(metadata.verificationAttempts ?? 0);
    const remainingBeforeAttempt = Math.max(
      0,
      MAX_VERIFICATION_ATTEMPTS - attempts
    );
    const accountNumber =
      (metadata.accountNumber as string | undefined) ?? data.agentNumber;

    if (!accountNumber) {
      return {
        success: false,
        message:
          'No agent account assigned for this transaction. Contact support.'
      };
    }

    if (!transaction.walletId) {
      return {
        success: false,
        message: 'Wallet not found for this transaction. Contact support.'
      };
    }

    if (!transaction.userId) {
      return {
        success: false,
        message: 'User not found for this transaction. Contact support.'
      };
    }

    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.CANCELLED,
          failureReason: 'Attempt limit reached',
          description:
            'Transaction cancelled automatically after verification attempts',
          metadata: {
            ...metadata,
            cancelReason: 'MAX_ATTEMPTS',
            lastAttemptAt: new Date().toISOString()
          }
        }
      });

      await prisma.transactionToken.updateMany({
        where: { transactionId: transaction.id, isUsed: false },
        data: { isUsed: true }
      });

      return {
        success: false,
        message: 'Maximum verification attempts exceeded.',
        shouldCancel: true
      };
    }

    // prevent duplicate trx usage across transactions
    const duplicateTrx = await prisma.transaction.findFirst({
      where: {
        providerTxnId: normalizedTrx,
        NOT: { id: transaction.id }
      }
    });

    if (duplicateTrx) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: 'This TRX ID has already been used.',
        normalizedTrx
      });

      return {
        success: false,
        message: 'This TRX ID has already been used in another deposit.',
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    const agentAccount = await prisma.agentPayoutAccount.findFirst({
      where: {
        accountNumber,
        provider: data.provider,
        mobileBankingType: data.mobileBankingType,
        isActive: true,
        isVerified: true
      },
      include: {
        agent: {
          include: {
            agentWallet: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (
      !agentAccount ||
      !agentAccount.agent ||
      !agentAccount.agent.agentWallet
    ) {
      return {
        success: false,
        message: 'No active agent found for this account. Contact support.'
      };
    }

    // Optimized SMS log query with strict provider and account matching
    const smsLog = await prisma.smsLog.findFirst({
      where: {
        detectedTrx: normalizedTrx,
        status: SmsLogStatus.PENDING,
        matchedPaymentId: null, // Not already matched to another transaction
        detectedMethod: data.provider, // Must match the provider (bKash/Nagad/Rocket)
        OR: [
          // Match by payout account ID (if SMS was linked to agent account)
          {
            payoutAccountId: agentAccount.id
          },
          // OR match by receiver number
          {
            detectedReceiver: accountNumber
          },
          // OR if payoutAccountId is null but receiver matches
          {
            AND: [
              { payoutAccountId: null },
              { detectedReceiver: accountNumber }
            ]
          }
        ]
      },
      orderBy: {
        receivedAt: 'desc'
      },
      include: {
        payoutAccount: {
          select: {
            id: true,
            provider: true,
            accountNumber: true
          }
        }
      }
    });

    if (!smsLog) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: `No SMS matching this TRX ID was found for ${data.provider} provider.`,
        normalizedTrx
      });

      return {
        success: false,
        message: `No SMS matching this TRX ID was found for ${data.provider}. Please ensure you're using the correct payment method.`,
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    // Additional validation: Verify SMS log provider matches
    if (smsLog.detectedMethod && smsLog.detectedMethod !== data.provider) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: `SMS provider (${smsLog.detectedMethod}) does not match transaction provider (${data.provider}).`,
        normalizedTrx
      });

      return {
        success: false,
        message: `Payment method mismatch. This TRX ID is for ${smsLog.detectedMethod}, but you selected ${data.provider}.`,
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    // Verify SMS log is not already matched (double-check for race condition)
    if (smsLog.matchedPaymentId && smsLog.matchedPaymentId !== transaction.id) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: 'This SMS has already been matched to another transaction.',
        normalizedTrx
      });

      return {
        success: false,
        message: 'This TRX ID has already been used in another deposit.',
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    // Verify payout account matches (if SMS was linked to an account)
    if (smsLog.payoutAccountId && smsLog.payoutAccountId !== agentAccount.id) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: 'SMS was received for a different agent account.',
        normalizedTrx
      });

      return {
        success: false,
        message:
          'This payment was sent to a different agent account. Please use the correct payment method.',
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    if (!smsLog.detectedAmount) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: 'SMS did not include an amount.',
        normalizedTrx
      });

      return {
        success: false,
        message: 'Unable to verify amount from SMS. Please try again.',
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    if (!smsLog.detectedAmount.equals(transaction.amount)) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: 'SMS amount does not match the deposit request.',
        normalizedTrx
      });

      return {
        success: false,
        message:
          'Amount mismatch. Please double-check the TRX ID and ensure the SMS matches this deposit.',
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    if (smsLog.detectedReceiver && smsLog.detectedReceiver !== accountNumber) {
      const failure = await recordFailedAttempt({
        transactionId: transaction.id,
        metadata,
        attempts,
        reason: 'SMS receiver does not match the assigned agent account.',
        normalizedTrx
      });

      return {
        success: false,
        message:
          'Receiver mismatch. Please ensure you sent money to the assigned number.',
        remainingAttempts: failure.remainingAttempts,
        shouldCancel: failure.shouldCancel
      };
    }

    const amountDecimal =
      transaction.amount instanceof Decimal
        ? transaction.amount
        : new Decimal(transaction.amount);

    const agentWallet = agentAccount.agent.agentWallet;

    // Verify currency matches
    if (transaction.currency !== agentWallet.currency) {
      return {
        success: false,
        message: `Currency mismatch. Transaction is in ${transaction.currency}, but agent wallet is in ${agentWallet.currency}.`
      };
    }

    // Check agent wallet balance (will be re-checked inside transaction for race condition)
    if (agentWallet.principalBalance.lt(amountDecimal)) {
      return {
        success: false,
        message:
          'Agent wallet does not have enough balance to settle this deposit. Please contact support.'
      };
    }

    const commissionRateDecimal = (agentAccount.agent.depositBps ?? 0) / 10000;
    const commissionRateBps = agentAccount.agent.depositBps ?? 0; // Store as basis points (Int)
    const commissionDecimal = amountDecimal.mul(commissionRateDecimal);
    const netPrincipalDebit = amountDecimal.sub(commissionDecimal);
    const verifiedAt = new Date();
    const payerPhone = smsLog.detectedPayer ?? data.senderPhone;

    const updatedMetadata: TransactionMetadata = {
      ...metadata,
      accountNumber,
      verificationAttempts: attempts,
      verifiedAt: verifiedAt.toISOString(),
      verifiedTrxId: normalizedTrx,
      payerPhone,
      smsLogId: smsLog.id
    };
    const smsMetadata = cloneTransactionMetadata(smsLog.metadata ?? null);

    let settledDepositId: string | null = null;
    let settledDepositUserId: string | null = null;
    let settledDepositAmount: Decimal | null = null;
    let settledDepositCurrency: Currency | null = null;

    // Increase transaction timeout to 15 seconds to handle all operations
    await prisma.$transaction(
      async (tx) => {
        await tx.wallet.update({
          where: { id: transaction.walletId! },
          data: {
            balance: { increment: amountDecimal },
            totalDeposited: { increment: amountDecimal },
            lastActivity: verifiedAt
          }
        });

        // Re-check agent wallet balance inside transaction to prevent race condition
        const currentAgentWallet = await tx.agentWallet.findUnique({
          where: { id: agentWallet.id },
          select: { principalBalance: true, currency: true }
        });

        if (!currentAgentWallet) {
          throw new Error('Agent wallet not found.');
        }

        if (currentAgentWallet.currency !== transaction.currency) {
          throw new Error('Currency mismatch detected during transaction.');
        }

        if (currentAgentWallet.principalBalance.lt(amountDecimal)) {
          throw new Error(
            'Agent wallet does not have enough balance. Please contact support.'
          );
        }

        await tx.agentWallet.update({
          where: { id: agentWallet.id },
          data: {
            principalBalance: { decrement: netPrincipalDebit },
            commissionBalance: { increment: commissionDecimal },
            lastActivity: verifiedAt
          }
        });

        // Update SMS log with optimistic locking to prevent race conditions
        // Only update if still PENDING and not matched to another transaction
        const updatedSmsLog = await tx.smsLog.updateMany({
          where: {
            id: smsLog.id,
            status: SmsLogStatus.PENDING,
            matchedPaymentId: null // Double-check it's not already matched
          },
          data: {
            status: SmsLogStatus.SUCCESS,
            transactionId: transaction.id,
            matchedPaymentId: transaction.id,
            processedAt: verifiedAt,
            metadata: {
              ...smsMetadata,
              verifiedAt: verifiedAt.toISOString(),
              verifier: 'AUTO_PAYMENT_FLOW',
              verifiedProvider: data.provider,
              verifiedAccountId: agentAccount.id
            }
          }
        });

        // If SMS log was already matched by another transaction, rollback
        if (updatedSmsLog.count === 0) {
          throw new Error(
            'SMS log was already matched to another transaction. Please try again.'
          );
        }

        const settledDeposit = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.SUCCESS,
            processedAt: verifiedAt,
            providerTxnId: normalizedTrx,
            agentId: agentAccount.agentId,
            channel: data.provider,
            description: `Deposit verified via ${data.provider}`,
            failureReason: null,
            metadata: updatedMetadata
          }
        });

        // Store values outside transaction for bonus creation
        settledDepositId = settledDeposit.id;
        settledDepositUserId = settledDeposit.userId;
        settledDepositAmount = settledDeposit.amount;
        settledDepositCurrency = settledDeposit.currency;

        await tx.transactionToken.updateMany({
          where: { transactionId: transaction.id, isUsed: false },
          data: { isUsed: true }
        });

        await tx.transaction.create({
          data: {
            type: TransactionType.AGENT_FUND_TRANSFER,
            status: TransactionStatus.SUCCESS,
            agentId: agentAccount.agentId,
            amount: amountDecimal,
            netAmount: netPrincipalDebit,
            fee: commissionDecimal,
            currency: transaction.currency,
            channel: data.provider,
            parentTransactionId: transaction.id,
            trxId: generateTransactionId(TransactionType.AGENT_FUND_TRANSFER),
            referenceId: normalizedTrx,
            commissionRate: commissionRateBps, // Store as basis points (Int)
            commissionAmount: commissionDecimal,
            description: `Auto deposit settlement for ${transaction.user?.username || transaction.userId}`,
            processedAt: verifiedAt,
            metadata: {
              smsLogId: smsLog.id,
              payerPhone
            }
          }
        });

        await ensureTurnoverRequirementForDeposit({
          tx,
          deposit: {
            id: settledDeposit.id,
            userId: settledDeposit.userId,
            amount: settledDeposit.amount,
            currency: settledDeposit.currency
          }
        });

        if (!commissionDecimal.isZero()) {
          await tx.transaction.create({
            data: {
              type: TransactionType.AGENT_COMMISSION,
              status: TransactionStatus.SUCCESS,
              agentId: agentAccount.agentId,
              amount: commissionDecimal,
              netAmount: commissionDecimal,
              currency: transaction.currency,
              channel: Channel.SYSTEM,
              parentTransactionId: transaction.id,
              trxId: generateTransactionId(TransactionType.AGENT_COMMISSION),
              referenceId: normalizedTrx,
              description: `Commission earned for deposit ${transaction.id}`,
              processedAt: verifiedAt,
              metadata: {
                smsLogId: smsLog.id,
                payerPhone
              }
            }
          });
        }
      },
      {
        maxWait: 15000, // Maximum time to wait for a transaction slot
        timeout: 15000 // Maximum time the transaction can run
      }
    );

    // Trigger first deposit bonus if this is the user's first deposit (outside transaction)
    if (
      settledDepositUserId &&
      settledDepositAmount &&
      settledDepositCurrency &&
      settledDepositId
    ) {
      try {
        const { maybeCreateFirstDepositBonusForDeposit } = await import(
          './bonus.actions'
        );
        await maybeCreateFirstDepositBonusForDeposit({
          userId: settledDepositUserId,
          amount: settledDepositAmount,
          currency: settledDepositCurrency,
          depositTransactionId: settledDepositId
        });
      } catch (error) {
        // Log but don't fail the transaction if bonus creation fails
        console.error('Failed to create first deposit bonus:', error);
      }
    }

    return {
      success: true,
      message: 'Payment verified successfully.',
      remainingAttempts: remainingBeforeAttempt,
      details: {
        payerPhone,
        trxId: normalizedTrx,
        amount: amountDecimal.toNumber()
      }
    };

} catch (error) {
console.error('verifyTransaction error:', error);
return {
success: false,
message: 'Verification failed. Please try again.'
};
}
}
\`\`\`
