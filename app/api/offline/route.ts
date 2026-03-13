import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceids, offlinehours, token } = body;

    if (!token) {
      return NextResponse.json(
        { status: -1, cause: 'No token provided', error: 'MISSING_TOKEN' },
        { status: 401 }
      );
    }

    if (!deviceids || !Array.isArray(deviceids)) {
      return NextResponse.json(
        { status: -1, cause: 'Device IDs array is required', error: 'MISSING_DEVICEIDS' },
        { status: 400 }
      );
    }

    const apiUrl = `https://api.gps51.com/openapi?action=reportoffline&token=${token}&serverid=2`;
    
    const requestBody = {
      deviceids,
      offlinehours: offlinehours !== undefined ? offlinehours : 0
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { status: data.status || -1, cause: data.cause || 'API request failed', error: 'API_ERROR' },
        { status: response.status }
      );
    }

    // Enhance with HERE API addresses if available
    if (data.status === 0 && data.records && data.records.length > 0) {
      const HERE_API_KEY = 'pFwk-Dw4BG6-x5Cm1A6CQu5I5cnRwQ-R9P1-nbnTC0I';
      const addressmap: Record<string, string> = data.addressmap || {};
      
      const coordinates = new Set<string>();
      for (const device of data.records) {
        if (device.callat && device.callon) {
          coordinates.add(`${device.callat.toFixed(5)}_${device.callon.toFixed(5)}`);
        }
      }

      for (const coordKey of coordinates) {
        if (!addressmap[coordKey]) {
          try {
            const [lat, lon] = coordKey.split('_');
            const geoResponse = await fetch(
              `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lon}&apiKey=${HERE_API_KEY}`
            );
            
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData.items && geoData.items.length > 0 && geoData.items[0].address.label) {
                addressmap[coordKey] = geoData.items[0].address.label;
              }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error('Error fetching address:', err);
          }
        }
      }
      
      data.addressmap = addressmap;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in offline API route:', error);
    return NextResponse.json(
      { 
        status: -1, 
        cause: 'Internal server error', 
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR' 
      },
      { status: 500 }
    );
  }
}
