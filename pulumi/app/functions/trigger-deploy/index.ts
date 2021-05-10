import type { Handler } from 'aws-lambda';
import axios from 'axios';

export const handler: Handler = async () => {
  await axios.post(
    `${process.env.NETLIFY_DEPLOY_URL}?trigger_title=add+shop+form`,
    {}
  );
};
