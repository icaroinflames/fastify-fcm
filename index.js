const fp = require("fastify-plugin");
const { google } = require("googleapis");
const axios = require('axios');

const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';


module.exports = fp(async function (fastify, options) {


    //FCM AUTH CONFIGURATION
    if (!options?.client_email || !options?.private_key || !options?.project_id) {
        throw new Error("FCM configuration is required");
    }

    const fcm_account_key = options;
    const {
        client_email,
        private_key,
        project_id
    } = fcm_account_key;
    const SCOPES = [MESSAGING_SCOPE];


    //FCM SEND API CONFIGURATION
    const FCM_API = "https://fcm.googleapis.com/v1/projects/" + project_id + "/messages:send";

    const axiosInstance = axios.create({
        baseURL: FCM_API,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    axiosInstance.interceptors.request.use(async function (config) {
        await refreshToken();
        config.headers.Authorization = `Bearer ${fastify.fcm.tokenData.access_token}`;

        return config;
    });


    const getTokenData = async () => {

        if (isTokenAvailable()) return fastify?.fcm?.tokenData;

        fastify.log.debug("Getting token");

        const { access_token, expiry_date } = await new Promise(function (resolve, reject) {
            const jwtClient = new google.auth.JWT(
                client_email,
                null,
                private_key,
                SCOPES,
                null
            );
            jwtClient.authorize(function (err, tokens) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(tokens);
            });
        });

        return { access_token, expiry_date };
    }

    const isTokenAvailable = () => {
        fastify.log.debug("Checking token");

        const tokenData = fastify?.fcm?.tokenData;
        fastify.log.debug({ asdf: fastify?.fcm?.tokenData });
        if (!tokenData) return false;

        const expiryDate = tokenData.expiry_date;

        fastify.log.debug({ expiryDate, dateNow: Date.now() });

        const TIME_MARGIN = 1 * 60 * 1000; // 1 minute
        if (!expiryDate || expiryDate < Date.now() + TIME_MARGIN) {
            return false;
        }
        return true;
    }

    const refreshToken = async () => {
        fastify.log.debug("Refreshing token");

        const { access_token, expiry_date } = await getTokenData();
        fastify.fcm.tokenData = { access_token, expiry_date };
    }

    fastify.decorate("fcm", {
        tokenData: await getTokenData(),
        send: async ({ tokens, topic, message }) => {
            if (!tokens && !topic) {
                throw new Error("tokens or topic is required");
            }

            if (!message) {
                throw new Error("message is required");
            }

            if (tokens && tokens.length === 0) {
                throw new Error("tokens is empty");
            }

            const responses = {
                topic: null,
                tokens: null
            };

            if (topic) {
                responses.topic = await axiosInstance.post("", {
                    message: {
                        topic: topic,
                        ...message
                    }
                });
            }
            if (tokens) {
                responses.tokens = await Promise.all(tokens.map(async token => {
                    const response = await axiosInstance.post("", {
                        message: {
                            token: token,
                            ...message
                        }
                    });
                    return response.data;
                }));
            }

            return responses;
        },
        refreshToken
    });

});