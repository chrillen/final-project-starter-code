// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'z6a7yehaf0'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-q5g1m94w.eu.auth0.com',            // Auth0 domain
  clientId: 'sSF7rMKDXX5BG6n8tnNRaqBmUaxHM3fn',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
