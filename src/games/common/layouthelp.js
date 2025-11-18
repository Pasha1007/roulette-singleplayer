export default class LayoutHelp {
    //1=h，2=v
    static resetPositions(tag, centerposi, offset, nodes) {
        let posix = centerposi.x;
        let posiy = centerposi.y;
        let nodelength = nodes.length;
        let isrighthalf = nodelength % 2 == 0 ? true : false;
        let half = isrighthalf ? Math.floor(nodelength / 2) - 0.5 : Math.floor(nodelength / 2);
        if (tag == 1) {
            for (let i = 0; i < nodelength; i++) {
                let node = nodes[i];
                node.setPosition(posix + (i - half) * offset, posiy);
            }
            return;
        }
        if (tag == 2) {
            for (let i = 0; i < nodelength; i++) {
                let node = nodes[i];
                node.setPosition(posix, posiy + (i - half) * offset);
            }
            return;
        }
    }
}
