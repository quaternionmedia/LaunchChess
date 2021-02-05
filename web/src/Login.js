import m from 'mithril'
import { User } from './User'
import { defaults, success, error, message, prompt } from 'alertifyjs'
import '../node_modules/alertifyjs/build/css/alertify.min.css'
import '../node_modules/alertifyjs/build/css/themes/semantic.css'
import './forms.css'

defaults.transition = "zoom"
defaults.theme.ok = "ui positive button"
defaults.theme.cancel = "ui black button"
defaults.notifier.delay = 10

export function auth(url, opts) {
  const req = new Promise((resolve, reject) => {
      m.request(url, {
        headers: {
          Authorization: User.token,
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

export const Login = () => {
  function login() {
    let form = new FormData(document.getElementById('login'))
    console.log('sending form', form)
    m.request('/token', {
      method: 'post',
      body: form,
    }).then( (token) => {
      User.login(token)
      success(`${User.username} logged in!`, 4)
    }, (res) => {
      console.log('error logging in!', res)
      error('error logging in', 3)
    })
  }
  return {
    view: (vnode) => {
      return [
        m('h2', 'login'),
        m('form#login', {
          action: '/token',
          method: 'post',
        }, [
          m('label[for=username]', 'username:'),
          m('input#username', {
            name: 'username',
          }),
          m('br'),
          m('label[for=password]', 'password:'),
          m('input#password', {
            name: 'password',
            type: 'password',
          }),
          m('br'),
          m('input#submit', {
            type: 'submit',
            value: 'login',
            style: {
              display: User.username ? 'none' : ''
            },
            onclick: (e) => {
              e.preventDefault()
              login()
            }},
          ),
          m('button#logout', {
            style: {
              display: User.username ? '' : 'none'
            },
            onclick: (e) => {
              e.preventDefault()
              if (User.username) {
                logout()
              } else {
                message("not logged in. Can't log out.", 3)
              }
            }
          }, 'logout'),
          m('button#register', {
            style: {
              display: User.username ? 'none' : ''
            },
            onclick: e => {
              e.preventDefault()
              if (document.getElementById('username').value == '') {
                error('please enter a username')
              } else if (document.getElementById('password').value.length < 8) {
                error('password must be at least 8 characters')
              } else {
                prompt('register', 'what is your email address?', 'e@mail.com', (e, v) => {
                  let form = new FormData(document.getElementById('login'))
                  form.append('email', v)
                  console.log('registering user', e, v, form)
                  m.request({
                    url: '/register',
                    method: 'post',
                    body: form
                  }).then( res => {
                    console.log('successfully registered', res)
                    success(`${v} is now registered!`)
                    login()
                  }).catch( err => {
                    error('error regestering')
                  })
                }, () => {
                  console.log('?')
                })
              }
            },
          }, 'register')
        ]
      )
    ]
  }
}
}