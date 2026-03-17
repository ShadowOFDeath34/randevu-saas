declare module 'iyzipay' {
  interface IyzipayOptions {
    apiKey: string
    secretKey: string
    baseUrl: string
  }

  class Iyzipay {
    constructor(options: IyzipayOptions)
    payment: any
    checkoutFormAuthInitialize: any
    subscription: any
  }

  export default Iyzipay
}
