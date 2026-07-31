export type UpiApp = {
  id: string;
  name: string;
  shortLabel: string;
  color: string;
  glyph: string;
};

export const UPI_APPS: UpiApp[] = [
  { id: 'gpay', name: 'Google Pay', shortLabel: 'GPay', color: '#4285F4', glyph: 'G' },
  { id: 'phonepe', name: 'PhonePe', shortLabel: 'PhonePe', color: '#5F259F', glyph: 'Pe' },
  { id: 'paytm', name: 'Paytm', shortLabel: 'Paytm', color: '#00BAF2', glyph: 'P' },
  { id: 'kotak', name: 'Kotak UPI', shortLabel: 'Kotak', color: '#ED1C24', glyph: 'K' },
  { id: 'bhim', name: 'BHIM UPI', shortLabel: 'BHIM', color: '#F26522', glyph: 'B' },
  { id: 'amazonpay', name: 'Amazon Pay', shortLabel: 'Amazon', color: '#FF9900', glyph: 'A' },
  { id: 'cred', name: 'CRED UPI', shortLabel: 'CRED', color: '#1C1C1E', glyph: 'C' },
  { id: 'whatsapp', name: 'WhatsApp Pay', shortLabel: 'WhatsApp', color: '#25D366', glyph: 'W' },
  { id: 'mobikwik', name: 'MobiKwik', shortLabel: 'MobiKwik', color: '#DA3E82', glyph: 'M' },
  { id: 'freecharge', name: 'Freecharge', shortLabel: 'Freecharge', color: '#FFC72C', glyph: 'F' },
  { id: 'cash', name: 'Cash', shortLabel: 'Cash', color: '#6B7280', glyph: '₹' },
];

export function getUpiApp(id: string): UpiApp {
  return UPI_APPS.find((a) => a.id === id) ?? UPI_APPS[UPI_APPS.length - 1];
}
