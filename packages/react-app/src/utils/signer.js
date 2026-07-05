import * as ethers from 'ethers'

export default class UncheckedJsonRpcSigner extends ethers.Signer {
  constructor(signer) {
    super()
    this.signer = signer
    this.provider = signer.provider
  }

  async getAddress() {
    return this.signer.getAddress()
  }

  async signMessage(message) {
    return this.signer.signMessage(message)
  }

  async sendTransaction(transaction) {
    const tx = await this.signer.provider.broadcastTransaction(
      await this.signer.signTransaction(transaction)
    )
    return tx
  }

  connect(provider) {
    return new UncheckedJsonRpcSigner(this.signer.connect(provider))
  }
}