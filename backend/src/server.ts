import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`InvestPals API ascultă pe http://localhost:${config.port}`);
});
