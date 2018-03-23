
class Wallet {

  async getClient() {
    console.log('getClient')
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
    throw 'Unimplemented method createClient'
  }

  async getAddress(path) {
    throw 'Unimplemented method genAddresses'
  }

  async genAddresses() {
    throw 'Unimplemented method genAddresses'
  }

  async signTransaction(addressPath, txParamsStr) {
    throw 'Unimplemented method signTransaction'
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
    console.log('  gen-addr parameters:')
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

