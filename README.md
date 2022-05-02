# Hasura - Keycloak

## 1. Start Keycloak

Run command `docker-compose -f .\docker-compose-keycloak.yml up -d --build`

If there is any issue with Keycloak, check connection to Keycloak DB, make sure you can connect to it with credentials in Keycloak environment variables.

## 2. Configure Keycloak

2.1 Go to Keycloak management console: <http://localhost:8081>

- Access to "Administrator Console"

- Login with credentials in docker-compose: KEYCLOAK_USER / KEYCLOAK_PASSWORD

---

2.2 Change the token life span: Realm Settings > Tokens > Access Token Lifespan > `1 Hours` > SAVE
Change SSO Session Idle

---

2.3 Create Keycloak client (for FE): Clients > Create > Client ID: Enter `hasura`

- Create roles: Clients > hasura > Roles > Add role > Enter `user`. Do similar steps for `admin` role.

---

2.4 Assign default user to `admin` role: Users > View all users > Click on admin user > Role Mappings > Client Roles: Select `hasura` > Select `admin` > Click "Add selected"

---

2.5 Create Mapper: Clients > `hasura` > Mappers > Create:

- x-hasura-user-id:

  - Name: `x-hasura-user-id`
  - Mapper Type: `User Property`
  - Property: `id`
  - Token Claim Name: `https://hasura\.io/jwt/claims.x-hasura-user-id`
  - Claim JSON Type: `String`

![x-hasura-user-id](/images/x-hasura-user-id.png)

- default role:

  - Name: `x-hasura-default-role`
  - Mapper Type: `Hardcoded claim`
  - Token Claim Name: `https://hasura\.io/jwt/claims.x-hasura-default-role`
  - Client value: `user`
  - Claim JSON Type: `String`

![x-hasura-default-role](/images/x-hasura-default-role.png)

- x-hasura-allowed-roles:

  - Name: `x-hasura-allowed-roles`
  - Mapper Type: `User Client Role`
  - Client ID: `hasura`
  - Multivalued: `ON`
  - Token Claim Name: `https://hasura\.io/jwt/claims.x-hasura-allowed-roles`
  - Claim JSON Type: `String`

![x-hasura-allowed-roles](/images/x-hasura-allowed-roles.png)

---

2.6 Create roles for `hasura`

Note: These roles are matching roles in Hasura. For example, we have `admin`, `moderator`, `user` in Hasura, we will create all of them here.

Clients > `hasura` > Roles > Add role

2.7 Get the Public Key

Realm Settings > Keys > Active. Click on the "Public Key" Button in the row with the Algorithm RS256.
Inside the docker-compose.yml, replace the HASURA_GRAPHQL_JWT_SECRET with a line similar to the following:
`HASURA_GRAPHQL_JWT_SECRET: '{"type": "RS256", "key": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}'`
Replace the ... with the Key you just copied.

## 3. Start Hasura and Express app

Run command `docker-compose -d --build`

Go to console: <http://localhost:8080/console/login>

Login with HASURA_GRAPHQL_ADMIN_SECRET

## 4. Set up migrations

Follow here: <https://hasura.io/docs/latest/graphql/core/migrations/migrations-setup/>

Export current migrations and metadata:

`hasura migrate create "init" --from-server --database-name default --admin-secret admin`

`hasura metadata export --admin-secret admin`

## 5. Create sample table

Note: Must start Hasura by command `hasura console --admin-secret admin`, otherwise, migrations and metadata won't be generated

- Create table `sample`

![Sample table](/images/sample_table.png)

- Check `my-project` > `migrations` > `default`, new migration is created.

## 6. Restrict access to for table `sample`

By default, `admin` (Hasura admin) will have all permissions.

- User can select fields: id / key / value

![Sample user permission](/images/sample_user_permission.png)

- Anonymous can select only key

![Sample anonymous permission](/images/sample_anonymous_permission.png)

<https://stackoverflow.com/questions/67071458/handle-different-roles-in-hasura>

## 7. User flow - Postman

- User sign up: Auth > Signup

- User get access token: Auth > Get token

- Query `sample` table with token: Auth > Query (User).

- Query `sample` table without token > Query (anonymous)

Note: When query with access token, must specify which role user is querying with header `X-Hasura-Role`
