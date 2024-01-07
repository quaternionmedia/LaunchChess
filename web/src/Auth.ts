import m from 'mithril'
import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { readStream } from './ndJsonStream';

export const lichessHost = 'https://lichess.org';
// export const lichessHost = 'http://l.org';
export const scopes = ['board:play'];
export const clientId = 'launchchess-client';
export const clientUrl = `${location.protocol}//${location.host}${'/'}`;

export interface Me {
  id: string;
  username: string;
  httpClient: HttpClient; // with pre-set Authorization header
  perfs: { [key: string]: any };
}

export const Auth = (state, actions) => ({
  oauth: new OAuth2AuthCodePKCE({
    authorizationUrl: `${lichessHost}/oauth`,
    tokenUrl: `${lichessHost}/api/token`,
    clientId,
    scopes,
    redirectUrl: clientUrl,
    onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
    onInvalidGrant: console.warn,
  }),
  // me?: Me,

  init: async () => {
    try {
      const accessContext = await state.auth.oauth.getAccessToken();
      if (accessContext) await state.auth.authenticate();
    } catch (err) {
      console.error(err);
    }
    if (!state.loggedIn()) {
      try {
        const hasAuthCode = await state.auth.oauth.isReturningFromAuthServer();
        if (hasAuthCode) await state.auth.authenticate();
      } catch (err) {
        console.error(err);
      }
    }
  },

  login: async () => {
    await state.auth.oauth.fetchAuthorizationCode();
  },

  logout: async () => {
    if (state.loggedIn()) await state.user.httpClient(`${lichessHost}/api/token`, { method: 'DELETE' });
    localStorage.clear();
    state.user = {};
  },

  authenticate: async () => {
    const httpClient = state.auth.oauth.decorateFetchHTTPClient(window.fetch);
    const res = await httpClient(`${lichessHost}/api/account`);
    if (res.error) throw res.error;
    const profile = await res.json()
    const me = {
      username: profile.username,
      profile,
      httpClient,
    };
    state.user = me;
    state.loggedIn(true);
    localStorage.setItem('me', JSON.stringify(me));
    console.log('Authenticated as', me.username, actions);
    await actions.getGames()
    m.redraw();
  },

  openStream: async (path: string, config: any, handler: (_: any) => void) => {
    const stream = await state.auth.fetchResponse(path, config);
    return readStream(`STREAM ${path}`, stream, handler);
  },

  fetchBody: async (path: string, config: any = {}) => {
    const res = await state.auth.fetchResponse(path, config);
    const body = await res.json();
    return body;
  },

  fetchResponse: async (path: string, config: any = {}) => {
    const res = await (state.user.httpClient || window.fetch)(`${lichessHost}${path}`, config);
    if (res.error || !res.ok) {
      const err = `${res.error} ${res.status} ${res.statusText}`;
      alert(err);
      throw err;
    }
    return res;
  },
})
