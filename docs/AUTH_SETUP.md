# Google OAuth Authentication Setup

Productivity Monkey now supports Google OAuth authentication for secure sign-in and sign-up.

## Features

- **Google Sign-In**: One-click authentication with Google accounts
- **Secure JWT Tokens**: 7-day expiration with automatic refresh
- **Session Management**: HTTP-only cookies for enhanced security
- **Profile Management**: Automatic profile sync with Google
- **Multi-platform Support**: Works in both web and Electron environments

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - Application name: "Productivity Monkey"
   - Scopes: email, profile
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback`
     - `https://yourdomain.com/auth/google/callback` (for production)
7. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your Google OAuth credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-min-32-chars

# Server Configuration
PORT=3000
DB_PATH=./prodmon-server.db

# Optional: Gemini API for AI insights
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Generate a Secure JWT Secret

Generate a random JWT secret:

```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and set it as `JWT_SECRET` in your `.env` file.

### 4. Start the Server

```bash
# Install dependencies (if not already done)
npm install

# Build TypeScript
npm run build

# Start the server
npm run server
```

The server should show:
```
✓ Database initialized
✓ OAuth service initialized
✓ Services initialized successfully
```

### 5. Access the Authentication Page

Open your browser and navigate to:
- **Sign In Page**: `http://localhost:3000/auth.html`
- **Dashboard**: `http://localhost:3000/dashboard.html` (requires authentication)

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google/url` | Get Google OAuth authorization URL |
| GET | `/auth/google/callback` | Google OAuth callback handler |
| POST | `/auth/google/exchange` | Exchange auth code for JWT token |
| GET | `/auth/verify` | Verify JWT token validity |
| POST | `/auth/signout` | Sign out and clear session |
| GET | `/auth/me` | Get current authenticated user |

### Protected Endpoints

To access protected endpoints, include the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/users
```

Or the token will be automatically included in cookies after sign-in.

## Security Features

### JWT Tokens

- **Expiration**: 7 days
- **Algorithm**: HS256
- **Payload**: `{ userId, email, iat, exp }`

### HTTP-Only Cookies

- Prevents XSS attacks
- Secure flag in production
- 7-day expiration
- Automatic renewal

### Session Management

- Express session middleware
- Session store in memory (can be upgraded to Redis)
- Automatic cleanup of expired sessions

## Electron Integration

The authentication flow works seamlessly in Electron:

1. User clicks "Sign In" in the Electron app
2. Opens a BrowserWindow with the auth page
3. User completes Google OAuth
4. JWT token is stored in electron-store
5. Main window loads with authenticated session

Example Electron integration:

```typescript
// In main.ts
const authWindow = new BrowserWindow({
  width: 500,
  height: 700,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
});

authWindow.loadURL('http://localhost:3000/auth.html');

// Listen for auth success
authWindow.webContents.on('did-navigate', (event, url) => {
  if (url.includes('success=true')) {
    // Extract token and store it
    authWindow.close();
    showDashboard();
  }
});
```

## Troubleshooting

### "OAuth not configured" Error

- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the server after changing environment variables

### "Redirect URI mismatch" Error

- Verify the redirect URI in Google Cloud Console matches exactly
- Check `GOOGLE_REDIRECT_URI` in `.env` matches the configured value
- Ensure no trailing slashes

### Token Verification Fails

- Check that `JWT_SECRET` is consistent across restarts
- Ensure the token hasn't expired (7-day limit)
- Clear cookies and sign in again

### CORS Issues

- Server is configured with `credentials: true` for cookies
- Client must send requests with `credentials: 'include'`

## Production Deployment

For production deployment:

1. **Use HTTPS**: OAuth requires secure connections
2. **Update Redirect URIs**: Add production URLs to Google Cloud Console
3. **Environment Variables**: Use secure secret management
4. **Session Store**: Use Redis or database-backed sessions
5. **Rate Limiting**: Add rate limiting to auth endpoints

Example production `.env`:

```env
NODE_ENV=production
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
JWT_SECRET=<secure-random-key>
```

## Database Schema

The authentication system adds these fields to the `users` table:

```sql
google_id TEXT UNIQUE       -- Google user ID
profile_picture TEXT        -- Google profile picture URL
last_login INTEGER          -- Timestamp of last login
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/ai4he/prodmon/issues
- Documentation: https://github.com/ai4he/prodmon/wiki
