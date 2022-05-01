const fetch = require('node-fetch');
const axios = require('axios');

// TODO: move to Keycloak service
const getToken = async (username, password) => {
  try {
    const requestDetails = {
      username,
      password,
      grant_type: 'password',
      client_id: 'hasura',
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

    const getTokenFetch = await fetch(
      `${process.env.KEYCLOAK_URL || 'keycloak:8443'}/auth/realms/${
        process.env.KEYCLOAK_REALM || 'master'
      }/protocol/openid-connect/token`,
      getTokenConfig
    );
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

// TODO: move to Keycloak service
const getClientRoles = async (adminToken, clientId) => {
  try {
    const url = `${
      process.env.KEYCLOAK_URL || 'keycloak:8080'
    }/auth/admin/realms/${
      process.env.KEYCLOAK_REALM || 'master'
    }/clients/${client_id}/roles`;

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

// TODO: move to Keycloak service
const checkRole = async (adminToken, role) => {
  try {
    const keycloakClient = process.env.KEYCLOAK_CLIENT || 'hasura';
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

// TODO: move to Keycloak service
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
    if (createdUserResult.status === 201) {
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

// TODO: move to Keycloak service
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
      `${process.env.KEYCLOAK_URL || 'keycloak:8080'}/auth/admin/realms/${
        process.env.KEYCLOAK_REALM || 'master'
      }/users/?email=${encodeURIComponent(email)}`,
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

// TODO: move to Hasura service
const handle_hasura = async (variables, query) => {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || 'admin',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    };

    const hasuraResult = await fetch(
      process.env.HASURA_API_URL || 'http://localhost:8080/v1/graphql',
      options
    );
    const result = await hasuraResult.json();
    if (result.error) throw new Error(result.error_description);

    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const createUser = async (user) => {
  try {
    const createUserMutation = `
      mutation CreateUser($email: String!, $username: String!, $first_name: String, $last_name: String) {
        insert_users_one(object: {email: $email, username: $username, first_name: $first_name, last_name: $last_name}) {
          id
          email
          first_name
          last_name
          updated_at
          username
          created_at
        }
      }
    `;
    const createUserResult = await handle_hasura(user, createUserMutation);

    const {
      data: { insert_users_one: createdUser },
    } = createUserResult;
    return createdUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  signUp: async (req, res) => {
    try {
      const { input: item } = req.body;

      // Create Keycloak account by using admin credentials
      const admin_user = process.env.KEYCLOAK_USER || 'admin';
      const admin_password = process.env.KEYCLOAK_PASSWORD || 'admin';
      const { accessToken: adminAccessToken } = await getToken(
        admin_user,
        admin_password
      );
      await createKeycloakAccount(adminAccessToken, item);

      // Get Keycloak account by using admin credentials
      const [newKeycloakUser] = await getKeycloakUserByEmail(
        adminAccessToken,
        item.email
      );
      if (!newKeycloakUser) throw new Error('User not found');

      // Create Hasura account
      const newUser = await createUser(newUser);
      return res.json({ status: 200, message: 'SUCCESS', data: newUser });
    } catch (error) {
      console.log(error);
      return res
        .status(400)
        .json({ status: 400, message: error.message, data: {} });
    }
  },
};
