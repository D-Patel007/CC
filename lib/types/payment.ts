export type PaymentMethodType =
  | 'cash'
  | 'venmo'
  | 'paypal'
  | 'zelle'
  | 'cashapp'
  | 'apple_pay'
  | 'google_pay'
  | 'credit_card'

export interface PaymentMethod {
  id: number
  methodType: PaymentMethodType
  isPreferred: boolean
  isActive: boolean
  paymentHandle: string | null
  createdAt?: string
  updatedAt?: string
}

export const PAYMENT_METHOD_INFO: Record<PaymentMethodType, {
  label: string
  icon: string
  description: string
}> = {
  cash: {
    label: 'Cash',
    icon: '💵',
    description: 'In-person cash exchange'
  },
  venmo: {
    label: 'Venmo',
    icon: '🅥',
    description: 'Venmo handle visible to buyers'
  },
  paypal: {
    label: 'PayPal',
    icon: '🅿️',
    description: 'Email or link for PayPal transfers'
  },
  zelle: {
    label: 'Zelle',
    icon: '🏦',
    description: 'Bank-linked Zelle payments'
  },
  cashapp: {
    label: 'Cash App',
    icon: '💚',
    description: '$Cashtag for receiving money'
  },
  apple_pay: {
    label: 'Apple Pay',
    icon: '',
    description: 'Apple Pay contact info'
  },
  google_pay: {
    label: 'Google Pay',
    icon: '🅖',
    description: 'Google Pay details'
  },
  credit_card: {
    label: 'Credit/Debit Card',
    icon: '💳',
    description: 'Card payments via campus escrow'
  },
}
