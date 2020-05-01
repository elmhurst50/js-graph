###Setup in Mix file

```
import VueGraph from "./../../../../../../../../node_modules/js-graph/vue-graph"

Vue.use(VueGraph, {url: Your Graph URL for that environment});
```

###Request Object 

```
{
  endpoint: null,
  params: {
    key: value
  },
  paramsRaw: '',
  paginate: {
    first: int,
    page: int
  },
  fields: [],
  relations: {
    relationName: {
      fields: []
    }
  }
}
```