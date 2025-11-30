
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StructuredSummary } from '../types';

const SUMMARY_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    documentTitle: {
      type: Type.STRING,
      description: "A concise title for the document or text.",
    },
    executiveSummary: {
      type: Type.STRING,
      description: "A brief overview of the main content (2-3 sentences).",
    },
    category: {
      type: Type.STRING,
      description: "The type of document (e.g., Proforma Invoice, Export Contract, Letter of Credit, etc.).",
    },
    keyHighlights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of the most important points extracted from the content.",
    },
    importantDates: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Any specific dates, deadlines, or timeframes mentioned.",
    },
    actionItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Tasks, requirements, or calls to action identified in the text.",
    },
    peopleOrEntities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Names of people, companies, or organizations involved.",
    },
    tradeDetails: {
      type: Type.OBJECT,
      nullable: true,
      description: "Specific extracted data for trade finance documents.",
      properties: {
        lcNumber: { type: Type.STRING, nullable: true, description: "Letter of Credit Number" },
        exportContractNumber: { type: Type.STRING, nullable: true, description: "Export Contract Number or LC Reference Number (e.g. EXPORT CONT./LC. NO)" },
        dateOfIssue: { type: Type.STRING, nullable: true },
        expiryDate: { type: Type.STRING, nullable: true },
        latestShipmentDate: { type: Type.STRING, nullable: true },
        applicant: { type: Type.STRING, nullable: true, description: "Applicant Name/Company" },
        beneficiary: { type: Type.STRING, nullable: true, description: "Beneficiary Name/Company" },
        amountAndCurrency: { type: Type.STRING, nullable: true, description: "Total value with currency (e.g. USD 50,000.00)" },
        discrepancyFee: { type: Type.STRING, nullable: true, description: "Discrepancy fee and payment fee details" },
        hsCodes: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: "List of HS Codes found" },
        draftsAt: { type: Type.STRING, nullable: true, description: "Payment terms e.g. 'AT SIGHT', '90 DAYS FROM B/L'." },
        ircNumber: { type: Type.STRING, nullable: true, description: "Import Registration Certificate (IRC) Number" },
        ercNumber: { type: Type.STRING, nullable: true, description: "Export Registration Certificate (ERC) Number" },
        tinNumber: { type: Type.STRING, nullable: true, description: "Tax Identification Number (TIN)" },
        vatNumber: { type: Type.STRING, nullable: true, description: "VAT Registration Number" },
        binNumber: { type: Type.STRING, nullable: true, description: "Business Identification Number (BIN) of Applicant" },
        issuingBankBin: { type: Type.STRING, nullable: true, description: "Issuing Bank's BIN" },
        bondLicenceNumber: { type: Type.STRING, nullable: true, description: "Bond Licence Number" },
        boiNumber: { type: Type.STRING, nullable: true, description: "Board of Investment (BOI) Number" }
      }
    },
    tradeCompliance: {
      type: Type.OBJECT,
      nullable: true,
      description: "Compliance verification for trade documents (Proforma Invoice, Export Contract).",
      properties: {
        isTradeDocument: { type: Type.BOOLEAN },
        extractedDetails: {
          type: Type.OBJECT,
          properties: {
            exportContractDate: { type: Type.STRING, nullable: true },
            proformaInvoiceDate: { type: Type.STRING, nullable: true, description: "The Date of Issue" },
            latestShipmentDate: { type: Type.STRING, nullable: true },
            expiryDate: { type: Type.STRING, nullable: true, description: "Date of Expiry" },
            draftsAt: { type: Type.STRING, nullable: true, description: "The payment terms, e.g., 'AT SIGHT', '90 DAYS DATE'." },
            hasOverdueInterestClause: { type: Type.BOOLEAN, nullable: true, description: "True if an overdue interest clause is present." }
          }
        },
        rules: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ruleName: { type: Type.STRING },
              passed: { type: Type.BOOLEAN },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    }
  },
  required: ["documentTitle", "executiveSummary", "keyHighlights", "category"],
};

