const fetch = require('node-fetch');
const axios = require('axios');

const {
  getKeycloakToken,
  updateRoles,
  createKeycloakAccount,
  getKeycloakUserByEmail,
} = require('../services/keycloak');
const { createUser } = require('../services/hasura');

module.exports = {
  signUp: async (req, res) => {
    try {
      const { input: item } = req.body;

      // Create Keycloak account by using admin credentials
      const admin_user = process.env.KEYCLOAK_USER || 'admin';
      const admin_password = process.env.KEYCLOAK_PASSWORD || 'admin';
      const { accessToken: adminAccessToken } = await getKeycloakToken(
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

      // Set user roles
      await updateRoles(
        adminAccessToken,
        newKeycloakUser.id,
        item.roles || 'user'
      );

      // Create Hasura account
      const newUser = await createUser(item);
      return res.json({ status: 200, message: 'SUCCESS', data: newUser });
    } catch (error) {
      return res
        .status(400)
        .json({ status: 400, message: error.message, data: {} });
    }
  },
};
