
import React, { useState } from 'react';
import { StructuredSummary } from '../types';
import { CheckIcon, FileTextIcon, SparklesIcon, ShieldCheckIcon, ShieldAlertIcon, XIcon, CopyIcon } from './Icons';

interface SummaryDisplayProps {
  data: StructuredSummary;
  generationTime?: number;
}

const SectionCard: React.FC<{ title: string; children: React.ReactNode; colorClass: string }> = ({ title, children, colorClass }) => (
  <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
    <h3 className={`px-6 py-3 border-b border-slate-100 font-semibold text-sm tracking-wide uppercase ${colorClass}`}>
      {title}
    </h3>
    <div className="p-6">
      {children}
    </div>
  </section>
);

const DetailRow: React.FC<{ label: string; value?: string | null; isCode?: boolean; multiline?: boolean }> = ({ label, value, isCode, multiline }) => {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col py-2 border-b border-slate-50 last:border-0 group">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <div className={`flex gap-2 ${multiline ? 'items-start' : 'items-center'}`}>
        <span className={`text-sm text-slate-800 font-medium ${multiline ? 'break-words whitespace-pre-wrap flex-1' : 'truncate'} ${isCode ? 'font-mono bg-slate-50 px-2 py-0.5 rounded w-fit' : ''}`}>
          {value}
        </span>
        <button 
          onClick={handleCopy}
          className={`p-1.5 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 flex-shrink-0 ${
            copied 
              ? 'text-green-600 bg-green-50' 
              : 'text-slate-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
          title="Copy to clipboard"
          aria-label={`Copy ${label}`}
        >
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

const CopyableTag: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        text-xs font-mono px-2 py-0.5 rounded border transition-colors flex items-center space-x-1.5
        ${copied 
          ? 'bg-green-50 border-green-200 text-green-700' 
          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
        }
      `}
      title="Click to copy"
    >
      <span>{text}</span>
      {copied && <CheckIcon className="w-3 h-3" />}
    </button>
  );
};

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ data, generationTime }) => {
  const hasTradeDetails = !!data.tradeDetails;

  // Header Copy helper
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <article className="space-y-6 animate-fade-in">
      
      {/* Header Card */}
      <header className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-2 mb-6 opacity-80">
          <FileTextIcon className="w-5 h-5" />
          <span className="text-sm font-medium uppercase tracking-wider">{data.category}</span>
        </div>
        
        {/* Only show Title if NOT a trade document (Trade docs hide title to focus on LC/Applicant) */}
        {!hasTradeDetails && (
          <h2 className="text-3xl font-bold mb-4 leading-tight">{data.documentTitle}</h2>
        )}
        
        {/* Simplified Header Content for Trade Docs */}
        {hasTradeDetails ? (
           <div className="flex flex-col md:flex-row gap-8 mt-2">
             <div>
                <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold mb-1">LC Number</p>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyText(data.tradeDetails?.lcNumber || '')}>
                  <p className="text-3xl font-mono font-bold tracking-tight">{data.tradeDetails?.lcNumber || 'N/A'}</p>
                  {data.tradeDetails?.lcNumber && <CopyIcon className="w-5 h-5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
             </div>
             <div>
                <p className="text-indigo-200 text-xs uppercase tracking-wider font-semibold mb-1">Applicant</p>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyText(data.tradeDetails?.applicant || '')}>
                  <p className="text-2xl font-medium">{data.tradeDetails?.applicant || 'N/A'}</p>
                   {data.tradeDetails?.applicant && <CopyIcon className="w-5 h-5 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
             </div>
           </div>
        ) : (
          <p className="text-indigo-100 text-lg leading-relaxed">
            {data.executiveSummary}
          </p>
        )}
      </header>

      {/* Compliance Check Section (Only if applicable) */}
      {data.tradeCompliance && data.tradeCompliance.isTradeDocument && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" aria-label="Trade Compliance Verification">
          <div className="px-6 py-3 border-b border-slate-100 font-semibold text-sm tracking-wide uppercase text-blue-700 bg-blue-50 flex items-center space-x-2">
            <ShieldCheckIcon className="w-5 h-5" />
            <h3>Trade Document Verification</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Rules Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.tradeCompliance.rules.map((rule, idx) => (
                <div key={idx} className={`p-4 rounded-lg border ${rule.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                   <div className="flex items-start space-x-3">
                     {rule.passed ? (
                       <div className="bg-green-100 p-1 rounded-full text-green-600 mt-0.5">
                          <CheckIcon className="w-4 h-4" />
                       </div>
                     ) : (
                       <div className="bg-red-100 p-1 rounded-full text-red-600 mt-0.5">
                          <XIcon className="w-4 h-4" />
                       </div>
                     )}
                     <div>
                       <h4 className={`font-semibold text-sm ${rule.passed ? 'text-green-800' : 'text-red-800'}`}>
                         {rule.ruleName}
                       </h4>
                       <p className={`text-sm mt-1 ${rule.passed ? 'text-green-700' : 'text-red-700'}`}>
                         {rule.explanation}
                       </p>
                     </div>
                   </div>
                </div>
              ))}
            </div>

            {/* Extracted Date Timeline (Simplified view for compliance context) */}
            <div className="border-t border-slate-100 pt-4">
               <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Verification Data</h4>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Export Contract Date: Primary from Compliance Details */}
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 block mb-1">Export Contract</span>
                    <span className="font-medium text-slate-800 text-sm">
                      {data.tradeCompliance.extractedDetails.exportContractDate || "N/A"}
                    </span>
                  </div>
                  
                  {/* Date of Issue: Fallback to tradeDetails if missing in compliance details */}
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <span className="text-xs text-indigo-400 block mb-1">Date of Issue</span>
                    <span className="font-medium text-indigo-900 text-sm">
                      {data.tradeCompliance.extractedDetails.proformaInvoiceDate || data.tradeDetails?.dateOfIssue || "N/A"}
                    </span>
                  </div>
                  
                  {/* Latest Shipment: Fallback to tradeDetails if missing */}
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 block mb-1">Latest Shipment</span>
                    <span className="font-medium text-slate-800 text-sm">
                      {data.tradeCompliance.extractedDetails.latestShipmentDate || data.tradeDetails?.latestShipmentDate || "N/A"}
                    </span>
                  </div>
                  
                  {/* Expiry Date: Fallback to tradeDetails if missing */}
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-xs text-slate-400 block mb-1">Expiry Date</span>
                    <span className="font-medium text-slate-800 text-sm">
                      {data.tradeCompliance.extractedDetails.expiryDate || data.tradeDetails?.expiryDate || "N/A"}
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Key Highlights / Trade Details */}
        <div className="md:col-span-2">
          <SectionCard 
            title={hasTradeDetails ? "Key Trade Highlights" : "Key Highlights"} 
            colorClass="text-indigo-600 bg-indigo-50/50"
          >
            {hasTradeDetails && data.tradeDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {/* Column 1 */}
                <div className="space-y-1">
                  <DetailRow label="LC Number" value={data.tradeDetails.lcNumber} />
                  <DetailRow label="Export Cont./LC No" value={data.tradeDetails.exportContractNumber} />
                  <DetailRow label="Proforma Invoice No" value={data.tradeDetails.proformaInvoiceNumber} />
                  <DetailRow label="Date of Issue" value={data.tradeDetails.dateOfIssue} />
                  <DetailRow label="Expiry Date" value={data.tradeDetails.expiryDate} />
                  <DetailRow label="Latest Shipment Date" value={data.tradeDetails.latestShipmentDate} />
                </div>

                {/* Column 2 */}
                <div className="space-y-1">
                  <DetailRow label="Applicant" value={data.tradeDetails.applicant} />
                  <DetailRow label="Beneficiary" value={data.tradeDetails.beneficiary} />
                  <DetailRow label="Issuing Bank BIN" value={data.tradeDetails.issuingBankBin} isCode />
                  <DetailRow label="Value" value={data.tradeDetails.amountAndCurrency} />
                  <DetailRow label="Drafts At" value={data.tradeDetails.draftsAt} />
                  <DetailRow label="Reimbursement Charges" value={data.tradeDetails.reimbursementCharges} multiline={true} />
                </div>

                {/* Column 3 */}
                <div className="space-y-1">
                   <DetailRow label="IRC No" value={data.tradeDetails.ircNumber} isCode />
                   <DetailRow label="ERC No" value={data.tradeDetails.ercNumber} isCode />
                   <DetailRow label="TIN No" value={data.tradeDetails.tinNumber} isCode />
                   <DetailRow label="VAT No" value={data.tradeDetails.vatNumber} isCode />
                   <DetailRow label="BIN No" value={data.tradeDetails.binNumber} isCode />
                   <DetailRow label="Bond Licence" value={data.tradeDetails.bondLicenceNumber} isCode />
                   <DetailRow label="BOI No" value={data.tradeDetails.boiNumber} isCode />
                   
                   <DetailRow label="Discrepancy / Payment Fee" value={data.tradeDetails.discrepancyFee} multiline={true} />
                   
                   {data.tradeDetails.hsCodes && data.tradeDetails.hsCodes.length > 0 && (
                     <div className="flex flex-col py-2 border-b border-slate-50 last:border-0">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">HS Codes</span>
                        <div className="flex flex-wrap gap-1.5">
                          {data.tradeDetails.hsCodes.map((code, idx) => (
                            <CopyableTag key={idx} text={code} />
                          ))}
                        </div>
                     </div>
                   )}
                </div>

                {/* Clause 71D Section - Full width within the highlights card */}
                {data.tradeDetails.clause71D && (
                   <div className="md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-slate-100">
                      <DetailRow label="Clause 71D (Charges)" value={data.tradeDetails.clause71D} multiline={true} />
                   </div>
                )}

                {/* Generic Highlights Backup (if extraction missed specifics but got highlights) */}
                {data.keyHighlights.length > 0 && (
                  <div className="md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Other Notes</h4>
                    <ul className="space-y-2">
                      {data.keyHighlights.map((point, idx) => (
                        <li key={idx} className="flex items-start text-slate-700 text-sm">
                          <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              /* Standard List View for non-trade documents */
              <ul className="space-y-3">
                {data.keyHighlights.map((point, idx) => (
                  <li key={idx} className="flex items-start text-slate-700">
                    <span className="flex-shrink-0 mt-1 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-3 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Action Items */}
        <SectionCard title="Action Items" colorClass="text-emerald-600 bg-emerald-50/50">
          {data.actionItems.length > 0 ? (
            <ul className="space-y-3">
              {data.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start group">
                  <CheckIcon className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">No specific action items detected.</p>
          )}
        </SectionCard>

        {/* Important Dates & Entities (Fallback/Supplementary) */}
        <SectionCard title="Details & Entities" colorClass="text-amber-600 bg-amber-50/50">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                Important Dates
              </h4>
              {data.importantDates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.importantDates.map((date, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-amber-100 text-amber-800">
                      {date}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No dates found.</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center">
                People & Organizations
              </h4>
              {data.peopleOrEntities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.peopleOrEntities.map((entity, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {entity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No specific entities found.</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-400 pt-4 flex items-center justify-center space-x-3">
        <div className="flex items-center space-x-1">
           <SparklesIcon className="w-3 h-3" />
           <span>Developed by Shikander Sarker Mohit</span>
        </div>
        {generationTime && (
          <>
            <span>•</span>
            <span>Generated in {(generationTime / 1000).toFixed(1)}s</span>
          </>
        )}
      </footer>
    </article>
  );
};

export default SummaryDisplay;
