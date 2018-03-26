
import AppBtc from "@ledgerhq/hw-app-btc"
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid"
import Wallet from './wallet'
import Bitcore from "bitcore-lib"
const BufferWriter = Bitcore.encoding.BufferWriter
const Output = Bitcore.Transaction.Output


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
        const addrPath = args['key-path']
        const txHex    = args['tx-hex']
        const txIndex  = args['tx-index']
        const outputs  = {}; outputs[args['output-addr']] = args['output-amount']
        this.signTransaction(addrPath, txHex, txIndex, outputs)
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


  // Get address and public key from path
  // IN:  BIP32 path of the address
  // OUT: address and public key
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
      console.log("index, path, publicKey, address")

      for (let index of Array(this.nb_addresses).keys()) {
        let path = `${BASE_PATH}${index}`

          await client.getWalletPublicKey(path).then(function(result) {
            let publicKey = result.publicKey
            let address   = result.bitcoinAddress
            console.log(`${index}, "${path}", ${publicKey}, ${address}`);

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

  // Sign transaction
  // IN: 
  // - keyPath: key of private key which will sign the tx
  // - txHex:   raw input tx
  // - txIndex: UTXO index in txHex
  // - ouputs:  Output hash (format: {addr1: amount1, addr2: amount2, ...} )
  // OUT: Signed raw tx, in hex format
  async signTransaction(keyPath, txHex, txIndex, outputs) {
    try {
      let client = await this.getClient()

      const txInputs   = [ [client.splitTransaction(txHex), txIndex] ]
      const keySet     = [ keyPath ]
      const changePath = undefined

      const serializedOutputs = this.serializeOutput(outputs)
        
      const rawTx = await client.createPaymentTransactionNew( txInputs, keySet, changePath, serializedOutputs )

      this.log('KEYSET', keySet)
      this.log('CHANGE', changePath)
      this.log('RAW TX', rawTx)
      
    } catch(err) {
      this.log('SignTransaction Error', err)
    }
  }

  // Serialize output (to respect Ledger API output format constraints...)
  // IN:  Array of hash (key: bitcoin address, value: amount to send to this output)
  // OUT: Serialized part of transaction concerning outputs
  serializeOutput(addrs_and_amounts) {
    const transaction = new Bitcore.Transaction()

    for (let addr of Object.keys(addrs_and_amounts))
      transaction.to(addr, addrs_and_amounts[addr])

    const outputs = transaction.toObject().outputs
    const writer  = new BufferWriter()

    writer.writeVarintNum(outputs.length)
    for (let output of outputs) {
      (new Output.fromObject(output)).toBufferWriter(writer)
    }

    return writer.toBuffer().toString('hex')
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
    console.log("  --op=OPERATION         Operation, can be gen-addr, get-addr-from-path or sign-tx")
    console.log('')
    console.log('  gen-addr parameters:')
    console.log("  --nb=N                 Number of generated addresses")
    console.log('')
    console.log('  get-addr-from-path parameters:')
    console.log("  --path=PATH            BIP32 path of the address")
    console.log('')
    console.log('  sign-tx parameters:')
    console.log("  --key-path=PATH        Path of private key to use")
    console.log("  --tx-hex=TXHEX         Input transaction (raw, hex formatted)")
    console.log("  --tx-index=TXINDEX     Index of output to spend")
    console.log("  --ouput-addr=ADDR      Output address")
    console.log("  --ouput-amount=AMOUNT  Output amount, in satoshis")
  }
}

const btcwallet = new BtcWallet()
btcwallet.execute()


