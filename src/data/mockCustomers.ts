export interface Customer {
  CustomerID: string;
  ExeID: string;
  CustomerName: string;
  Addr1: string;
  Addr2: string;
  City: string;
  Route: string;
  Phone1: string;
  Phone2: string;
  Phone3: string;
  Additional: string;
  IsActive: boolean;
  LatLong: string;
  Grade: string;
}

export const mockCustomers: Customer[] = [
  {
    "CustomerID": "CP-KA-ABT007",
    "ExeID": "EXE123",
    "CustomerName": "Asiri Trading Company (Pvt) Ltd",
    "Addr1": "No.26, Borupana Road",
    "Addr2": "",
    "City": "Moratuwa",
    "Route": "Southern Route",
    "Phone1": "07771265646",
    "Phone2": "",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-ABT008",
    "ExeID": "EXE123",
    "CustomerName": "Asiri Trading Company (Pvt) Ltd",
    "Addr1": "No.26, Borupana Road",
    "Addr2": "",
    "City": "Moratuwa",
    "Route": "Southern Route",
    "Phone1": "07771265646",
    "Phone2": "",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-ABT009",
    "ExeID": "EXE123",
    "CustomerName": "Asiri Trading Company (Pvt) Ltd",
    "Addr1": "No.26, Borupana Road",
    "Addr2": "",
    "City": "Moratuwa",
    "Route": "Southern Route",
    "Phone1": "07771265646",
    "Phone2": "",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-SBL001",
    "ExeID": "EXE123",
    "CustomerName": "Asiri Trading Company (Pvt) Ltd",
    "Addr1": "No.26, Borupana Road",
    "Addr2": "",
    "City": "Siyambalanduwa",
    "Route": "Eastern Route",
    "Phone1": "07771265646",
    "Phone2": "",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-COL001",
    "ExeID": "EXE123",
    "CustomerName": "Wijaya Traders",
    "Addr1": "No. 78, Galle Road",
    "Addr2": "Bambalapitiya",
    "City": "Colombo",
    "Route": "Western Route",
    "Phone1": "0777456789",
    "Phone2": "0112345678",
    "Phone3": "",
    "Additional": "Near Bambalapitiya Junction",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-COL002",
    "ExeID": "EXE123",
    "CustomerName": "Perera Hardware Stores",
    "Addr1": "No. 45, Duplication Road",
    "Addr2": "Kollupitiya",
    "City": "Colombo",
    "Route": "Western Route",
    "Phone1": "0777123456",
    "Phone2": "",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "B"
  },
  {
    "CustomerID": "CP-KA-KAN001",
    "ExeID": "EXE123",
    "CustomerName": "Kandy Electrical Supplies",
    "Addr1": "No. 23, Peradeniya Road",
    "Addr2": "",
    "City": "Kandy",
    "Route": "Central Route",
    "Phone1": "0777987654",
    "Phone2": "0812345678",
    "Phone3": "",
    "Additional": "Opposite Clock Tower",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-KAN002",
    "ExeID": "EXE123",
    "CustomerName": "Hill Country Traders",
    "Addr1": "No. 56, Katugastota Road",
    "Addr2": "",
    "City": "Kandy",
    "Route": "Central Route",
    "Phone1": "0777654321",
    "Phone2": "",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "B"
  },
  {
    "CustomerID": "CP-KA-GAL001",
    "ExeID": "EXE123",
    "CustomerName": "Southern Hardware Mart",
    "Addr1": "No. 34, Main Street",
    "Addr2": "",
    "City": "Galle",
    "Route": "Southern Route",
    "Phone1": "0777234567",
    "Phone2": "0912345678",
    "Phone3": "",
    "Additional": "Near Galle Fort",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-GAL002",
    "ExeID": "EXE123",
    "CustomerName": "Coastal Suppliers Ltd",
    "Addr1": "No. 12, Beach Road",
    "Addr2": "Unawatuna",
    "City": "Galle",
    "Route": "Southern Route",
    "Phone1": "0777345678",
    "Phone2": "",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "C"
  },
  {
    "CustomerID": "CP-KA-JAF001",
    "ExeID": "EXE123",
    "CustomerName": "Northern Traders",
    "Addr1": "No. 67, Hospital Road",
    "Addr2": "",
    "City": "Jaffna",
    "Route": "Northern Route",
    "Phone1": "0777456789",
    "Phone2": "0212345678",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-BAT001",
    "ExeID": "EXE123",
    "CustomerName": "Eastern Electrical Supplies",
    "Addr1": "No. 89, Main Street",
    "Addr2": "",
    "City": "Batticaloa",
    "Route": "Eastern Route",
    "Phone1": "0777567890",
    "Phone2": "0652345678",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "B"
  },
  {
    "CustomerID": "CP-KA-NEG001",
    "ExeID": "EXE123",
    "CustomerName": "Negombo Hardware Stores",
    "Addr1": "No. 45, Beach Road",
    "Addr2": "",
    "City": "Negombo",
    "Route": "Western Route",
    "Phone1": "0777678901",
    "Phone2": "0312345678",
    "Phone3": "",
    "Additional": "Near Fish Market",
    "IsActive": true,
    "LatLong": "",
    "Grade": "A"
  },
  {
    "CustomerID": "CP-KA-KUR001",
    "ExeID": "EXE123",
    "CustomerName": "Kurunegala Trading Company",
    "Addr1": "No. 23, Colombo Road",
    "Addr2": "",
    "City": "Kurunegala",
    "Route": "North Western Route",
    "Phone1": "0777789012",
    "Phone2": "0372345678",
    "Phone3": "",
    "Additional": "",
    "IsActive": true,
    "LatLong": "",
    "Grade": "B"
  }
]; 