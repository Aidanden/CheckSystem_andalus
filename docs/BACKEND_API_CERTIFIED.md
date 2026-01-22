# Certified Check Backend API Documentation

## Overview
This document describes the backend API endpoints required for the certified check printing system.

---

## Required Backend Endpoints

### 1. Get Print Settings for Certified Checks
**Endpoint**: `GET /api/certified-checks/settings`

**Description**: Retrieves print settings for certified checks (accountType = 4)

**Response**:
```json
{
  "id": 1,
  "accountType": 4,
  "checkWidth": 235,
  "checkHeight": 86,
  "beneficiaryNameX": 30,
  "beneficiaryNameY": 30,
  "beneficiaryNameFontSize": 12,
  "beneficiaryNameAlign": "right",
  "accountNumberX": 30,
  "accountNumberY": 40,
  "accountNumberFontSize": 11,
  "accountNumberAlign": "right",
  "amountNumbersX": 180,
  "amountNumbersY": 50,
  "amountNumbersFontSize": 14,
  "amountNumbersAlign": "left",
  "amountWordsX": 30,
  "amountWordsY": 55,
  "amountWordsFontSize": 11,
  "amountWordsAlign": "right",
  "issueDateX": 30,
  "issueDateY": 20,
  "issueDateFontSize": 10,
  "issueDateAlign": "right",
  "checkTypeX": 120,
  "checkTypeY": 10,
  "checkTypeFontSize": 12,
  "checkTypeAlign": "center",
  "checkNumberX": 200,
  "checkNumberY": 20,
  "checkNumberFontSize": 11,
  "checkNumberAlign": "left"
}
```

---

### 2. Update Print Settings for Certified Checks
**Endpoint**: `PUT /api/certified-checks/settings`

**Description**: Updates print settings for certified checks

**Request Body**:
```json
{
  "accountType": 4,
  "checkWidth": 235,
  "checkHeight": 86,
  "beneficiaryNameX": 30,
  "beneficiaryNameY": 30,
  "beneficiaryNameFontSize": 12,
  "beneficiaryNameAlign": "right",
  "accountNumberX": 30,
  "accountNumberY": 40,
  "accountNumberFontSize": 11,
  "accountNumberAlign": "right",
  "amountNumbersX": 180,
  "amountNumbersY": 50,
  "amountNumbersFontSize": 14,
  "amountNumbersAlign": "left",
  "amountWordsX": 30,
  "amountWordsY": 55,
  "amountWordsFontSize": 11,
  "amountWordsAlign": "right",
  "issueDateX": 30,
  "issueDateY": 20,
  "issueDateFontSize": 10,
  "issueDateAlign": "right",
  "checkTypeX": 120,
  "checkTypeY": 10,
  "checkTypeFontSize": 12,
  "checkTypeAlign": "center",
  "checkNumberX": 200,
  "checkNumberY": 20,
  "checkNumberFontSize": 11,
  "checkNumberAlign": "left"
}
```

**Response**:
```json
{
  "success": true,
  "settings": { /* updated settings object */ }
}
```

---

### 3. Save Individual Certified Check Print Record (Optional)
**Endpoint**: `POST /api/certified-checks/print-record`

**Description**: Saves a record of an individual certified check print

**Request Body**:
```json
{
  "branchId": 1,
  "checkNumber": "001123456",
  "beneficiaryName": "أحمد محمد علي السيد",
  "accountNumber": "001001000811217",
  "amountDinars": "37500",
  "amountDirhams": "000",
  "amountInWords": "سبعة وثلاثون ألفاً وخمسمائة دينار ليبي لا غير",
  "issueDate": "2026-01-21",
  "checkType": "شيك مصدق",
  "notes": ""
}
```

**Response**:
```json
{
  "success": true,
  "id": 123,
  "message": "تم حفظ سجل الطباعة بنجاح"
}
```

---

## Database Schema Updates Required

### 1. Update `print_settings` table
Add new columns for individual certified check printing:

