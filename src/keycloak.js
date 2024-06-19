import Keycloak from 'keycloak-js';

// Configuration for Keycloak initialization
const keycloakConfig = {
  url: 'http://localhost:8180', // Keycloak server URL
  realm: 'RGZ',                 // The realm you created
  clientId: 'rgz-iso-chatbot-local',  // The client ID you configured
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
