import axios from "axios";
import string_builder from "./string-builder";
import _ from "lodash";

/**
 * This is the main class to use in most instances, it allows neat and easy read of GraphQL interactions
 */
const graph = {

    url: null,

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
        return new Promise(
            function (resolve, reject) {

                let query = string_builder.buildQueryString(data);
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
