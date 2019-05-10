const bjs = require('bitcoinjs-lib')
    , b58 = require('bs58check')
    , bip39 = require('bip39')

const pub_types = [
  '04b2430c', // zprv
  '04b24746', // zpub
]

// testnet
const pub_types_testnet = [
  '045f18bc', // vprv
  '045f1cf6', // vpub
]

/**
 * Constructor
 * Derive accounts from a seed.
 * @param {string} seed
 * @param {boolean} network
 */
function fromSeed(seed, network) {
  this.seed = bip39.mnemonicToSeedSync(seed)
  this.isTestnet = network === true ? true : false
  this.network = network === true ? bjs.networks.testnet : bjs.networks.bitcoin
}

fromSeed.prototype.getRootPrivate = function () {
  let masterPrv = this.isTestnet ?
                    vprv(bjs.bip32.fromSeed(this.seed, this.network).toBase58()) :
                      zprv(bjs.bip32.fromSeed(this.seed, this.network).toBase58())

  return masterPrv
}

fromSeed.prototype.getRootPublic = function () {
  let masterPub = this.isTestnet ?
                    vpub(bjs.bip32.fromSeed(this.seed, this.network).neutered().toBase58()) :
                      zpub(bjs.bip32.fromSeed(this.seed, this.network).neutered().toBase58())

  return masterPub
}

fromSeed.prototype.deriveAccount = function (index) {
  let keypath = "m/84'/0'" + '/' + index + "'"
  let masterPrv = this.isTestnet ?
                    vprv(bjs.bip32.fromSeed(this.seed, this.network).derivePath(keypath).toBase58()) :
                      zprv(bjs.bip32.fromSeed(this.seed, this.network).derivePath(keypath).toBase58())

  return masterPrv
}

/**
 * Constructor
 * Create key pairs from a private master key.
 * @param {string} zprv/vprv
 */
function fromZPrv(zprv) {
  this.network = undefined
  this.isTestnet = undefined
  this.zprv = this.toNode(zprv)
}

fromZPrv.prototype.toNode = function (zprv) {
  let payload = b58.decode(zprv)
    , version = payload.slice(0, 4)
    , key = payload.slice(4)
    , buffer = undefined

  if (!pub_types.includes(version.toString('hex')) && !pub_types_testnet.includes(version.toString('hex'))) {
    throw new Error('prefix is not supported')
  }

  if (pub_types.includes(version.toString('hex'))) {
    buffer = Buffer.concat([Buffer.from('0488ade4','hex'), key]) // xprv

    this.network = bjs.networks.bitcoin
    this.isTestnet = false
  }

  if (pub_types_testnet.includes(version.toString('hex'))) {
    buffer = Buffer.concat([Buffer.from('04358394','hex'), key]) // tprv

    this.network = bjs.networks.testnet
    this.isTestnet = true
  }

  return b58.encode(buffer)
}

fromZPrv.prototype.getAccountPrivate = function () {
  let masterPrv = this.isTestnet ?
                    vprv(bjs.bip32.fromBase58(this.zprv, this.network).toBase58()) :
                      zprv(bjs.bip32.fromBase58(this.zprv, this.network).toBase58())

  return masterPrv
}

fromZPrv.prototype.getAccountPublic = function () {
  let masterPub = this.isTestnet ?
                    vpub(bjs.bip32.fromBase58(this.zprv, this.network).neutered().toBase58()) :
                      zpub(bjs.bip32.fromBase58(this.zprv, this.network).neutered().toBase58())

  return masterPub
}

fromZPrv.prototype.getPrivateKey = function (index, isChange) {
  isChange = isChange !== true ? false : true

  let change = isChange !== true ? 0 : 1
    , prvkey = bjs.bip32.fromBase58(this.zprv, this.network).derive(change).derive(index)

  return prvkey.toWIF()
}

