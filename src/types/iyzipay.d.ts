declare module 'iyzipay' {
  interface IyzipayOptions {
    apiKey: string
    secretKey: string
    baseUrl: string
  }

  class Iyzipay {
    constructor(options: IyzipayOptions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkoutFormAuthInitialize: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscription: any
  }

  export default Iyzipay
}