export const generateSummary = async (
  text?: string,
  fileData?: { base64: string; mimeType: string }
): Promise<StructuredSummary> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing from environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const parts: any[] = [];
  const promptText = `
    Please analyze this document and provide a structured summary following the defined schema.
    
    CRITICAL INSTRUCTION FOR TRADE DOCUMENTS (Letter of Credit, Proforma Invoice, Export Contract, etc.):
    
    1. **EXTRACT SPECIFIC TRADE DETAILS (Populate 'tradeDetails')**:
       If this is a trade document, extract the following into the 'tradeDetails' object:
       - LC Number (Document Number)
       - Export Contract/LC Number (Look for "EXPORT CONT./LC. NO." or similar)
       - Date of Issue (Format: DD/MM/YYYY)
       - Expiry Date (Format: DD/MM/YYYY)
       - Latest Shipment Date (Format: DD/MM/YYYY)
       - Applicant (Name/Company)
       - Beneficiary (Name/Company)
       - Value (Amount & Currency)
       - Drafts at (Payment Terms, e.g., "AT SIGHT", "90 DAYS")
       - Regulatory Numbers: 
         - IRC No
         - ERC No
         - TIN No
         - VAT Reg No
         - BIN (Applicant's)
         - Issuing Bank's BIN
         - Bond Licence No
         - BOI No
       - Discrepancy and Payment fee instructions
       - HS Codes (as an array of strings)

    2. **COMPLIANCE VERIFICATION (Populate 'tradeCompliance')**:
       If the document appears to be a Proforma Invoice or Export Contract, perform these checks:
       
       **Date Extraction & Normalization Rules:**
       - **CRITICAL - 6-DIGIT DATE PARSING (e.g., 251124)**:
         - **SWIFT/Banking Standard**: In messages like MT700, dates are typically **YYMMDD** (Year-Month-Day).
           - Example: '251124' should be read as **Year: 2025, Month: 11, Day: 24** (24th Nov 2025).
         - **General Rule**: Check the first two digits. If they represent a plausible year (e.g., 23, 24, 25, 26) and the last two digits are a valid day, PREFER **YYMMDD** format.
         - **DDMMYY Check**: Only assume DDMMYY if the first two digits are > 31 OR if the context clearly contradicts YYMMDD.
       
       - **Standard formats**: Handle "25th Dec 2023", "12/25/23", "2023-12-25", "Dec 25, 2023".
       - **Ambiguity**: For "xx/xx/xxxx", prefer **DD/MM/YYYY** over MM/DD/YYYY unless US context is explicit.
       
       - **OUTPUT FORMAT**: Convert ALL extracted dates to **'DD/MM/YYYY'** format (e.g., 24/11/2025) for the final JSON output.
       
       - **DATA CONSISTENCY**: Ensure 'tradeCompliance.extractedDetails' (proformaInvoiceDate, expiryDate, etc.) contains the exact same date values as extracted in 'tradeDetails'. Do not leave them NULL if the data exists in 'tradeDetails'.

       **Verification Rules:**
       
       - **Rule "Export Contract Sequence"**: 
         - Verify that the **Export Contract Date** is chronologically **before or equal** to the **Date of Issue**. 
         - Logic: Export Contract Date <= Date of Issue.
         - Explanation: "Export Contract Date must be on or before the Date of Issue".
         
       - **Rule "Shipment & Expiry Sequence"**: 
         - Verify the logical flow of the remaining dates.
         - Logic: Date of Issue <= Latest Shipment Date <= Date of Expiry.
         - Explanation: "Dates must follow sequence: Issue -> Shipment -> Expiry".
         - If any date is missing, mark as Failed with explanation "Missing required date for verification".

       - **Rule "Overdue Interest Verification"**: 
         - Identify the "Drafts at" / Payment Terms.
         - IF "Drafts at" contains "AT SIGHT" (case insensitive): Rule is PASSED (Explanation: "Interest clause not required for At Sight drafts").
         - IF "Drafts at" is Usance (e.g., "90 DAYS"): Verify if an "Overdue Interest" clause exists. If yes, PASSED; if no, FAILED (Explanation: "Missing overdue interest clause for usance draft").
       
    3. If the document is NOT a trade document, leave 'tradeDetails' null and set 'tradeCompliance.isTradeDocument' to false.
  `;

  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.base64,
      },
    });
    parts.push({
      text: promptText
    });
  } else if (text) {
    parts.push({
      text: `${promptText}\n\nText to analyze:\n${text}`
    });
  } else {
    throw new Error("No input provided for summarization.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: SUMMARY_SCHEMA,
        temperature: 0.1, // Very low temperature for strict data extraction
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from model.");
    }

    return JSON.parse(responseText) as StructuredSummary;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate summary.");
  }
};
