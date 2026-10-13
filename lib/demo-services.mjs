// Deliberately network-free adapters. Never accept real phone numbers or credentials.
export function simulateOtp() { return { simulated: true, verifiedSampleIdentity: true, provider: "sms.ir", sent: false }; }
export function simulatePayment() { return { simulated: true, provider: "Zarinpal", moneyTransferred: false, success: true }; }
export function previewMessage(orderId, text) { return { simulated: true, provider: "sms.ir", sent: false, orderId, text }; }