```sql
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS beneficiary_name_x DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS beneficiary_name_y DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS beneficiary_name_font_size INTEGER;
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS beneficiary_name_align VARCHAR(10);

ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS account_number_x DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS account_number_y DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS account_number_font_size INTEGER;
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS account_number_align VARCHAR(10);

ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_numbers_x DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_numbers_y DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_numbers_font_size INTEGER;
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_numbers_align VARCHAR(10);

ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_words_x DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_words_y DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_words_font_size INTEGER;
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS amount_words_align VARCHAR(10);

ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS issue_date_x DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS issue_date_y DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS issue_date_font_size INTEGER;
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS issue_date_align VARCHAR(10);

ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_type_x DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_type_y DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_type_font_size INTEGER;
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_type_align VARCHAR(10);

ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_number_x DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_number_y DECIMAL(10,2);
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_number_font_size INTEGER;
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS check_number_align VARCHAR(10);
```

### 2. Create `certified_check_print_records` table (Optional)
For storing individual certified check print records:

```sql
CREATE TABLE IF NOT EXISTS certified_check_print_records (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  check_number VARCHAR(50) NOT NULL,
  beneficiary_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  amount_dinars VARCHAR(20) NOT NULL,
  amount_dirhams VARCHAR(3) NOT NULL,
  amount_in_words TEXT NOT NULL,
  issue_date DATE NOT NULL,
  check_type VARCHAR(50) NOT NULL,
  printed_by INTEGER NOT NULL REFERENCES users(id),
  printed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certified_print_records_branch ON certified_check_print_records(branch_id);
CREATE INDEX idx_certified_print_records_check_number ON certified_check_print_records(check_number);
CREATE INDEX idx_certified_print_records_date ON certified_check_print_records(issue_date);
```

---

## Backend Controller Updates

### Update `certifiedCheck.controller.ts`

Add the following methods:

```typescript
// Get print settings for individual certified checks
export const getIndividualSettings = async (req: Request, res: Response) => {
    try {
        const settings = await PrintSettingsModel.getOrDefault(4);
        res.json(settings);
    } catch (error) {
        console.error('Error fetching individual certified check settings:', error);
        res.status(500).json({ error: 'فشل في جلب إعدادات الطباعة' });
    }
};

// Update print settings for individual certified checks
export const updateIndividualSettings = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        const settings = await PrintSettingsModel.upsert({
            accountType: 4,
            checkWidth: data.checkWidth,
            checkHeight: data.checkHeight,
            
            // Individual certified check fields
            beneficiaryNameX: data.beneficiaryNameX,
            beneficiaryNameY: data.beneficiaryNameY,
            beneficiaryNameFontSize: data.beneficiaryNameFontSize,
            beneficiaryNameAlign: data.beneficiaryNameAlign,
            
            accountNumberX: data.accountNumberX,
            accountNumberY: data.accountNumberY,
            accountNumberFontSize: data.accountNumberFontSize,
            accountNumberAlign: data.accountNumberAlign,
            
            amountNumbersX: data.amountNumbersX,
            amountNumbersY: data.amountNumbersY,
            amountNumbersFontSize: data.amountNumbersFontSize,
            amountNumbersAlign: data.amountNumbersAlign,
            
            amountWordsX: data.amountWordsX,
            amountWordsY: data.amountWordsY,
            amountWordsFontSize: data.amountWordsFontSize,
            amountWordsAlign: data.amountWordsAlign,
            
            issueDateX: data.issueDateX,
            issueDateY: data.issueDateY,
            issueDateFontSize: data.issueDateFontSize,
            issueDateAlign: data.issueDateAlign,
            
            checkTypeX: data.checkTypeX,
            checkTypeY: data.checkTypeY,
            checkTypeFontSize: data.checkTypeFontSize,
            checkTypeAlign: data.checkTypeAlign,
            
            checkNumberX: data.checkNumberX,
            checkNumberY: data.checkNumberY,
            checkNumberFontSize: data.checkNumberFontSize,
            checkNumberAlign: data.checkNumberAlign,
        });

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating individual certified check settings:', error);
        res.status(500).json({ error: 'فشل في حفظ إعدادات الطباعة' });
    }
};

// Save individual certified check print record (optional)
export const savePrintRecord = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const {
            branchId,
            checkNumber,
            beneficiaryName,
            accountNumber,
            amountDinars,
            amountDirhams,
            amountInWords,
            issueDate,
            checkType,
            notes
        } = req.body;

        // Validation
        if (!branchId || !checkNumber || !beneficiaryName || !accountNumber || !amountDinars) {
            return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب أن تكون موجودة' });
        }

        // Save to database
        const record = await prisma.certifiedCheckPrintRecord.create({
            data: {
                branchId,
                checkNumber,
                beneficiaryName,
                accountNumber,
                amountDinars,
                amountDirhams: amountDirhams || '000',
                amountInWords,
                issueDate: new Date(issueDate),
                checkType,
                printedBy: user.userId,
                notes: notes || null,
            }
        });

        res.json({
            success: true,
            id: record.id,
            message: 'تم حفظ سجل الطباعة بنجاح'
        });
    } catch (error) {
        console.error('Error saving print record:', error);
        res.status(500).json({ error: 'فشل في حفظ سجل الطباعة' });
    }
};
```

