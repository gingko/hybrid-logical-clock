'use strict'

/*    understand/
 * The current Hybric Logical Clock
 */
let hlc

/*    outcome/
 * Initialize the clock to start
 */
function init() {
  hlc = {
    ts: Date.now(),
    nn: 0,
    id: uuid()
  }
}

/*    outcome/
 * This is the 'increment' function of a hybrid logical clock - we
 * adjust the current clock either with the latest timestamp or with an
 * incremented counter and return a serialized value
 */
function nxt() {
  try {
    hlc = inc(hlc)
    return serial(hlc)
  } catch(e) {
    console.error(e)
  }
}

function inc(my) {
  let now = Date.now()
  if(now > my.ts) {
    return { id: my.id, ts: now, nn: 0 }
  } else {
    return { id: my.id, ts: my.ts, nn: my.nn+1 }
  }
}

function serial(hlc) {
  // convert hlc.nn with toString(16) with leading zeros, to make it 4 digits
  // Note: this limits us to 65535 events per millisecond
  let nnHex = ('0000' + hlc.nn.toString(16).toUpperCase()).slice(-4);
  return `${hlc.ts}:${nnHex}:${hlc.id}`
}

function parse(hlc) {
  let p = hlc.split(':')
  return {
    ts: parseInt(p[0]),
    nn: parseInt(p[1], 16),
    id: p[2],
  }
}

/*    outcome/
 * This is the 'receive' function of a hybrid logical clock - we parse
 * the remote hlc and adjust the current clock with the latest timestamp
 * or the newly received clock whichever wins
 */
function recv(remote) {
  try {
    remote = parse(remote)
    hlc = receive(remote, hlc)
    return serial(hlc)
  } catch(e) {
    console.error(e)
  }
}

function receive(remote, my) {
  let now = Date.now()
  if(now > my.ts && now > remote.ts) {
    return { id: my.id, ts: now, nn: 0 }
  }
  if(my.ts == remote.ts) {
    let nn = Math.max(my.nn, remote.nn) + 1
    return { id: my.id, ts: my.ts, nn }
  }

  if(remote.ts > hlc.ts) {
    return { id: my.id, ts: remote.ts, nn: remote.nn + 1 }
  }

  return { id: my.id, ts: my.ts, nn: my.nn + 1 }
}

init()

module.exports = {
  nxt,
  recv,
}


/*  copied from: @tpp/simple-uuid */

/*    outcome/
 * Check if we have the nodejs crypto module, or the windows.crypto
 * is available (on server or client?) or drop down to the simplest
 * available solution - Math.random()
 *
 * For each of these, get a set of bytes, convert to a string
 * representation and return.
 */
function uuid(len) {
  if(!len) len = 8
  if(is_window_crypto_1()) return windows_crypto_uuid_1()
  if(is_nodejs_crypto_1()) return nodejs_crypto_uuid_1()
  return math_random_uuid_1()

  function math_random_uuid_1() {
    let v = ""
    while(v.length < len) {
      let r = Math.random()
      v += r.toString(36).substring(2)
    }
    return v.substring(0,len)
  }

  function is_nodejs_crypto_1() {
    return typeof module !== 'undefined'
        && typeof require === 'function'
  }

  function is_window_crypto_1() {
    return typeof window !== 'undefined'
        && typeof window.crypto !== 'undefined'
        && typeof window.crypto.getRandomValues == 'function'
  }

  function nodejs_crypto_uuid_1() {
    let crypto = require('crypto')
    return rand_1(a => crypto.randomFillSync(a))
  }

  function windows_crypto_uuid_1() {
    return rand_1(a => window.crypto.getRandomValues(a))
  }

  function rand_1(fn) {
    let a = new Uint8Array(len)
    fn(a)
    let map = "abcdefghijklmnopqrstuvuwxyz0123456789"
    let v = ""
    for(let i = 0;i < a.length;i++) {
      v += map[a[i] % map.length]
    }
    return v
  }

}

