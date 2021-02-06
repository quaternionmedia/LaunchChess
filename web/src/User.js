import m from 'mithril'
import jwt_decode from 'jwt-decode'

export function auth(url, opts) {
  const req = new Promise((resolve, reject) => {
      m.request(url, {
        headers: {
          Authorization: User.token.token_type + ' ' + User.token.access_token,
        },
        ...opts
      }).then(res => {
        console.log('auth success')
        resolve(res)
        // return res
      }).catch( e => {
        if (e.code == 401) {
          m.request('/refresh', {
            method: 'post'
        }).then(token => {
            User.login(token)
            auth(url, opts).then(res => {
              console.log('resolved refresh')
              resolve(res)
            })
          }).catch(err => {
            console.log('error making auth request', url, opts, err)
            error('Not authorized')
            m.route.set('/login', {
                redirect: m.route.get()
              })
            reject(err)
          })
        }
      })
    })
    return req
}

export var User = {
  username: null,
  token: null,
  loggedIn: false,
  profile: null,
  login: (token) => {
    User.token = token
    User.loggedIn = true
    console.log('logged in as: ', User)
    if (m.route.param('redirect')) {
      m.route.set(m.route.param('redirect'))
    } else if (m.route.get() == '/login') {
      m.route.set('/')
    } else {
      // m.route.set(m.route.get())
      m.route.set('/')
    }
    m.redraw()
    auth('/oauth/profile').then(res => {
      console.log('profile', res)
      User.profile = res
      User.username = res.username
    })
  },
  logout: () => {
    console.log('logging out', User)
    m.request('/logout', {method: 'post'})
    m.request('/oauth/logout')
    User.username = null
    User.token = null
    User.loggedIn = false
    window.localStorage.setItem('CREDENTIALS_FLUSH', Date.now().toString())
    window.localStorage.removeItem('CREDENTIALS_FLUSH')
    m.redraw()
  }
}