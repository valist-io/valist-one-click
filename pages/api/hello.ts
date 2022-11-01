import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { code } = req.query;

  const data = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code,
    }
  );
  if (data) {
    console.log('data', data);
    res.status(200).json(String(data.data).split('=')[1]);
  } else {
    res.status(404);
  }
}
