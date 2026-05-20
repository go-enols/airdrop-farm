import { ethers } from 'ethers'
import * as bip39 from 'bip39'
import { Keypair } from '@solana/web3.js'
import { derivePath } from 'ed25519-hd-key'
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519'
export class WalletService {
  store
  constructor(store) {
    this.store = store
  }
  async generateMnemonic() {
    return bip39.generateMnemonic()
  }
  async generateKeypair(walletType) {
    switch (walletType) {
      case 'evm': {
        const wallet = ethers.Wallet.createRandom()
        return { address: wallet.address, privateKey: wallet.privateKey, walletType }
      }
      case 'solana': {
        const keypair = Keypair.generate()
        return {
          address: keypair.publicKey.toBase58(),
          privateKey: Buffer.from(keypair.secretKey).toString('hex'),
          walletType
        }
      }
      case 'sui': {
        const keypair = new Ed25519Keypair()
        return {
          address: keypair.getPublicKey().toSuiAddress(),
          privateKey: Buffer.from(keypair.getSecretKey()).toString('hex'),
          walletType
        }
      }
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`)
    }
  }
  async deriveFromMnemonic(mnemonic, count, walletTypes) {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic')
    }
    const results = []
    for (let i = 0; i < count; i++) {
      for (const walletType of walletTypes) {
        switch (walletType) {
          case 'evm': {
            const path = `m/44'/60'/${i}'/0/0`
            const hdNode = ethers.HDNodeWallet.fromMnemonic(
              ethers.Mnemonic.fromPhrase(mnemonic),
              path
            )
            results.push({
              index: i,
              walletType,
              address: hdNode.address,
              privateKey: hdNode.privateKey
            })
            break
          }
          case 'solana': {
            const path = `m/44'/501'/${i}'/0'`
            const seed = await bip39.mnemonicToSeed(mnemonic)
            const derivedSeed = derivePath(path, seed.toString('hex')).key
            const keypair = Keypair.fromSeed(derivedSeed)
            results.push({
              index: i,
              walletType,
              address: keypair.publicKey.toBase58(),
              privateKey: Buffer.from(keypair.secretKey).toString('hex')
            })
            break
          }
          case 'sui': {
            const path = `m/44'/784'/${i}'/0'`
            const seed = await bip39.mnemonicToSeed(mnemonic)
            const derivedSeed = derivePath(path, seed.toString('hex')).key
            const keypair = Ed25519Keypair.fromSecretKey(derivedSeed)
            results.push({
              index: i,
              walletType,
              address: keypair.getPublicKey().toSuiAddress(),
              privateKey: Buffer.from(keypair.getSecretKey()).toString('hex')
            })
            break
          }
        }
      }
    }
    return results
  }
  async generateAndSaveKeypair(walletType) {
    const keypair = await this.generateKeypair(walletType)
    return this.store.walletRepo.createWallet({
      address: keypair.address,
      privateKey: keypair.privateKey,
      mnemonic: null,
      walletType: keypair.walletType,
      labels: []
    })
  }
  async deriveAndSaveFromMnemonic(mnemonic, count, walletTypes) {
    const derived = await this.deriveFromMnemonic(mnemonic, count, walletTypes)
    const wallets = []
    for (const item of derived) {
      const wallet = this.store.walletRepo.createWallet({
        address: item.address,
        privateKey: item.privateKey,
        mnemonic,
        walletType: item.walletType,
        labels: []
      })
      wallets.push(wallet)
    }
    return wallets
  }
}
