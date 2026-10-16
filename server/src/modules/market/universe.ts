import type { Exchange, Instrument } from "./types.js";

interface UniverseEntry {
  symbol: string;
  name: string;
  exchange: Exchange;
  providerSymbol: string;
  sector: string;
  industry: string;
  indices?: string[];
}

/**
 * Curated NSE instrument master. This is the internal, provider-independent
 * universe the screener, search and suggestion engine operate on. Provider
 * adapters map these `symbol`s to their own identifiers via `providerSymbol`.
 *
 * It is intentionally a fixed, audited list rather than a live scrape so the
 * app never depends on a provider's search endpoint for its core universe.
 */
export const UNIVERSE: UniverseEntry[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd.", exchange: "NSE", providerSymbol: "RELIANCE.NS", sector: "Energy", industry: "Oil to Chemicals", indices: ["NIFTY50"] },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd.", exchange: "NSE", providerSymbol: "TCS.NS", sector: "Information Technology", industry: "IT Services", indices: ["NIFTY50"] },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd.", exchange: "NSE", providerSymbol: "HDFCBANK.NS", sector: "Financial Services", industry: "Private Sector Bank", indices: ["NIFTY50"] },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd.", exchange: "NSE", providerSymbol: "ICICIBANK.NS", sector: "Financial Services", industry: "Private Sector Bank", indices: ["NIFTY50"] },
  { symbol: "INFY", name: "Infosys Ltd.", exchange: "NSE", providerSymbol: "INFY.NS", sector: "Information Technology", industry: "IT Services", indices: ["NIFTY50"] },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", exchange: "NSE", providerSymbol: "HINDUNILVR.NS", sector: "Consumer Defensive", industry: "FMCG", indices: ["NIFTY50"] },
  { symbol: "ITC", name: "ITC Ltd.", exchange: "NSE", providerSymbol: "ITC.NS", sector: "Consumer Defensive", industry: "Diversified FMCG", indices: ["NIFTY50"] },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", providerSymbol: "SBIN.NS", sector: "Financial Services", industry: "Public Sector Bank", indices: ["NIFTY50"] },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", exchange: "NSE", providerSymbol: "BHARTIARTL.NS", sector: "Telecommunication", industry: "Telecom Services", indices: ["NIFTY50"] },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd.", exchange: "NSE", providerSymbol: "KOTAKBANK.NS", sector: "Financial Services", industry: "Private Sector Bank", indices: ["NIFTY50"] },
  { symbol: "LT", name: "Larsen & Toubro Ltd.", exchange: "NSE", providerSymbol: "LT.NS", sector: "Industrials", industry: "Engineering & Construction", indices: ["NIFTY50"] },
  { symbol: "AXISBANK", name: "Axis Bank Ltd.", exchange: "NSE", providerSymbol: "AXISBANK.NS", sector: "Financial Services", industry: "Private Sector Bank", indices: ["NIFTY50"] },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd.", exchange: "NSE", providerSymbol: "ASIANPAINT.NS", sector: "Basic Materials", industry: "Paints", indices: ["NIFTY50"] },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd.", exchange: "NSE", providerSymbol: "MARUTI.NS", sector: "Consumer Cyclical", industry: "Auto Manufacturers", indices: ["NIFTY50"] },
  { symbol: "TITAN", name: "Titan Company Ltd.", exchange: "NSE", providerSymbol: "TITAN.NS", sector: "Consumer Cyclical", industry: "Jewellery", indices: ["NIFTY50"] },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd.", exchange: "NSE", providerSymbol: "SUNPHARMA.NS", sector: "Healthcare", industry: "Pharmaceuticals", indices: ["NIFTY50"] },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd.", exchange: "NSE", providerSymbol: "ULTRACEMCO.NS", sector: "Basic Materials", industry: "Cement", indices: ["NIFTY50"] },
  { symbol: "WIPRO", name: "Wipro Ltd.", exchange: "NSE", providerSymbol: "WIPRO.NS", sector: "Information Technology", industry: "IT Services", indices: ["NIFTY50"] },
  { symbol: "NESTLEIND", name: "Nestle India Ltd.", exchange: "NSE", providerSymbol: "NESTLEIND.NS", sector: "Consumer Defensive", industry: "Packaged Foods", indices: ["NIFTY50"] },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd.", exchange: "NSE", providerSymbol: "BAJFINANCE.NS", sector: "Financial Services", industry: "NBFC", indices: ["NIFTY50"] },
  { symbol: "HCLTECH", name: "HCL Technologies Ltd.", exchange: "NSE", providerSymbol: "HCLTECH.NS", sector: "Information Technology", industry: "IT Services", indices: ["NIFTY50"] },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd.", exchange: "NSE", providerSymbol: "TATAMOTORS.NS", sector: "Consumer Cyclical", industry: "Auto Manufacturers", indices: ["NIFTY50"] },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India Ltd.", exchange: "NSE", providerSymbol: "POWERGRID.NS", sector: "Utilities", industry: "Power Transmission", indices: ["NIFTY50"] },
  { symbol: "NTPC", name: "NTPC Ltd.", exchange: "NSE", providerSymbol: "NTPC.NS", sector: "Utilities", industry: "Power Generation", indices: ["NIFTY50"] },
  { symbol: "M&M", name: "Mahindra & Mahindra Ltd.", exchange: "NSE", providerSymbol: "M&M.NS", sector: "Consumer Cyclical", industry: "Auto Manufacturers", indices: ["NIFTY50"] },
  { symbol: "TATASTEEL", name: "Tata Steel Ltd.", exchange: "NSE", providerSymbol: "TATASTEEL.NS", sector: "Basic Materials", industry: "Steel", indices: ["NIFTY50"] },
  { symbol: "JSWSTEEL", name: "JSW Steel Ltd.", exchange: "NSE", providerSymbol: "JSWSTEEL.NS", sector: "Basic Materials", industry: "Steel", indices: ["NIFTY50"] },
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd.", exchange: "NSE", providerSymbol: "ADANIENT.NS", sector: "Industrials", industry: "Conglomerate", indices: ["NIFTY50"] },
  { symbol: "ADANIPORTS", name: "Adani Ports and Special Economic Zone Ltd.", exchange: "NSE", providerSymbol: "ADANIPORTS.NS", sector: "Industrials", industry: "Ports & Logistics", indices: ["NIFTY50"] },
  { symbol: "COALINDIA", name: "Coal India Ltd.", exchange: "NSE", providerSymbol: "COALINDIA.NS", sector: "Energy", industry: "Coal", indices: ["NIFTY50"] },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation Ltd.", exchange: "NSE", providerSymbol: "ONGC.NS", sector: "Energy", industry: "Oil & Gas Exploration", indices: ["NIFTY50"] },
  { symbol: "GRASIM", name: "Grasim Industries Ltd.", exchange: "NSE", providerSymbol: "GRASIM.NS", sector: "Basic Materials", industry: "Diversified", indices: ["NIFTY50"] },
  { symbol: "TECHM", name: "Tech Mahindra Ltd.", exchange: "NSE", providerSymbol: "TECHM.NS", sector: "Information Technology", industry: "IT Services", indices: ["NIFTY50"] },
  { symbol: "INDUSINDBK", name: "IndusInd Bank Ltd.", exchange: "NSE", providerSymbol: "INDUSINDBK.NS", sector: "Financial Services", industry: "Private Sector Bank", indices: ["NIFTY50"] },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories Ltd.", exchange: "NSE", providerSymbol: "DRREDDY.NS", sector: "Healthcare", industry: "Pharmaceuticals", indices: ["NIFTY50"] },
  { symbol: "CIPLA", name: "Cipla Ltd.", exchange: "NSE", providerSymbol: "CIPLA.NS", sector: "Healthcare", industry: "Pharmaceuticals", indices: ["NIFTY50"] },
  { symbol: "EICHERMOT", name: "Eicher Motors Ltd.", exchange: "NSE", providerSymbol: "EICHERMOT.NS", sector: "Consumer Cyclical", industry: "Auto Manufacturers", indices: ["NIFTY50"] },
  { symbol: "SHREECEM", name: "Shree Cement Ltd.", exchange: "NSE", providerSymbol: "SHREECEM.NS", sector: "Basic Materials", industry: "Cement", indices: ["NIFTY50"] },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd.", exchange: "NSE", providerSymbol: "BAJAJFINSV.NS", sector: "Financial Services", industry: "Holding Company", indices: ["NIFTY50"] },
  { symbol: "BRITANNIA", name: "Britannia Industries Ltd.", exchange: "NSE", providerSymbol: "BRITANNIA.NS", sector: "Consumer Defensive", industry: "Packaged Foods", indices: ["NIFTY50"] },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp Ltd.", exchange: "NSE", providerSymbol: "HEROMOTOCO.NS", sector: "Consumer Cyclical", industry: "Auto Manufacturers", indices: ["NIFTY50"] },
  { symbol: "HINDALCO", name: "Hindalco Industries Ltd.", exchange: "NSE", providerSymbol: "HINDALCO.NS", sector: "Basic Materials", industry: "Aluminium", indices: ["NIFTY50"] },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise Ltd.", exchange: "NSE", providerSymbol: "APOLLOHOSP.NS", sector: "Healthcare", industry: "Healthcare Facilities", indices: ["NIFTY50"] },
  { symbol: "DIVISLAB", name: "Divi's Laboratories Ltd.", exchange: "NSE", providerSymbol: "DIVISLAB.NS", sector: "Healthcare", industry: "Pharmaceuticals", indices: ["NIFTY50"] },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd.", exchange: "NSE", providerSymbol: "BAJAJ-AUTO.NS", sector: "Consumer Cyclical", industry: "Auto Manufacturers", indices: ["NIFTY50"] },
  { symbol: "TATACONSUM", name: "Tata Consumer Products Ltd.", exchange: "NSE", providerSymbol: "TATACONSUM.NS", sector: "Consumer Defensive", industry: "Packaged Foods", indices: ["NIFTY50"] },
  { symbol: "SBILIFE", name: "SBI Life Insurance Company Ltd.", exchange: "NSE", providerSymbol: "SBILIFE.NS", sector: "Financial Services", industry: "Life Insurance", indices: ["NIFTY50"] },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance Company Ltd.", exchange: "NSE", providerSymbol: "HDFCLIFE.NS", sector: "Financial Services", industry: "Life Insurance", indices: ["NIFTY50"] },
  { symbol: "LTIM", name: "LTIMindtree Ltd.", exchange: "NSE", providerSymbol: "LTIM.NS", sector: "Information Technology", industry: "IT Services", indices: ["NIFTY50"] },

  { symbol: "DMART", name: "Avenue Supermarts Ltd.", exchange: "NSE", providerSymbol: "DMART.NS", sector: "Consumer Defensive", industry: "Retail", indices: ["NIFTYNEXT50"] },
  { symbol: "PIDILITIND", name: "Pidilite Industries Ltd.", exchange: "NSE", providerSymbol: "PIDILITIND.NS", sector: "Basic Materials", industry: "Specialty Chemicals", indices: ["NIFTYNEXT50"] },
  { symbol: "GODREJCP", name: "Godrej Consumer Products Ltd.", exchange: "NSE", providerSymbol: "GODREJCP.NS", sector: "Consumer Defensive", industry: "FMCG", indices: ["NIFTYNEXT50"] },
  { symbol: "DABUR", name: "Dabur India Ltd.", exchange: "NSE", providerSymbol: "DABUR.NS", sector: "Consumer Defensive", industry: "FMCG" },
  { symbol: "HAVELLS", name: "Havells India Ltd.", exchange: "NSE", providerSymbol: "HAVELLS.NS", sector: "Industrials", industry: "Electrical Equipment" },
  { symbol: "SIEMENS", name: "Siemens Ltd.", exchange: "NSE", providerSymbol: "SIEMENS.NS", sector: "Industrials", industry: "Electrical Equipment" },
  { symbol: "DLF", name: "DLF Ltd.", exchange: "NSE", providerSymbol: "DLF.NS", sector: "Real Estate", industry: "Real Estate Development" },
  { symbol: "ZOMATO", name: "Zomato Ltd.", exchange: "NSE", providerSymbol: "ZOMATO.NS", sector: "Consumer Cyclical", industry: "Internet Retail", indices: ["NIFTYNEXT50"] },
  { symbol: "PAYTM", name: "One 97 Communications Ltd.", exchange: "NSE", providerSymbol: "PAYTM.NS", sector: "Financial Services", industry: "Fintech" },
  { symbol: "NYKAA", name: "FSN E-Commerce Ventures Ltd.", exchange: "NSE", providerSymbol: "NYKAA.NS", sector: "Consumer Cyclical", industry: "Internet Retail" },
  { symbol: "TRENT", name: "Trent Ltd.", exchange: "NSE", providerSymbol: "TRENT.NS", sector: "Consumer Cyclical", industry: "Retail", indices: ["NIFTYNEXT50"] },
  { symbol: "BEL", name: "Bharat Electronics Ltd.", exchange: "NSE", providerSymbol: "BEL.NS", sector: "Industrials", industry: "Aerospace & Defence", indices: ["NIFTYNEXT50"] },
  { symbol: "HAL", name: "Hindustan Aeronautics Ltd.", exchange: "NSE", providerSymbol: "HAL.NS", sector: "Industrials", industry: "Aerospace & Defence" },
  { symbol: "IRCTC", name: "Indian Railway Catering & Tourism Corp Ltd.", exchange: "NSE", providerSymbol: "IRCTC.NS", sector: "Industrials", industry: "Travel Services" },
  { symbol: "PFC", name: "Power Finance Corporation Ltd.", exchange: "NSE", providerSymbol: "PFC.NS", sector: "Financial Services", industry: "NBFC" },
  { symbol: "RECLTD", name: "REC Ltd.", exchange: "NSE", providerSymbol: "RECLTD.NS", sector: "Financial Services", industry: "NBFC" },
  { symbol: "IOC", name: "Indian Oil Corporation Ltd.", exchange: "NSE", providerSymbol: "IOC.NS", sector: "Energy", industry: "Oil & Gas Refining" },
  { symbol: "BPCL", name: "Bharat Petroleum Corporation Ltd.", exchange: "NSE", providerSymbol: "BPCL.NS", sector: "Energy", industry: "Oil & Gas Refining" },
  { symbol: "GAIL", name: "GAIL (India) Ltd.", exchange: "NSE", providerSymbol: "GAIL.NS", sector: "Utilities", industry: "Gas Distribution" },
  { symbol: "VEDL", name: "Vedanta Ltd.", exchange: "NSE", providerSymbol: "VEDL.NS", sector: "Basic Materials", industry: "Diversified Metals" },
  { symbol: "AMBUJACEM", name: "Ambuja Cements Ltd.", exchange: "NSE", providerSymbol: "AMBUJACEM.NS", sector: "Basic Materials", industry: "Cement" },
  { symbol: "BANKBARODA", name: "Bank of Baroda", exchange: "NSE", providerSymbol: "BANKBARODA.NS", sector: "Financial Services", industry: "Public Sector Bank" },
  { symbol: "PNB", name: "Punjab National Bank", exchange: "NSE", providerSymbol: "PNB.NS", sector: "Financial Services", industry: "Public Sector Bank" },
  { symbol: "CANBK", name: "Canara Bank", exchange: "NSE", providerSymbol: "CANBK.NS", sector: "Financial Services", industry: "Public Sector Bank" },
  { symbol: "MOTHERSON", name: "Samvardhana Motherson International Ltd.", exchange: "NSE", providerSymbol: "MOTHERSON.NS", sector: "Consumer Cyclical", industry: "Auto Parts" },
  { symbol: "TVSMOTOR", name: "TVS Motor Company Ltd.", exchange: "NSE", providerSymbol: "TVSMOTOR.NS", sector: "Consumer Cyclical", industry: "Auto Manufacturers" },
  { symbol: "BAJAJHLDNG", name: "Bajaj Holdings & Investment Ltd.", exchange: "NSE", providerSymbol: "BAJAJHLDNG.NS", sector: "Financial Services", industry: "Holding Company" },
  { symbol: "LICI", name: "Life Insurance Corporation of India", exchange: "NSE", providerSymbol: "LICI.NS", sector: "Financial Services", industry: "Life Insurance" },
  { symbol: "JIOFIN", name: "Jio Financial Services Ltd.", exchange: "NSE", providerSymbol: "JIOFIN.NS", sector: "Financial Services", industry: "NBFC" },
  { symbol: "CHOLAFIN", name: "Cholamandalam Investment and Finance Co Ltd.", exchange: "NSE", providerSymbol: "CHOLAFIN.NS", sector: "Financial Services", industry: "NBFC" },
  { symbol: "SHRIRAMFIN", name: "Shriram Finance Ltd.", exchange: "NSE", providerSymbol: "SHRIRAMFIN.NS", sector: "Financial Services", industry: "NBFC" },
  { symbol: "MUTHOOTFIN", name: "Muthoot Finance Ltd.", exchange: "NSE", providerSymbol: "MUTHOOTFIN.NS", sector: "Financial Services", industry: "NBFC" },
  { symbol: "TORNTPHARM", name: "Torrent Pharmaceuticals Ltd.", exchange: "NSE", providerSymbol: "TORNTPHARM.NS", sector: "Healthcare", industry: "Pharmaceuticals" },
  { symbol: "LUPIN", name: "Lupin Ltd.", exchange: "NSE", providerSymbol: "LUPIN.NS", sector: "Healthcare", industry: "Pharmaceuticals" },
  { symbol: "AUROPHARMA", name: "Aurobindo Pharma Ltd.", exchange: "NSE", providerSymbol: "AUROPHARMA.NS", sector: "Healthcare", industry: "Pharmaceuticals" },
  { symbol: "ALKEM", name: "Alkem Laboratories Ltd.", exchange: "NSE", providerSymbol: "ALKEM.NS", sector: "Healthcare", industry: "Pharmaceuticals" },
  { symbol: "MPHASIS", name: "Mphasis Ltd.", exchange: "NSE", providerSymbol: "MPHASIS.NS", sector: "Information Technology", industry: "IT Services" },
  { symbol: "PERSISTENT", name: "Persistent Systems Ltd.", exchange: "NSE", providerSymbol: "PERSISTENT.NS", sector: "Information Technology", industry: "IT Services" },
  { symbol: "COFORGE", name: "Coforge Ltd.", exchange: "NSE", providerSymbol: "COFORGE.NS", sector: "Information Technology", industry: "IT Services" },
  { symbol: "INDIGO", name: "InterGlobe Aviation Ltd.", exchange: "NSE", providerSymbol: "INDIGO.NS", sector: "Industrials", industry: "Airlines" },
  { symbol: "JINDALSTEL", name: "Jindal Steel & Power Ltd.", exchange: "NSE", providerSymbol: "JINDALSTEL.NS", sector: "Basic Materials", industry: "Steel" },
  { symbol: "SAIL", name: "Steel Authority of India Ltd.", exchange: "NSE", providerSymbol: "SAIL.NS", sector: "Basic Materials", industry: "Steel" },
  { symbol: "NMDC", name: "NMDC Ltd.", exchange: "NSE", providerSymbol: "NMDC.NS", sector: "Basic Materials", industry: "Mining" },
  { symbol: "PIIND", name: "PI Industries Ltd.", exchange: "NSE", providerSymbol: "PIIND.NS", sector: "Basic Materials", industry: "Agrochemicals" },
  { symbol: "SRF", name: "SRF Ltd.", exchange: "NSE", providerSymbol: "SRF.NS", sector: "Basic Materials", industry: "Specialty Chemicals" },
  { symbol: "UBL", name: "United Breweries Ltd.", exchange: "NSE", providerSymbol: "UBL.NS", sector: "Consumer Defensive", industry: "Brewers" },
  { symbol: "MCDOWELL-N", name: "United Spirits Ltd.", exchange: "NSE", providerSymbol: "MCDOWELL-N.NS", sector: "Consumer Defensive", industry: "Brewers" },
  { symbol: "PAGEIND", name: "Page Industries Ltd.", exchange: "NSE", providerSymbol: "PAGEIND.NS", sector: "Consumer Cyclical", industry: "Apparel" },
  { symbol: "VOLTAS", name: "Voltas Ltd.", exchange: "NSE", providerSymbol: "VOLTAS.NS", sector: "Consumer Cyclical", industry: "Consumer Electronics" },
  { symbol: "ABCAPITAL", name: "Aditya Birla Capital Ltd.", exchange: "NSE", providerSymbol: "ABCAPITAL.NS", sector: "Financial Services", industry: "NBFC" },
];

