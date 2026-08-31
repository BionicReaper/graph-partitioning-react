import { DataSet } from "vis-network/standalone/esm/vis-network";

// Algorithms iterate the DataSets in insertion order, and some of them (METIS)
// clear and rebuild the DataSets while coarsening, which leaves the items
// permuted once the run is over. Restoring a canonical order before every run
// keeps reruns on an untouched graph reproducible.
export function restoreLabelingOrder(
    nodeDataSet: DataSet<any, "id">,
    edgeDataSet: DataSet<any, "id">
): void {
    const currentNodes = nodeDataSet.get();
    currentNodes.sort((a, b) => {
        return Number(a.label) - Number(b.label);
    });

    nodeDataSet.clear();
    nodeDataSet.update(currentNodes);

    const currentEdges = edgeDataSet.get();
    currentEdges.sort((a, b) => {
        const idA = String(a.id);
        const idB = String(b.id);
        return (idA < idB) ? -1 : (idA > idB) ? 1 : 0;
    });

    edgeDataSet.clear();
    edgeDataSet.update(currentEdges);
}
