import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export class GoogleOAuthService {
  private client: OAuth2Client;
  private jwtSecret: string;

  constructor(config: GoogleOAuthConfig, jwtSecret: string) {
    this.client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
    this.jwtSecret = jwtSecret;
  }

  /**
   * Generate the Google OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    const url = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent'
    });
    return url;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.client.getToken(code);
    return tokens;
  }

  /**
   * Verify Google ID token and get user info
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.client._clientId
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || '',
      picture: payload.picture || '',
      verified_email: payload.email_verified || false
    };
  }

  /**
   * Get user info from access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    this.client.setCredentials({ access_token: accessToken });

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const data = await response.json() as GoogleUserInfo;
    return data;
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateJWT(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify and decode JWT token
   */
  verifyJWT(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; email: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    this.client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.client.refreshAccessToken();
    return credentials;
  }
}
