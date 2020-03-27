const graph = {

    url: (process.env.NODE_ENV == 'production') ? process.env.MIX_GRAPHQL_URL : process.env.MIX_GRAPHQL_URL,


    /**
     * Wrapper main call for API query calls
     * @param data - Object
     * @returns {Promise}
     */
    getEndPointQuery(data) {

        let self = this;

        return new Promise((resolve, reject) => {

                let query = self.buildQueryString(data);

                axios.post(this.url, {query: query})
                    .then(response => {
                        resolve(response.data.data[data.endpoint]);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        );
    },

    /**
     * Wrapper main call for API mutation calls
     * @param data - Object
     * @returns {Promise}
     */
    getEndPointMutation(data) {

        let self = this;

        return new Promise(
            function (resolve, reject) {

                let query = self.buildQueryString(data);
                let mutation = 'mutation' + query;

                axios.post(this.url, {query: mutation})
                    .then(response => {
                        resolve(response.data.data[data.endpoint]);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        );
    },

    /**
     * Complies the request data object into a string for the graphql query
     * @param data
     * @returns {string}
     */
    buildQueryString(data) {
        let self = this;

        let paginate = false;
        let query = '';

        // set endpoint
        query += data.endpoint;


        // add paginator params to the main params object
        if (Object.prototype.hasOwnProperty.call(data, 'paginate')) {
            console.log(data);
            if (typeof data.params === 'undefined') {
                data.params = {};
            }

            data.params.first = data.paginate.first;
            data.params.page = data.paginate.page;

            paginate = '{paginatorInfo{count,currentPage,firstItem,hasMorePages,lastItem,lastPage,perPage},';
        }

        // if just standard params are set with no raw params, you cant do params and params raw
        if (Object.prototype.hasOwnProperty.call(data, 'params') && !Object.prototype.hasOwnProperty.call(data, 'paramsRaw')) {
            console.log('have params');
            query += '(' + self.paramsToString(data.params) + ')';
        }

        //otherwise we can add the params raw to the query
        if (Object.prototype.hasOwnProperty.call(data, 'paramsRaw') && Object.prototype.hasOwnProperty.call(data, 'paginate')) {
            query += '(' + self.paramsToString(data.params) + data.paramsRaw + ')';
        }else if (Object.prototype.hasOwnProperty.call(data, 'paramsRaw')){
            query += '(' + data.paramsRaw + ')';
        }

        // add paginator return fields if set (this var will be null otherwise)
        if (paginate !== false) {
            query += paginate;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'paginate')) query += 'data';

        if (Object.prototype.hasOwnProperty.call(data, 'fields')) {
            query += '{' + self.fieldsToString(data.fields);

            if (Object.prototype.hasOwnProperty.call(data, 'relations')) {
                query += ',' + self.relationsToString(data.relations);
            }

            query += '}';
        }

        if (Object.prototype.hasOwnProperty.call(data, 'fieldsRaw')) {
            query += data.fieldsRaw;
        }


        if (Object.prototype.hasOwnProperty.call(data, 'paginate')) query += '}';

        return '{' + query + '}';
    },

    /**
     * Takes the parameters part of the request object and return it as a string. Recursively goes through nested objects
     * @param params
     * @returns {string}
     */
    paramsToString(params) {
        let self = this;
        let parmString = '';

        for (const [key, value] of Object.entries(params)) {

            if (value !== null) {
                if (Array.isArray(value)) {
                    var newValue = value.map(function(item) { return '"' + item + '"' }).join(',');

                    parmString += key + ':[' + newValue + '],';
                } else {
                    switch (typeof value) {
                        case "string":
                            parmString += key + ':"' + value + '",';
                            break;

                        case "number":
                            parmString += key + ':' + value + ',';
                            break;

                        default:
                            parmString += key + ':{' + self.paramsToString(value) + '},';
                            break;
                    }
                }
            }
        }

        return parmString.substring(0, parmString.length - 1);
    },

    /**
     * Takes the fields array and returns as a string
     * @param fieldArray
     * @returns {string}
     */
    fieldsToString(fieldArray) {

        let fieldString = '';

        fieldArray.forEach((field) => {
            if (typeof field === "string") {
                fieldString += field + ',';
            }
        });

        return fieldString.substring(0, fieldString.length - 1);
    },

    /**
     * Takes the relations part of the request data and returns it as a string. Recursively goes through nested relations
     * @param relations
     * @returns {string}
     */
    relationsToString(relations) {
        let self = this;
        let relationString = '';

        for (const [key, value] of Object.entries(relations)) {
            relationString += key + '{';

            relationString += self.fieldsToString(value.fields) + '},';

            if (Object.prototype.hasOwnProperty.call(value, 'relations')) {
                relationString += self.relationsToString(value.relations);
            }
        }

        return relationString.substring(0, relationString.length - 1);
    },
}

export default graph;
