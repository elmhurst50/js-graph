import _ from "lodash"

/**
 * This is to solve a frustrating Nuxt/Node/Docker issue. When setting the BrowserAPIBaseURL to port localhost:70** for the GraphQL server for browsers
 * and APIBaseURL to 172.19.*.* to the GraphQL server as localhost:70** will be the localhost in the docker container no the users/devs browser (this isn't an issue
 * once in production and using DNS addresses. This works fine, but when doing SSR and the asyncData function to render it needs to know if its to use the client or server graph.
 */

const graph_nuxt = {

    graph: null,

    graph_server: null,

    setup(graph, graph_server){
        this.graph = graph;

        this.graph_server = graph_server
    },

    /**
     *
     * @param data
     * @param process_as_server - Boolean
     * @param graph - You can send in own graph object if you have not setup the default graph
     * @param graph_server - You can send in own graph_server object if you have not setup the default graph_server
     * @returns {promise}
     */
    getEndPointQuery(data, process_as_server, graph, graph_server) {
        console.log('Nuxt process server is ', process);

        //If we are running on the serevr
        if(process_as_server) {
            return _.isUndefined(graph_server)
                ? this.graph_server.getEndPointQuery(data)
                : graph_server.getEndPointQuery(data)
        }

        return _.isUndefined(graph)
            ? this.graph.getEndPointQuery(data)
            : graph.getEndPointQuery(data)
    }
}

export default graph_nuxt;
