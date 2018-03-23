
import AppBtc from "@ledgerhq/hw-app-btc"
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid"
import Wallet from './wallet'
import Bitcore from "bitcore-lib"
//const BufferWriter = require('buffer-utils').BufferWriter
const BufferWriter = Bitcore.encoding.BufferWriter


// see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const BASE_PATH = "44'/0'/0'/0/"

class BtcWallet {
  
  async execute() {
    const args = require('minimist')(process.argv.slice(2))

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
        this.printUsage(process.argv);
    }
  }

  async getClient() {
    if(!this.client)
      try {
        this.client = await this.createClient()
      } catch(e) {
        this.log('getClient error', e)
        throw e
      }
    
    return this.client
  }

  async createClient() {
    let client
    try {
      const transport = await TransportNodeHid.create()
      client = new AppBtc(transport)
    } catch(e) {
      this.log('createClient error', e)
      throw e
    }
    return client
  }

  async getAddress(path) {
    try {
      let client = await this.getClient()
      return await client.getWalletPublicKey(path)
    } catch(err) {
      this.log('GetAddress Error', err)
    }
  }

  async genAddresses() {
    try {
      let client = await this.getClient()

      // CSV header
      console.log("path, publicKey, address")

      for (let index of Array(this.nb_addresses).keys()) {
        let path = `${BASE_PATH}${index}`

          await client.getWalletPublicKey(path).then(function(result) {
            let publicKey = result.publicKey
            let address   = result.bitcoinAddress
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

  async signTransaction(addressPath, inputs) {
    let client = await this.getClient()

    const txHex = '01000000014ea60aeac5252c14291d428915bd7ccd1bfc4af009f4d4dc57ae597ed0420b71010000008a47304402201f36a12c240dbf9e566bc04321050b1984cd6eaf6caee8f02bb0bfec08e3354b022012ee2aeadcbbfd1e92959f57c15c1c6debb757b798451b104665aa3010569b49014104090b15bde569386734abf2a2b99f9ca6a50656627e77de663ca7325702769986cf26cc9dd7fdea0af432c8e2becc867c932e1b9dd742f2a108997c2252e2bdebffffffff0281b72e00000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88aca0860100000000001976a9144533f5fb9b4817f713c48f0bfe96b9f50c476c9b88ac00000000'
    const tx1 = client.splitTransaction(txHex)

    const txs = [ [tx1, 1] ]
    const keySet = [ addressPath ]
    const changePath = undefined
    const outputScriptHex = '01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac'

    const transaction = new Bitcore.Transaction()
                                 .to('1Gokm82v6DmtwKEB8AiVhm82hyFSsEvBDK', 1000)
    const outputs = transaction.toObject().outputs

    const writer = new BufferWriter()
    writer.writeVarintNum(outputs.length)
    for (let output of outputs) {
      console.log(output)
      (new Bitcore.Output(output)).toBufferWriter(writer)
    }
    //outputs.toBufferWriter().getContents()

    const serializedOutputs = writer.getContents()
    console.log('TRANSACTION', serializedOutputs)
      
    const rawTx = await client.createPaymentTransactionNew( txs, keySet, changePath, outputScriptHex )
    this.log('TXINS', txs)
    this.log('KEYSET', keySet)
    this.log('CHANGE', changePath)
    this.log('OUTPUT', outputScriptHex)
    this.log('RAW TX', rawTx)
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
    console.log("  --op=OPERATION         Operation, can be gen-addr, get-addr or sign-tx")
    console.log('')
    console.log('  gen-addr parameters:')
    console.log("  --nb=N                 Number of generated addresses")
    console.log('')
    console.log('  get-addr-from-path parameters:')
    console.log("  --path=PATH            BIP32 path of the address")
    console.log('')
    console.log('  sign-tx parameters:')
    console.log("  --addr-path=PATH       (sign-tx)  Path of private key to use")
    console.log("  --tx-params=TXPARAMS   (sign-tx)  TX params")
  }
}

const btcwallet = new BtcWallet()
btcwallet.execute()


