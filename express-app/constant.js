const KEYCLOAK_USERNAME = process.env.KEYCLOAK_USERNAME || 'admin';
const KEYCLOAK_PASSWORD = process.env.KEYCLOAK_PASSWORD || 'admin';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8081';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'master';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'hasura';

const USER_API_URL = `${KEYCLOAK_URL}/auth/admin/realms/${KEYCLOAK_REALM}/users`;
const GET_TOKEN_API_URL = `${KEYCLOAK_URL}/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const USER_INFO_API_URL = `${KEYCLOAK_URL}/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`;
const REALM_URL = `${KEYCLOAK_URL}/auth/admin/realms/${KEYCLOAK_REALM}`;

module.exports = {
  KEYCLOAK_USERNAME,
  KEYCLOAK_PASSWORD,
  KEYCLOAK_URL,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  USER_API_URL,
  GET_TOKEN_API_URL,
  USER_INFO_API_URL,
  REALM_URL,

  HASURA_API_URL: process.env.HASURA_API_URL || 'http://hasura:8080/v1/graphql',
};
