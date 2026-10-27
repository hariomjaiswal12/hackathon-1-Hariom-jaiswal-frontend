import { request } from "./apiClient"
import type { DepositConfig, Payment, PaymentOrder, Booking } from "@/types/api"

export const paymentService = {
  async getDepositConfig(): Promise<DepositConfig> {
    const res = await request<{ config: DepositConfig }>("/deposit/config")
    return res.config
  },

  async getAdminDepositConfig(): Promise<DepositConfig> {
    const res = await request<{ config: DepositConfig }>("/payments/admin/config")
    return res.config
  },

  async updateDepositConfig(data: Partial<DepositConfig>): Promise<DepositConfig> {
    const res = await request<{ config: DepositConfig }>("/payments/admin/config", {
      method: "PUT",
      body: data,
    })
    return res.config
  },

  async createPaymentIntent(
    bookingReference: string,
    idempotencyKey?: string
  ): Promise<{ payment: Payment; order: PaymentOrder; isPaid: boolean }> {
    return request("/payments/create-intent", {
      method: "POST",
      body: { bookingReference, idempotencyKey },
    })
  },

  async verifyPayment(payload: {
    paymentReference: string
    providerSignature: string
    providerPaymentId?: string
    providerOrderId?: string
  }): Promise<{ payment: Payment; booking: Booking }> {
    return request<{ payment: Payment; booking: Booking }>("/payments/verify", {
      method: "POST",
      body: payload,
    })
  },

  async getPayment(paymentReference: string): Promise<Payment> {
    const res = await request<{ payment: Payment }>(`/payments/${paymentReference}`)
    return res.payment
  },

  async getBookingPayment(bookingReference: string): Promise<Payment> {
    const res = await request<{ payment: Payment }>(`/payments/booking/${bookingReference}`)
    return res.payment
  },

  async refundPayment(paymentReference: string, reason?: string): Promise<Payment> {
    const res = await request<{ payment: Payment }>(`/payments/${paymentReference}/refund`, {
      method: "POST",
      body: { reason },
    })
    return res.payment
  },

  async listPayments(params?: { status?: string; bookingReference?: string }): Promise<Payment[]> {
    const res = await request<{ payments: Payment[] }>("/payments", { params })
    return res.payments
  },
}
