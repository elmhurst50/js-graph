import graph from "./graph"

const vueGraph = {
    install(Vue, options){
        Object.defineProperty(Vue, 'graph', {
            get() {
                let i = graph;

                i.url =  options.url;

                return i;
            }
        })

        Object.defineProperty(Vue.prototype, '$graph', {
            get() {
                let i = graph;

                i.url =  options.url;

                return i;
            }
        })
    }
}

export default vueGraph;