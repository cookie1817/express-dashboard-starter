import { Connection, createConnection, ConnectionStates } from "mongoose";

import { logger } from 'src/infra/logger';
import { sleep } from 'src/infra/sleep';
import { DATABASE_URL, IS_TEST } from 'src/config';


// Handles unstable/intermitten connection lost to DB
function connectionGuard(connection: Connection) {
   
        // Add handler on pool error event
        connection.on('error', async (err) => {
            logger.error(err, 'Connection pool erring out, Reconnecting...');
            try {
                await connection.close();
            } catch (innerErr) {
                logger.error(innerErr, 'Failed to close connection');
            }
            while (connection.readyState !== ConnectionStates.connected) {
                try {
                    await connection.asPromise(); // eslint-disable-line
                    logger.info('Reconnected DB');
                } catch (error) {
                    logger.error(error, 'Reconnect Error');
                }

                // if (connection.readyState !== ConnectionStates.connected) {
                //     // Throttle retry
                //     await sleep(500); // eslint-disable-line
                // }
            }
        });
}

// 1. Wait for db to come online and connect
// 2. On connection instability, able to reconnect
// 3. The app should never die due to connection issue
// 3.a. We rethrow the connection error in test mode to prevent open handles issue in Jest
export async function connect(): Promise<void> {
    let connection: Connection;
    let isConnected = false;

    logger.info('Connecting to DB...');
    while (!isConnected) {
        try {
            connection = await createConnection(DATABASE_URL);
            if (connection.readyState !== ConnectionStates.connected) {
                isConnected = true;
            }
        } catch (error) {
            logger.error(error, 'createConnection Error');

            if (IS_TEST) {
                throw error;
            }
        }

        if (!isConnected) {
            // Throttle retry
            await sleep(500); // eslint-disable-line
        }

    }

    logger.info('Connected to DB');
    connectionGuard(connection);
}
