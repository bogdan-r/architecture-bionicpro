import React from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import Keycloak, { KeycloakConfig } from 'keycloak-js';
import ReportPage from './components/ReportPage';
import { generateCodeVerifier, generateCodeChallenge, storePKCEParams, clearPKCEParams } from './utils/pkce';

const keycloakConfig: KeycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL,
  realm: process.env.REACT_APP_KEYCLOAK_REALM||"",
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID||""
};

const keycloak = new Keycloak(keycloakConfig);

// Custom init options for PKCE
const initOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256',
  checkLoginIframe: false
};

// Custom event handlers
const eventLogger = (event: unknown, error: unknown) => {
  console.log('onKeycloakEvent', event, error);
};

const tokenLogger = (tokens: unknown) => {
  console.log('onKeycloakTokens', tokens);
};

const App: React.FC = () => {
  return (
    <ReactKeycloakProvider 
      authClient={keycloak}
      initOptions={initOptions}
      onEvent={eventLogger}
      onTokens={tokenLogger}
    >
      <div className="App">
        <ReportPage />
      </div>
    </ReactKeycloakProvider>
  );
};

export default App;