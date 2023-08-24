const string_builder = {
    /**
     * Complies the request data object into a string for the graphql query
     * This is the main entry to the class
     * @param data
     * @returns {string}
     */
    buildQueryString(data) {
        let paginate = false;
        let query = '';

        // set endpoint
        query += data.endpoint;


        // add paginator params to the main params object
        if (Object.prototype.hasOwnProperty.call(data, 'paginate')) {

            if (typeof data.params === 'undefined') {
                data.params = {};
            }

            data.params.first = data.paginate.first;
            data.params.page = data.paginate.page;

            paginate = '{paginatorInfo{total,count,currentPage,firstItem,hasMorePages,lastItem,lastPage,perPage},';
        }

        query += this.addQueryParams(data);

        // add paginator return fields if set (this var will be null otherwise)
        if (paginate !== false) query += paginate;

        if (Object.prototype.hasOwnProperty.call(data, 'paginate')) query += 'data';

        if (Object.prototype.hasOwnProperty.call(data, 'fields')) {
            query += '{' + this.fieldsToString(data.fields);

            if (Object.prototype.hasOwnProperty.call(data, 'relations')) {
                query += ',' + this.relationsToString(data.relations);
            }

            query += '}';
        }

        if (Object.prototype.hasOwnProperty.call(data, 'fieldsRaw')) {
            query += data.fieldsRaw;
        }


        if (Object.prototype.hasOwnProperty.call(data, 'paginate')) query += '}';

        return query;
    },


    addQueryParams(data) {
        if (Object.prototype.hasOwnProperty.call(data, 'paramsRaw')) return this.addQueryRawParams(data);

        let param_string = '(';

        if (Object.prototype.hasOwnProperty.call(data, 'params')) {
            param_string += this.paramsToString(data.params);
        }

        if (Object.prototype.hasOwnProperty.call(data, 'order_by')) {

            if (this.total_params > 0) param_string += ', '; //add comma if already have params

            param_string += ', orderBy: [';

            data.order_by.forEach((obj) => {
                param_string += '{column:' + obj.column + ', order:' + obj.order + '}'
            })

            param_string += ']';
        }

        param_string += ')';

        if (param_string === '()') return '';

        return param_string;
    },

    /**
     * Formats the params if sent as a raw string, with pagination if required
     * @param data
     * @return {string}
     */
    addQueryRawParams(data) {
        if (Object.prototype.hasOwnProperty.call(data, 'paramsRaw') && Object.prototype.hasOwnProperty.call(data, 'paginate')) {
            return '(' + this.paramsToString(data.params) + data.paramsRaw + ')';
        } else {
            return '(' + data.paramsRaw + ')';
        }
    },


    /**
     * Takes the parameters part of the request object and return it as a string. Recursively goes through nested objects
     * @param params
     * @returns {string}
     */
    paramsToString(params) {
        let parmString = '';

        for (const [key, value] of Object.entries(params)) {

            this.total_params++;

            if (value !== null) {
                if (Array.isArray(value)) {
                    var newValue = value.map(function (item) {
                        return '"' + item + '"'
                    }).join(',');

                    parmString += key + ':[' + newValue + '],';
                } else {
                    switch (typeof value) {
                        case "string":
                            parmString += key + ':"' + value + '",';
                            break;

                        case "number":
                            parmString += key + ':' + value + ',';
                            break;

                        case "boolean":
                            parmString += key + ':' + value + ',';
                            break;

                        case "array":
                            parmString += key + ':[' + this.paramsToString(value) + '],';
                            break;

                        case "object":
                            parmString += key + ':{' + this.paramsToString(value) + '},';
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
        let relationString = '';

        for (const [key, value] of Object.entries(relations)) {
            relationString += key + '{';

            relationString += this.fieldsToString(value.fields);

            if (Object.prototype.hasOwnProperty.call(value, 'relations')) {
                relationString += ' ' + this.relationsToString(value.relations);
            }

            relationString += '},';
        }

        return relationString.substring(0, relationString.length - 1);
    }
}

export default string_builder;