export const INDEX_DEFINITIONS: { symbol: string; name: string; providerSymbol: string }[] = [
  { symbol: "NIFTY50", name: "NIFTY 50", providerSymbol: "^NSEI" },
  { symbol: "NIFTYBANK", name: "NIFTY Bank", providerSymbol: "^NSEBANK" },
  { symbol: "SENSEX", name: "S&P BSE SENSEX", providerSymbol: "^BSESN" },
  { symbol: "NIFTYIT", name: "NIFTY IT", providerSymbol: "^CNXIT" },
  { symbol: "NIFTYMIDCAP", name: "NIFTY Midcap 100", providerSymbol: "^CNX100" },
];

const bySymbol = new Map(UNIVERSE.map((u) => [u.symbol, u]));

export function toInstrument(entry: UniverseEntry): Instrument {
  return {
    symbol: entry.symbol,
    name: entry.name,
    exchange: entry.exchange,
    currency: "INR",
    providerSymbol: entry.providerSymbol,
    sector: entry.sector,
    industry: entry.industry,
    indexMemberships: entry.indices ?? [],
  };
}

export const INSTRUMENTS: Instrument[] = UNIVERSE.map(toInstrument);

export function findInstrument(symbol: string): Instrument | undefined {
  const entry = bySymbol.get(symbol.toUpperCase());
  return entry ? toInstrument(entry) : undefined;
}

export function allSectors(): string[] {
  return [...new Set(UNIVERSE.map((u) => u.sector))].sort();
}

export function allIndustries(): string[] {
  return [...new Set(UNIVERSE.map((u) => u.industry))].sort();
}

export function allIndices(): string[] {
  return [...new Set(UNIVERSE.flatMap((u) => u.indices ?? []))].sort();
}
