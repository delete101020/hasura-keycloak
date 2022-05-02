const axios = require('axios');
const fetch = require('node-fetch');
const {
  GET_TOKEN_API_URL,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_URL,
  KEYCLOAK_REALM,
  USER_API_URL,
} = require('../constant');

const getKeycloakToken = async (username, password) => {
  try {
    const requestDetails = {
      username,
      password,
      grant_type: 'password',
      client_id: KEYCLOAK_CLIENT_ID,
    };

    let formBody = [];
    for (const property in requestDetails) {
      const encodedKey = encodeURIComponent(property);
      const encodedValue = encodeURIComponent(requestDetails[property]);
      formBody.push(`${encodedKey}=${encodedValue}`);
    }
    formBody = formBody.join('&');
    const getTokenConfig = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: formBody,
    };

    const getTokenFetch = await fetch(GET_TOKEN_API_URL, getTokenConfig);
    const result = await getTokenFetch.json();
    if (result.error) throw new Error(result.error_description);

    const { access_token, refresh_token, session_state } = result;
    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      sessionState: session_state,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getClient = async (adminToken, clientId) => {
  try {
    const url = `${KEYCLOAK_URL}/auth/admin/realms/${KEYCLOAK_REALM}/clients`;
    const { data: clients } = await axios({
      url,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    return clients.filter((client) => client.clientId === clientId);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getClientRoles = async (adminToken, clientId) => {
  try {
    const url = `${KEYCLOAK_URL}/auth/admin/realms/${KEYCLOAK_REALM}/clients/${clientId}/roles`;

    const { data: roles } = await axios({
      url,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    return roles;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const checkRole = async (adminToken, role) => {
  try {
    const keycloakClient = KEYCLOAK_CLIENT_ID;
    const clientRoles = await getClientRoles(adminToken, keycloakClient);
    const userRoles = clientRoles.filter(
      (clientRole) => clientRole.name === role
    );

    return !!userRoles.length;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const updateRoles = async (adminToken, userId, role) => {
  try {
    const client = await getClient(adminToken, KEYCLOAK_CLIENT_ID);
    const clientId = client[0].id;

    const roles = await getClientRoles(adminToken, clientId);
    console.log(roles);
    console.log(role);
    const roleId = roles.filter((clientRole) => clientRole.name === role)[0];

    const url = `${KEYCLOAK_URL}/auth/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/clients/${clientId}`;
    await axios({
      url,
      method: 'POST',
      data: [roleId],
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  } catch (error) {
    throw error;
  }
};

const createKeycloakAccount = async (adminToken, user) => {
  try {
    const { username, email, password, role } = user;

    const userData = {
      username,
      email,
      enabled: true,
      origin: 'web-api',
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    };
    const createUserConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    };
    const createdUserResult = await fetch(USER_API_URL, createUserConfig);
    console.log(createdUserResult);
    if (createdUserResult.status === 201 || createdUserResult.status === 409) {
      return true;
    }

    const result = await createdUserResult.json();
    if (result.error) throw new Error(result.error_description);

    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getKeycloakUserByEmail = async (adminToken, email) => {
  try {
    const getUserConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    };
    const getUserResult = await fetch(
      `${USER_API_URL}/?email=${encodeURIComponent(email)}`,
      getUserConfig
    );
    const result = await getUserResult.json();
    if (result.error) throw new Error(result.error_description);

    return result.filter((user) => user.email === email);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  getKeycloakToken,
  getClientRoles,
  checkRole,
  updateRoles,
  createKeycloakAccount,
  getKeycloakUserByEmail,
};
