import axios from "axios";
import string_builder from "./string-builder";

/**
 * This class is meant for server implementations, ie node.js to GraphQL server. Simpler and
 * meant mainly to have separate instances to stop confusion
 */
const graph_server = {

    url: null,

    /**
     * Returns the string version on the data object request
     * @param data
     * @returns {string}
     */
    getQueryToString(data){
        return string_builder.buildQueryString(data);
    },

    /**
     * Wrapper main call for API query calls
     * @param data - Object
     * @returns {Promise}
     */
    getEndPointQuery(data) {
        return new Promise((resolve, reject) => {
                let query = '';

                if (Array.isArray(data)) {
                    data.forEach((obj) => {
                        query += string_builder.buildQueryString(obj);
                    });
                } else {
                    query += string_builder.buildQueryString(data);
                }

                query = '{' + query + '}';

                axios.post(this.url, {query: query})
                    .then(response => {
                        resolve(response.data.data[data.endpoint]);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        );
    }
}

export default graph_server;
