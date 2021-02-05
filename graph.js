import axios from "axios";

const graph = {

    url: null,

    total_params: 0,

    download_setup: {},

    post_options: {withCredentials: true},

    /**
     * Add a header to the axios call
     * @param name
     * @param value
     */
    setHeader(name, value) {
        axios.defaults.headers.post[name] = value;
    },

    /**
     * Change the POST options
     * @param options
     */
    setPostOptions(options) {
        this.post_options = options;
    },

    /**
     * Wrapper main call for API query calls
     * @param data - Object
     * @returns {Promise}
     */
    getEndPointQuery(data) {

        let self = this;

        return new Promise((resolve, reject) => {
                let query = '';

                if (Array.isArray(data)) {
                    data.forEach((obj) => {
                        query += self.buildQueryString(obj);
                    });
                } else {
                    query += self.buildQueryString(data);
                }

                query = '{' + query + '}';

                axios.post(this.url, {query: query}, this.post_options)
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

            param_string += 'orderBy: [';

            data.order_by.forEach((obj) => {
                param_string += '{field:' + obj.field + ', order:' + obj.order + '}'
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
            return '(' + self.paramsToString(data.params) + data.paramsRaw + ')';
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
        let self = this;
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
                            parmString += key + ':[' + self.paramsToString(value) + '],';
                            break;

                        case "object":
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

            relationString += self.fieldsToString(value.fields);

            if (Object.prototype.hasOwnProperty.call(value, 'relations')) {
                relationString += ' ' + self.relationsToString(value.relations);
            }

            relationString += '},';
        }

        return relationString.substring(0, relationString.length - 1);
    },


    // ***************** DOWNLOADING **************************

    /**
     * This is the method to call to start download process, it will request the data, then
     * process data into CSV and save to computer. Need to do it this way to act as a promise
     * graph_request - standard graph request
     * download_setup - {filename, columns[{display:'', field:''}]}
     */
    download(graph_request, download_setup) {
        console.log(download_setup);

        graph_request.paginate = {first: 10000000, page: 1};

        this.download_setup = download_setup;

        let self = this;

        return new Promise(function (resolve, reject) {
            self.getEndPointQuery(graph_request)
                .then((response) => {
                    console.log(response);
                    let download_rows = response.data;

                    self.downloadCSV(download_rows);

                    resolve({success: true});
                })
                .catch((error) => {
                    console.error(error);

                    reject({success: false, message: 'Did not download'});
                })
        })
    },


    /**
     * Get the headers from the data into a row array
     * @return {{}}
     */
    getHeaders() {
        let headers = {};

        _.each(this.download_setup.columns, (column) => {
            headers[column.value] = column.text;
        });

        return headers;
    },

    /**
     * Convert all the rows into csv lines
     * @param rows
     * @return {string}
     */
    convertToCSV(rows) {
        let array = (_.isObject(rows)) ? rows : JSON.parse(rows);

        let str = '';

        _.each(array, (row) => {
            let line = '';

            _.each(this.download_setup.columns, (column) => {
                if (line !== '') line += ',';

                if (_.isString(row[column.value])) {
                    line += row[column.value];
                } else {
                    let fields = column.value.split('.');

                    switch (fields.length) {
                        case 5:
                            if (!_.isNull(row[fields[0]][fields[1]][fields[2]][fields[3]])) line += row[fields[0]][fields[1]][fields[2]][fields[3]][fields[4]];
                            break;
                        case 4:
                            if (!_.isNull(row[fields[0]])
                                && !_.isUndefined(row[fields[0]])
                                && !_.isNull(row[fields[0]][fields[1]])
                                && !_.isUndefined(row[fields[0]][fields[1]])
                                && !_.isNull(row[fields[0]][fields[1]][fields[2]])
                                && !_.isUndefined(row[fields[0]][fields[1]][fields[2]])) line += row[fields[0]][fields[1]][fields[2]][fields[3]];
                            break;
                        case 3:
                            if (!_.isNull(row[fields[0]])
                                && !_.isUndefined(row[fields[0]])
                                && !_.isNull(row[fields[0]][fields[1]])
                                && !_.isUndefined(row[fields[0]][fields[1]])) line += row[fields[0]][fields[1]][fields[2]];
                            break;
                        case 2:
                            if (!_.isNull(row[fields[0]])) line += row[fields[0]][fields[1]];
                            break;
                        default:
                            line += row[column.value];
                            break;
                    }
                }
            });
            str += line + "\r\n";
        });

        return str;
    },

    /**
     * The actual download
     */
    downloadCSV(download_rows) {
        console.log('Download CSV');

        download_rows.unshift(this.getHeaders());

        let jsonObject = JSON.stringify(download_rows);

        let csv = this.convertToCSV(jsonObject);

        let exported_filename = this.download_setup.filename + '.csv' || 'export.csv';

        let blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});

        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, exported_filename);
        } else {
            let link = document.createElement("a");

            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                let url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", exported_filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }
}

export default graph;