fromZPrv.prototype.getPublicKey = function (index, isChange) {
  isChange = isChange !== true ? false : true

  let change = isChange !== true ? 0 : 1
    , prvkey = bjs.bip32.fromBase58(this.zprv, this.network).derive(change).derive(index)

  return prvkey.publicKey.toString('hex')
}

fromZPrv.prototype.getAddress = function (index, isChange) {
  isChange = isChange !== true ? false : true

  let change = isChange !== true ? 0 : 1
    , pubkey = bjs.bip32.fromBase58(this.zprv, this.network).derive(change).derive(index).publicKey

  const payment = bjs.payments.p2wpkh({
    pubkey: pubkey,
    network: this.network
  })

  return payment.address
}

/**
 * Constructor
 * Create public keys and addresses from a public master key.
 * @param {string} zpub/vpub
 */
function fromZPub(zpub) {
  this.network = undefined
  this.isTestnet = undefined
  this.zpub = this.toNode(zpub)
}

fromZPub.prototype.toNode = function (zpub) {
  let payload = b58.decode(zpub)
    , version = payload.slice(0, 4)
    , key = payload.slice(4)
    , buffer = undefined

  if (!pub_types.includes(version.toString('hex')) && !pub_types_testnet.includes(version.toString('hex'))) {
    throw new Error('prefix is not supported')
  }

  if (pub_types.includes(version.toString('hex'))) {
    buffer = Buffer.concat([Buffer.from('0488b21e','hex'), key]) // xpub

    this.network = bjs.networks.bitcoin
    this.isTestnet = false
  }

  if (pub_types_testnet.includes(version.toString('hex'))) {
    buffer = Buffer.concat([Buffer.from('043587cf','hex'), key]) // tpub

    this.network = bjs.networks.testnet
    this.isTestnet = true
  }

  return b58.encode(buffer)
}

fromZPub.prototype.getAccountPublic = function () {
  let masterPub = this.isTestnet ?
                    vpub(bjs.bip32.fromBase58(this.zpub, this.network).neutered().toBase58()) :
                      zpub(bjs.bip32.fromBase58(this.zpub, this.network).neutered().toBase58())

  return masterPub
}

fromZPub.prototype.getPublicKey = function (index, isChange) {
  isChange = isChange !== true ? false : true

  let change = isChange !== true ? 0 : 1
    , zpub = bjs.bip32.fromBase58(this.zpub, this.network).derive(change).derive(index)

  return zpub.publicKey.toString('hex')
}

fromZPub.prototype.getAddress = function (index, isChange) {
  isChange = isChange !== true ? false : true

  let change = isChange !== true ? 0 : 1
    , pubkey = bjs.bip32.fromBase58(this.zpub, this.network).derive(change).derive(index).publicKey

  const payment = bjs.payments.p2wpkh({
    pubkey: pubkey,
    network: this.network
  })

  return payment.address
}

function zprv(pub) {
  let payload = b58.decode(pub)
    , version = payload.slice(0, 4)
    , key = payload.slice(4)

  return b58.encode(Buffer.concat([Buffer.from('04b2430c','hex'), key]))
}

function zpub(pub) {
  let payload = b58.decode(pub)
    , version = payload.slice(0, 4)
    , key = payload.slice(4)

  return b58.encode(Buffer.concat([Buffer.from('04b24746','hex'), key]))
}

function vprv(pub) {
  let payload = b58.decode(pub)
    , version = payload.slice(0, 4)
    , key = payload.slice(4)

  return b58.encode(Buffer.concat([Buffer.from('045f18bc','hex'), key]))
}

function vpub(pub) {
  let payload = b58.decode(pub)
    , version = payload.slice(0, 4)
    , key = payload.slice(4)

  return b58.encode(Buffer.concat([Buffer.from('045f1cf6','hex'), key]))
}

module.exports = {
  fromSeed: fromSeed,
  fromZPrv: fromZPrv,
  fromZPub: fromZPub
}
