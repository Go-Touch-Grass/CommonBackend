# CommonBackend

## Setup

1. `npm install`
2. Set up a Postgres database
3. Create a `.env` file in the root directory using `.env.example` as an example
4. Fill in the `.env` file variables according to how you set up your Postgres database
5. Use [this JWT Secret Generator](https://jwtsecret.com/generate) to generate a JWT secret and copy and paste the JWT secret at the `JWT_SECRET` variable in the `.env` file

## Running

1. `npm run dev`