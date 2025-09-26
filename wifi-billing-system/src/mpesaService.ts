import axios from 'axios';

function getEnvVars() {
    return {
        consumerKey: process.env.MPESA_CONSUMER_KEY!,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
        shortcode: process.env.MPESA_SHORTCODE!,
        passkey: process.env.MPESA_PASSKEY!,
        callbackUrl: process.env.MPESA_CALLBACK_URL!,
    };
}

async function getAccessToken() {
    const { consumerKey, consumerSecret } = getEnvVars();
    console.log('MPESA_CONSUMER_KEY:', consumerKey);
    console.log('MPESA_CONSUMER_SECRET:', consumerSecret);
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await axios.get<{ access_token: string }>(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.access_token;
}

export async function initiateStkPush(phone: string, amount: number) {
    const { shortcode, passkey, callbackUrl } = getEnvVars();
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const payload = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: 'WiFi',
        TransactionDesc: 'WiFi Payment'
    };

    const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
}