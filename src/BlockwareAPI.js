const request = require("request");
const jwt_decode = require('jwt-decode');
const Paths = require('./paths');
const FS = require("fs");

const CLIENT_ID = '634d5f4e1f279556e58cb323';

class BlockwareAPI {

    constructor(authInfo) {
        this._authInfo = authInfo;
        this._userInfo = {};
        if (!authInfo) {
            this.readToken();
        }
    }

    getUserInfo() {
        return this._userInfo;
    }

    readToken() {
        if (FS.existsSync(Paths.AUTH_TOKEN)) {
            this._authInfo = JSON.parse(FS.readFileSync(Paths.AUTH_TOKEN).toString());
            this._userInfo = jwt_decode(this._authInfo.access_token);
        }
    }

    async createDeviceCode() {

        return this._send({
            url: `${this._authInfo.base_url}/oauth2/device/code`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json'
            },
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID
            }).toString()
        })
    }

    async getCurrentIdentity() {
        if (this._userInfo?.sub) {
            return this.getIdentity(this._userInfo.sub);
        }
        throw new Error('No current identity');
    }

    async getIdentity(identityId) {
        const accessToken = await this.getAccessToken();
        const url = `${this._authInfo.base_url}/api/identities/${identityId}`;
        return this._send({
            url,
            headers: {
                'authorization': `Bearer ${accessToken}`,
                'accept': 'application/json'
            },
            method: 'GET'
        })
    }

    async getAccessToken() {
        if (this._authInfo.expire_time < Date.now()) {
            const token = await this.authorize({
                grant_type: 'refresh_token',
                refresh_token: this._authInfo.refresh_token
            });
            this.saveToken(token);
        }

        return this._authInfo.access_token;
    }

    async authorize(payload) {

        return this._send({
            url: `${this._authInfo.base_url}/oauth2/token`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json'
            },
            method: 'POST',
            body: new URLSearchParams({
                ...payload,
                client_id: CLIENT_ID
            }).toString()
        })
    }

    async _send(opts) {
        return new Promise((resolve, reject) => {

            request(opts, (err, response, responseBody) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (response.statusCode > 299) {
                    const errorBody = JSON.parse(responseBody);
                    reject(errorBody);
                    return;
                }

                try {
                    resolve(JSON.parse(responseBody));
                } catch (e) {
                    console.log('response', responseBody);
                    reject(e);
                }
            })
        });
    }

    removeToken() {
        if (FS.existsSync(Paths.AUTH_TOKEN)) {
            FS.unlinkSync(Paths.AUTH_TOKEN);
            this._authInfo = {
                base_url:this._authInfo.base_url
            };
            return true;
        }

        return false;
    }

    saveToken(token) {
        this._authInfo = {
            ...token,
            base_url:this._authInfo.base_url,
            expire_time: Date.now() + token.expires_in
        };
        FS.writeFileSync(Paths.AUTH_TOKEN, JSON.stringify(this._authInfo, null, 2));
    }
}

module.exports = BlockwareAPI;