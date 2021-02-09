import ndjsonStream from "can-ndjson-stream"
import m from 'mithril'
import 'regenerator-runtime/runtime'

export const ndj = (endpoint, config={}) => {
  var res
  return fetch( endpoint, config )  // make a fetch request to a NDJSON stream service
  .then( ( response ) => {
    return ndjsonStream( response.body ) //ndjsonStream parses the response.body
    
  } )
}

export function fetcher() {
  var nd = ''
  return {
    oninit: vnode => {
      ndj(vnode.attrs.endpoint, {headers:{Authorization: vnode.attrs.token.token_type + ' ' + vnode.attrs.token.access_token }}).then( ( exampleStream ) => {
        const reader = exampleStream.getReader()
        let read
        reader.read().then( read = result => {
          if ( result.done ) {
            return
          }
      
          console.log( result.value )
          nd = JSON.stringify(result.value)
          m.redraw()
          vnode.attrs.callback(result.value)
          reader.read().then( read )
        })
      })
      console.log('nd', nd)
    },
    view: vnode => {
      return m('', vnode.attrs, vnode.children)
    }
  }
}