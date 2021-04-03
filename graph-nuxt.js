/**
 * This is to solve a frustrating Nuxt/Node/Docker issue. When setting the BrowserAPIBaseURL to port localhost:70** for the GraphQL server for browsers
 * and APIBaseURL to 172.19.*.* to the GraphQL server as localhost:70** will be the localhost in the docker container no the users/devs browser (this isn't an issue
 * once in production and using DNS addresses. This works fine, but when doing SSR and the asyncData function to render it needs to know if its to use the client or server graph.
 */
const graph_nuxt = {

    /**
     * Call the endpoint based on the process type
     * @param graph - graph.js instance
     * @param graph_server - graph_server.js instance
     * @param process - From the nuxt framework, just pass it in.
     * @param data - The query object
     * @returns {*|Promise}
     */
    getEndPointQuery(graph, graph_server, process, data) {

        if(process.server) return graph_server.getEndPointQuery(data)

        return graph.getEndPointQuery(data);
    }
}

export default graph_nuxt;
