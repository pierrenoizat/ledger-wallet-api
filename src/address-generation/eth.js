import AppEth from "@ledgerhq/hw-app-eth";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
const EthereumTx = require('ethereumjs-tx')
import {API} from '../etherscan';

// see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const BASE_PATH = "44'/60'/0'/0/"

class EthWallet {

  async execute() {
    let args = require('minimist')(process.argv.slice(2))

    switch(args['op']) {
      case "gen-addr":
        this.nb_addresses = args['nb'] || 10
        this.genAddresses()
        break

      case "get-addr-from-path":
        const path    = args['path']
        const address = await this.getAddress(path)
        this.log('Address', address)
        break

      case "sign-tx":
        let addressPath = args['addr-path']
        let txParams  = args['tx-params']
        this.signTransaction(addressPath, txParams)
        break
      default:
        printUsage(process.argv);
    }
  }

  async getClient() {
    if(!this.eth) {
      console.log('------- CREATING CLIENT --------')
      try {
        let transport = await TransportNodeHid.create()
        this.eth = new AppEth(transport)
      } catch(e) {
        this.log('getClient error', e)
        throw e
      }
    } else
      console.log('------- USING CLIENT --------')
    
    return this.eth
  }

  async getAddress(path) {
    try {
      let eth = await this.getClient()
      return await eth.getAddress(path)
    } catch(err) {
      this.log('GetAddress Error', err)
    }
  }

  async genAddresses() {
    try {
      let eth = await this.getClient()

      // CSV header
      console.log("path, publicKey, address")

      for (let index of Array(this.nb_addresses).keys()) {
        let path = `${BASE_PATH}${index}`

          await eth.getAddress(path).then(function(result) {
            let publicKey = result.publicKey
            let address   = result.address
            console.log(`${index},"${path}", ${publicKey}, ${address}`);

          }).catch(function(err) {
            console.log(err.name)
            console.log(err.message)
            console.log(err.statusCode)
            console.log(err.statusText)
            console.log('-')
          });
      }
    } catch(err) {
      this.log('GenAddresses Error', err)
    }
  }

  createTx(txParams) {
    return new EthereumTx(txParams)
  }

  async signTransaction(addressPath, txParamsStr) {
    try {
      let eth  = await this.getClient()

      let from = await this.getAddress(addressPath)

      let txParams = JSON.parse(txParamsStr)
      txParams['gasPrice'] = await this.getGasPrice()
      txParams['nonce']    = await this.getNonceForAddress(from)
      this.log('TX Params', txParams)

      let tx = this.createTx(txParams)
      // HACK (ethereumjs-tx library bug) !!!
      tx.v = Buffer.from([1])

      let signature = await eth.signTransaction(addressPath, tx.serialize().toString('hex'))
      signature['v'] = '0x' + signature['v']
      signature['r'] = '0x' + signature['r']
      signature['s'] = '0x' + signature['s']

      let signedTxParams = {...txParams, ...signature}

      let signedTx = this.createTx(signedTxParams)
      this.log('Serialized Signed TX', signedTx.serialize().toString('hex'))

      let senderAddress = signedTx.getSenderAddress().toString('hex')
      this.log('Sender address', senderAddress)

    } catch(err) {
      this.log('TRANSACTION NOT SIGNED', err)
    }
  }

  async getNonceForAddress(address) {
    try {
      const api = this.getApi()
console.log(address.address)
      return await api.getTransactionCount(address.address)
    } catch(err) {
      this.log('getNonceForAddress error', err)
    }
  }

  async getGasPrice() {
    try {
      const api = this.getApi()
      return await api.getGasPrice()

    } catch(err) {
      this.log('getGasPrice error', err)
    }
  }

  /*
     async function broadcastTx(from, to, raw) {
     try {
     const api = this.getApi()
     log('BALANCE (from)', await api.getBalance(from))

     const result = await api.sendRaw(raw)
     console.log(result)

     } catch(err) {
     log('API ERROR', err)
     }
     }
     */

  getApi() {
    const apiKey = 'TZ58GN8SI5QHUTPGFBJMMQ5JPEPIEWNQ6A'
    return new API("https://api.etherscan.io/api", apiKey)
  }

  log(title, message = '') {
    console.log(`--- ${title} ---`)
    if(message) console.log(message)
    console.log('------------------------------')
  }

  printUsage(argv) {
    let program_name = argv[0]
    let command = argv[1]
    console.log(`Usage: ${program_name} ${command} <options>`)
    console.log('')
    console.log("  --op=gen-addr|sign-tx  Operation")
    console.log('')
    console.log('  gen-add parameters:')
    console.log("  --nb=N                 Number of generated addresses")
    console.log('')
    console.log('  get-add-from-path parameters:')
    console.log("  --path=PATH            BIP32 path of the address")
    console.log('')
    console.log('  sign-tx parameters:')
    console.log("  --addr-path=PATH       (sign-tx)  Path of private key to use")
    console.log("  --tx-params=TXPARAMS   (sign-tx)  TX params")
  }
}

const ethwallet = new EthWallet()
ethwallet.execute()