---

## Routes Update

### Update `certifiedCheck.routes.ts`

```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getBranches,
    getNextSerialRange,
    printBook,
    reprintBook,
    getLogs,
    getStatistics,
    getSettings,
    updateSettings,
    // New methods
    getIndividualSettings,
    updateIndividualSettings,
    savePrintRecord
} from '../controllers/certifiedCheck.controller';

const router = Router();

// Existing routes
router.get('/branches', authenticateToken, getBranches);
router.get('/serial/:branchId', authenticateToken, getNextSerialRange);
router.post('/print', authenticateToken, printBook);
router.post('/reprint/:logId', authenticateToken, reprintBook);
router.get('/logs', authenticateToken, getLogs);
router.get('/statistics', authenticateToken, getStatistics);
router.get('/settings', authenticateToken, getSettings);
router.put('/settings', authenticateToken, updateSettings);

// New routes for individual certified check printing
router.get('/individual-settings', authenticateToken, getIndividualSettings);
router.put('/individual-settings', authenticateToken, updateIndividualSettings);
router.post('/print-record', authenticateToken, savePrintRecord);

export default router;
```

---

## Prisma Schema Update

Add to `schema.prisma`:

```prisma
model CertifiedCheckPrintRecord {
  id              Int      @id @default(autoincrement())
  branchId        Int      @map("branch_id")
  checkNumber     String   @map("check_number") @db.VarChar(50)
  beneficiaryName String   @map("beneficiary_name") @db.VarChar(255)
  accountNumber   String   @map("account_number") @db.VarChar(50)
  amountDinars    String   @map("amount_dinars") @db.VarChar(20)
  amountDirhams   String   @map("amount_dirhams") @db.VarChar(3)
  amountInWords   String   @map("amount_in_words") @db.Text
  issueDate       DateTime @map("issue_date") @db.Date
  checkType       String   @map("check_type") @db.VarChar(50)
  printedBy       Int      @map("printed_by")
  printedAt       DateTime @default(now()) @map("printed_at")
  notes           String?  @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  branch Branch @relation(fields: [branchId], references: [id])
  user   User   @relation(fields: [printedBy], references: [id])

  @@index([branchId])
  @@index([checkNumber])
  @@index([issueDate])
  @@map("certified_check_print_records")
}
```

---

## Testing

### Test Get Settings:
```bash
curl -X GET http://localhost:5050/api/certified-checks/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Update Settings:
```bash
curl -X PUT http://localhost:5050/api/certified-checks/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountType": 4,
    "checkWidth": 235,
    "checkHeight": 86,
    "beneficiaryNameX": 30,
    "beneficiaryNameY": 30,
    "beneficiaryNameFontSize": 12,
    "beneficiaryNameAlign": "right"
  }'
```

### Test Save Print Record:
```bash
curl -X POST http://localhost:5050/api/certified-checks/print-record \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": 1,
    "checkNumber": "001123456",
    "beneficiaryName": "أحمد محمد علي السيد",
    "accountNumber": "001001000811217",
    "amountDinars": "37500",
    "amountDirhams": "000",
    "amountInWords": "سبعة وثلاثون ألفاً وخمسمائة دينار ليبي لا غير",
    "issueDate": "2026-01-21",
    "checkType": "شيك مصدق"
  }'
```

---

## Notes

1. The existing `getSettings` and `updateSettings` methods can be reused if they support the new fields
2. The `savePrintRecord` endpoint is optional - implement only if you need to track individual certified check prints
3. Make sure to run Prisma migrations after updating the schema
4. Update the `PrintSettingsModel` to handle the new fields

---

**Last Updated**: 2026-01-21
