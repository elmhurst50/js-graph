import graph from "./graph"

const vueGraph = {
    install(Vue, options){
        Object.defineProperty(Vue, 'graph', {
            get() {
                return graph;
            }
        })

        Object.defineProperty(Vue.prototype, '$graph', {
            get() {
                return graph;
            }
        })
    }
}

export default vueGraph;
