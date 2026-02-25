export async function onRequest(context) {
    const { request } = context;
    const { searchParams } = new URL(request.url);
    
    const city = searchParams.get('city') || 'Albuquerque';
    const specialty = searchParams.get('specialty') || '';

    const apiUrl = new URL('https://npiregistry.cms.hhs.gov/api/?version=2.1');
    apiUrl.searchParams.append('state', 'NM');
    apiUrl.searchParams.append('city', city);
    if (specialty) apiUrl.searchParams.append('taxonomy_description', specialty);
    apiUrl.searchParams.append('limit', '50');

    try {
        const response = await fetch(apiUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();

        let results = [];
        if (data.results) {
            results = data.results.map(provider => {
                const basic = provider.basic || {};
                const address = (provider.addresses && provider.addresses[0]) || {};
                const taxonomy = (provider.taxonomies && provider.taxonomies[0]) || {};

                return {
                    name: `${basic.first_name || ''} ${basic.last_name || basic.organization_name || ''}`.trim(),
                    specialty: taxonomy.desc || 'General Practice',
                    address: `${address.address_1 || ''}, ${address.city || ''}, NM ${address.postal_code ? address.postal_code.substring(0,5) : ''}`,
                    phone: address.telephone_number || 'Not provided',
                };
            });
        }

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Could not connect to provider database." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
