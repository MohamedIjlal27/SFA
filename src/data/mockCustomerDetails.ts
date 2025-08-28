export interface CustomerAddress {
  address1: string;
  address2: string;
  address3: string;
  city: string;
}

export interface OverdueInvoice {
  documentNo: string;
  docType: string;
  docDate: string;
  daysDue: number;
  docAmount: number;
  dueAmount: string;
  exeId: string;
}

export interface AgeingData {
  "0-30": number;
  "31-60": number;
  "61-90": number;
  "91-120": number;
  ">120": number;
}

export interface CustomerDetails {
  customerId: string;
  executiveId: string;
  customerName: string;
  telephone1: string;
  telephone2: string;
  contactName: string;
  contactPhone: string;
  startDate: string;
  creditLimit: number;
  creditPeriod: number;
  comments: string;
  lastInvoiceDate: string;
  lastInvoiceAmt: number;
  lastPaymentDate: string;
  lastPaymentAmt: number;
  isInactive: boolean;
  isHold: boolean;
  followupStatus: string;
  address: CustomerAddress;
  balancedue: number;
  ageing: AgeingData;
  overdueinvoices: OverdueInvoice[];
}

export const mockCustomerDetails: Record<string, CustomerDetails> = {
  "CP-KA-ABT007": {
    "customerId": "CP-KA-ABT007",
    "executiveId": "EXE123",
    "customerName": "Asiri Trading Company (Pvt) Ltd",
    "telephone1": "07771265646",
    "telephone2": "",
    "contactName": "Asiri Perera",
    "contactPhone": "07771265646",
    "startDate": "2023-12-22T00:00:00Z",
    "creditLimit": 250000.00,
    "creditPeriod": 90,
    "comments": "Preferred customer",
    "lastInvoiceDate": "2024-05-15T00:00:00Z",
    "lastInvoiceAmt": 31000.58,
    "lastPaymentDate": "2024-05-20T00:00:00Z",
    "lastPaymentAmt": 15000.00,
    "isInactive": false,
    "isHold": false,
    "followupStatus": "Active",
    "address": {
      "address1": "No.26, Borupana Road",
      "address2": "",
      "address3": "",
      "city": "Moratuwa"
    },
    "balancedue": 251000.58,
    "ageing": {
      "0-30": 250.00,
      "31-60": 250.00,
      "61-90": 250.00,
      "91-120": 250.00,
      ">120": 250000.58
    },
    "overdueinvoices": [
      {
        "documentNo": "INV-2024-001",
        "docType": "INV",
        "docDate": "2024-01-15",
        "daysDue": 120,
        "docAmount": 50000.00,
        "dueAmount": "50000.00",
        "exeId": "EXE123"
      },
      {
        "documentNo": "INV-2024-002",
        "docType": "INV",
        "docDate": "2024-02-20",
        "daysDue": 90,
        "docAmount": 75000.00,
        "dueAmount": "75000.00",
        "exeId": "EXE123"
      },
      {
        "documentNo": "INV-2024-003",
        "docType": "INV",
        "docDate": "2024-03-10",
        "daysDue": 60,
        "docAmount": 125000.58,
        "dueAmount": "125000.58",
        "exeId": "EXE123"
      }
    ]
  }
}; 