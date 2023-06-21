import express, { RequestHandler } from 'express';
import bodyParser from 'body-parser';
import config from './config';
import cors from 'cors';
import { sendMailController } from './controllers/sendMail';
import { healthController } from './controllers/health';

const app = express();
app.use(cors({ origin: config.CORS_ORIGINS }));
app.use(bodyParser.json());

sendMailController(app);
healthController(app);

if (process.env.TS_JEST == undefined) {
    const port = config.PORT;
    const server = app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

    ['SIGHUP', 'SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, () => {
            server.close(() => {
                console.log(`server stopped by ${signal}`)
            })
        })
    })
}

export default app