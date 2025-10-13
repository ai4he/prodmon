#!/usr/bin/env python3
"""
Script to create OAuth 2.0 credentials for Productivity Monkey
using Google Cloud REST API
"""

import subprocess
import json
import requests

def get_access_token():
    """Get access token from gcloud"""
    result = subprocess.run(
        ['gcloud', 'auth', 'print-access-token'],
        capture_output=True,
        text=True,
        check=True
    )
    return result.stdout.strip()

def create_oauth_client():
    """Create OAuth 2.0 Web Application credentials"""
    project_id = "haie-454813"
    project_number = "337048330114"

    access_token = get_access_token()

    # API endpoint for creating OAuth clients
    # Note: This uses the undocumented clientsecrets API
    url = f"https://www.googleapis.com/oauth2/v2/userinfo"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Create web application OAuth client
    payload = {
        "displayName": "Productivity Monkey Server",
        "description": "OAuth client for Productivity Monkey authentication",
        "redirectUris": [
            "https://prodmon.haielab.org/auth/google/callback"
        ],
        "applicationType": "WEB"
    }

    print("Creating OAuth 2.0 credentials...")
    print(f"Project: {project_id}")
    print(f"Redirect URI: https://prodmon.haielab.org/auth/google/callback")
    print()

    # Unfortunately, Google doesn't provide a public REST API endpoint
    # for creating OAuth web clients programmatically
    # The Cloud Console uses internal APIs that are not publicly documented

    print("⚠️  Google Cloud doesn't provide a public API to create OAuth web clients.")
    print("You need to create the credentials manually via Cloud Console:")
    print()
    print(f"🔗 https://console.cloud.google.com/apis/credentials?project={project_id}")
    print()
    print("Configuration:")
    print("  - Type: OAuth client ID")
    print("  - Application type: Web application")
    print("  - Name: Productivity Monkey Server")
    print("  - Authorized redirect URIs: https://prodmon.haielab.org/auth/google/callback")
    print()
    print("After creating, paste the Client ID and Client Secret below:")
    print()

    # Prompt for manual entry
    client_id = input("Enter Client ID: ").strip()
    client_secret = input("Enter Client Secret: ").strip()

    if client_id and client_secret:
        return client_id, client_secret
    else:
        print("Error: Client ID and Secret are required")
        return None, None

def create_env_file(client_id, client_secret):
    """Create .env file with OAuth credentials"""

    # Generate a random JWT secret
    import secrets
    jwt_secret = secrets.token_urlsafe(32)

    env_content = f"""# Server Configuration
PORT=3000
DB_PATH=./prodmon-server.db

# Google OAuth Configuration
GOOGLE_CLIENT_ID={client_id}
GOOGLE_CLIENT_SECRET={client_secret}
GOOGLE_REDIRECT_URI=https://prodmon.haielab.org/auth/google/callback

# JWT Secret
JWT_SECRET={jwt_secret}

# Gemini API Key (optional, for AI insights)
# GEMINI_API_KEY=your-gemini-api-key
"""

    with open('.env', 'w') as f:
        f.write(env_content)

    print("✅ .env file created successfully!")
    print()
    print("Configuration saved:")
    print(f"  - Client ID: {client_id[:20]}...")
    print(f"  - Client Secret: {'*' * 20}")
    print(f"  - Redirect URI: https://prodmon.haielab.org/auth/google/callback")
    print(f"  - JWT Secret: Generated")

if __name__ == "__main__":
    print("=" * 60)
    print("Productivity Monkey OAuth Setup")
    print("=" * 60)
    print()

    client_id, client_secret = create_oauth_client()

    if client_id and client_secret:
        create_env_file(client_id, client_secret)
        print()
        print("✅ Setup complete! You can now start the server:")
        print("   npm run build:server && npm run server")
    else:
        print("Setup incomplete. Please run the script again.")
