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

2.3 Reduce JWT payload size: Client Scopes > Default Client Scopes > Remove all scopes under "Assigned Default Client Scopes" and "Assigned Optional Client Scopes"

---

2.4 Create Keycloak client (for FE): Clients > Create > Client ID: Enter `hasura`

- Create roles: Clients > hasura > Roles > Add role > Enter `user`. Do similar steps for `admin` role.

---

2.5 Assign default user to `admin` role: Users > View all users > Click on admin user > Role Mappings > Client Roles: Select `hasura` > Select `admin` > Click "Add selected"

---

2.6 Create Mapper: Clients > `hasura` > Mappers > Create:

- x-hasura-user-id:

  - Name: `x-hasura-user-id`
  - Mapper Type: `User Property`
  - Property: `id`
  - Token Claim Name: `https://hasura\.io/jwt/claims.x-hasura-user-id`
  - Claim JSON Type: `String`

- default role:

  - Name: `x-hasura-default-role`
  - Mapper Type: `Hardcoded claim`
  - Token Claim Name: `https://hasura\.io/jwt/claims.x-hasura-default-role`
  - Client value: `user`
  - Claim JSON Type: `String`

- x-hasura-allowed-roles:

  - Name: `x-hasura-allowed-roles`
  - Mapper Type: `User Client Role`
  - Client ID: `hasura`
  - Multivalued: `ON`
  - Token Claim Name: `https://hasura\.io/jwt/claims.x-hasura-allowed-roles`
  - Claim JSON Type: `String`

---

2.7 Claim Keycloak JWT token:

`curl --request POST --url http://localhost:8081/auth/realms/master/protocol/openid-connect/token --header 'Content-Type: application/x-www-form-urlencoded' --data username=admin --data password=admin --data grant_type=password --data client_id=hasura`

2.9 Create roles for `hasura`

Note: These roles are matching roles in Hasura. For example, we have `admin`, `moderator`, `user` in Hasura, we will create all of them here.

Clients > `hasura-keycloak-connector` > Roles > Add role

## 3. Start Hasura

Run command `docker-compose -d --build`

Go to console: <http://localhost:8080/console/login>

Login with HASURA_GRAPHQL_ADMIN_SECRET

## 4. Set up migrations

Follow here: <https://hasura.io/docs/latest/graphql/core/migrations/migrations-setup/>

Export current migrations and metadata:

`hasura migrate create "init" --from-server --database-name default`

`hasura metadata export --admin-secret admin`

## 5. Create sample table

Note: Must start Hasura by command `hasura console --admin-secret admin`, otherwise, migrations and metadata won't be generated

- Create table `sample`

- Check `my-project` > `migrations` > `default`, new migration is created.

## 6. Add permissions for table `sample`

By default, `admin` (Hasura admin) will have all permissions.

We will add role `user` with SELECT permissions, create an user in Keycloak manually (for test only).

<https://stackoverflow.com/questions/67071458/handle-different-roles-in-hasura>

## 7. Create Express app for custom queries/mutations
