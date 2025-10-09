/**
 * Japanese address geocoding utility
 * Handles address normalization and geocoding with OpenStreetMap Nominatim API
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  normalized: string;
}

/**
 * Normalizes Japanese address for better geocoding accuracy
 * @param address Raw Japanese address
 * @returns Normalized address string
 */
function normalizeJapaneseAddress(address: string): string {
  let normalized = address.trim();
  
  // 全角数字を半角に変換
  normalized = normalized.replace(/[０-９]/g, (char) => 
    String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
  );
  
  // 漢数字を半角数字に変換
  const kanjiNumbers: Record<string, string> = {
    '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
    '六': '6', '七': '7', '八': '8', '九': '9', '十': '10',
    '十一': '11', '十二': '12', '十三': '13', '十四': '14', '十五': '15',
    '十六': '16', '十七': '17', '十八': '18', '十九': '19', '二十': '20'
  };
  
  Object.entries(kanjiNumbers).forEach(([kanji, num]) => {
    normalized = normalized.replace(new RegExp(kanji, 'g'), num);
  });
  
  // 番地の統一化: 番号 → -
  normalized = normalized.replace(/(\d+)番(\d+)号/g, '$1-$2');
  normalized = normalized.replace(/(\d+)番(\d+)/g, '$1-$2');
  
  // 丁目の前後空白除去
  normalized = normalized.replace(/\s*(\d+)\s*丁目\s*/g, '$1丁目');
  
  // 不要な空白を除去
  normalized = normalized.replace(/\s+/g, '');
  
  return normalized;
}

/**
 * Creates alternative address formats for better geocoding
 * @param normalized Normalized address
 * @returns Array of address variations to try
 */
function createAddressVariations(normalized: string): string[] {
  const variations = [normalized];
  
  // 丁目をハイフン表記に変換したバリエーション
  const hyphenVersion = normalized.replace(/(\d+)丁目(\d+)/g, '$1-$2');
  if (hyphenVersion !== normalized) {
    variations.push(hyphenVersion);
  }
  
  // 完全ハイフン表記 (例: 4丁目19-24 → 4-19-24)
  const fullHyphenVersion = normalized.replace(/(\d+)丁目/g, '$1-');
  if (fullHyphenVersion !== normalized && fullHyphenVersion !== hyphenVersion) {
    variations.push(fullHyphenVersion);
  }
  
  return variations;
}

/**
 * Queries Nominatim API with retry logic
 * @param address Address to geocode
 * @returns Promise<GeocodeResult | null>
 */
async function queryNominatim(address: string): Promise<GeocodeResult | null> {
  const maxRetries = 3;
  const retryDelay = 500;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1&countrycodes=jp`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AIO Hub Geocoding Service (https://aiohub.jp)'
        }
      });
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        throw new Error('Rate limit exceeded');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          normalized: address
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Geocoding attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      } else {
        throw error;
      }
    }
  }
  
  return null;
}

/**
 * Geocodes a Japanese address with normalization and fallback strategies
 * @param address Japanese address string
 * @returns Promise<GeocodeResult> - Coordinates and normalized address
 * @throws Error if geocoding fails completely
 */
export async function geocodeJP(address: string): Promise<GeocodeResult> {
  if (!address || address.trim().length === 0) {
    throw new Error('住所が入力されていません');
  }
  
  // Step 1: Normalize the address
  const normalized = normalizeJapaneseAddress(address);
  
  // Step 2: Create address variations
  const variations = createAddressVariations(normalized);
  
  // Step 3: Try each variation with Nominatim
  for (const variation of variations) {
    try {
      const result = await queryNominatim(variation);
      if (result) {
        return {
          ...result,
          normalized: normalized // Return the main normalized form
        };
      }
    } catch (error) {
      console.warn(`Failed to geocode variation "${variation}":`, error);
      // Continue to next variation
    }
  }
  
  // Step 4: If all variations fail, try with just the prefecture + city
  const prefectureCityMatch = normalized.match(/^(.+?[都道府県].+?[市区町村])/);
  if (prefectureCityMatch) {
    try {
      const result = await queryNominatim(prefectureCityMatch[1]);
      if (result) {
        console.warn('Only prefecture/city level geocoding succeeded for:', address);
        return {
          ...result,
          normalized: normalized
        };
      }
    } catch (error) {
      console.warn('Prefecture/city fallback also failed:', error);
    }
  }
  
  throw new Error('住所の位置を特定できませんでした。住所の表記を確認するか、手動で緯度経度を入力してください。');
}

/**
 * Validates if coordinates are within Japan's approximate bounds
 * @param lat Latitude
 * @param lng Longitude
 * @returns boolean
 */
export function isValidJapaneseCoordinates(lat: number, lng: number): boolean {
  // Japan's approximate bounds
  const bounds = {
    north: 45.5,   // 北海道北端
    south: 24.0,   // 沖縄南端
    east: 146.0,   // 択捉島東端
    west: 123.0    // 与那国島西端
  };
  
  return lat >= bounds.south && lat <= bounds.north && 
         lng >= bounds.west && lng <= bounds.east;
}