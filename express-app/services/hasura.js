const fetch = require('node-fetch');
const { HASURA_API_URL } = require('../constant');

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

    const hasuraResult = await fetch(HASURA_API_URL, options);
    const result = await hasuraResult.json();
    if (result.errors) throw new Error(result.errors[0].message);

    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const createUser = async (user) => {
  try {
    const { email, username, first_name, last_name } = user;
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
    const createUserResult = await handle_hasura(
      { email, username, first_name, last_name },
      createUserMutation
    );
    console.log(createUserResult);
    const {
      data: { insert_users_one: createdUser },
    } = createUserResult;
    return createdUser;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = { createUser };
