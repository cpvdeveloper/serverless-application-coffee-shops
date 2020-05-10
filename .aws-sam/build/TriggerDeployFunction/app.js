const axios = require('axios');

exports.handler = async () => {
  try {
    await axios.post(`${process.env.NETLIFY_DEPLOY_URL}?trigger_title=add+shop+form`, {});
  } catch (err) {
    console.log('Error triggering deploy', err);
  }
};
