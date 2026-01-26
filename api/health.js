export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      message: 'Spirit AI v2.1.0 - API is running',
      timestamp: new Date().toISOString(),
      features: [
        'GlowingShadow Animations',
        'EtherealShadows Background',
        'Multi-deity Conversations',
        'Voice Interactions',
        'User Authentication'
      ]
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}