let NODES = [];
let EDGES = [];
let FRAGMENTS = [];
let TOUR = undefined;
let EDGECOUNT = 0;
const CANV = document.getElementById('mainView');

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Fragment {
    constructor(edge) {
        if (edge) {
            this.edges = [edge];
            this.nodes = [edge.nodeA, edge.nodeB];
        } else {
            this.edges = [];
            this.nodes = [];
        }
        //console.log({
        //    edges: [...this.edges],
        //    nodes: [...this.nodes]
        //})
    }

    drawSelf(colour, width) {
        const c = CANV.getContext('2d');
        c.lineWidth = width * 2;
        for (let i = 0; i < this.edges.length; i++) {
            this.edges[i].drawSelf(colour);
        }
    }

    addEdge(edge) {
        //let nodes = [edge.nodeA, edge.nodeB];
        let [aMatch, aIndex] = this.endMatches(edge.nodeA);
        let [bMatch, bIndex] = this.endMatches(edge.nodeB);

        // If node A matches
        if (aMatch) {
            // If node A is at start
            if (aIndex == 0) {
                this.nodes.unshift(edge.nodeB);
                this.edges.unshift(edge);
                return true;
            } else {
                this.nodes.push(edge.nodeB);
                this.edges.push(edge);
                return true;
            }
        }

        // If node B matches
        if (bMatch) {
            // If node B is at start
            if (bIndex == 0) {
                this.nodes.unshift(edge.nodeA);
                this.edges.unshift(edge);
                return true;
            } else {
                this.nodes.push(edge.nodeB);
                this.edges.push(edge);
                return true;
            }
        }

        return false;

    }

    contains(node) {
        for (let i = 1; i < this.nodes.length-1; i++) {
            if (this.nodes[i] == node) {
                return true;
            }
        }
        return false;
    }

    endMatches(node) {
        if (this.nodes[0] == node) {
            return [true, 0];
        } else if (this.nodes[this.nodes.length-1] == node) {
            return [true, undefined];
        }
        return [false, undefined];
    }

    isLoop() {
        if (this.nodes[0] == this.nodes[this.nodes.length-1]) {
            return true;
        }
        //console.log(this.nodes);
        //console.log(this.edges);
        //console.log('\n');
        return false;
    }

    isFullTour() {
        if (this.isLoop() && this.edges.length == NODES.length) {
            return true;
        }
        return false;
    }

    async connectFrag(fragment) {
        // If any node of fragA contained in fragB, return false
        for (let i = 0; i < this.nodes.length; i++) {
            if (fragment.contains(this.nodes[i])) {
                return false;
            }
        }
        // If any node of fragB contained in fragA, return false
        for (let i = 0; i < fragment.nodes.length; i++) {
            if (this.contains(fragment.nodes[i])) {
                return false;
            }
        }

        // Get reference to end nodes
        let aEnds = [this.nodes[0], this.nodes[this.nodes.length-1]];
        let bEnds = [fragment.nodes[0], fragment.nodes[fragment.nodes.length-1]];

        // if one end of fragA matches one end of fragB, connect
        let [a0Match, a0Index] = fragment.endMatches(aEnds[0]);
        let [a1Match, a1Index] = fragment.endMatches(aEnds[1]);

        // a0Match XOR a1Match
        if ((a0Match && !a1Match) || (!a0Match && a1Match)) {
            // Connect logic
            if (a0Match) {
                // If start of this fragment matches
                if (a0Index == 0) {
                    // If start of this fragment matches start of that fragment
                    // Reverse this fragment and append that fragment to end
                    this.nodes.reverse();
                    this.edges.reverse();
                    // Removing matching node to not have duplicates
                    this.nodes.pop()
                    this.nodes = this.nodes.concat(fragment.nodes);
                    this.edges = this.edges.concat(fragment.edges);
                    fragment.nodes = [];
                    fragment.edges = [];
                    //console.log('A');
                    //console.log([this.nodes.length, this.edges.length]);
                    return true;
                } else {
                    // If start of this fragment matches end of that fragment
                    // Append this fragment to end of that fragment
                    this.nodes.shift();
                    this.nodes = fragment.nodes.concat(this.nodes);
                    this.edges = fragment.edges.concat(this.edges);
                    fragment.nodes = [];
                    fragment.edges = [];
                    //console.log('B');
                    //console.log([this.nodes.length, this.edges.length]);
                    return true;
                }
            } else if (a1Match) {
                // If end of this fragment matches
                if (a1Index == 0) {
                    // If end of this fragment matches start of that fragment
                    // Append that fragment to end of this fragment
                    this.nodes.pop();
                    this.nodes = this.nodes.concat(fragment.nodes);
                    this.edges = this.edges.concat(fragment.edges);
                    fragment.nodes = [];
                    fragment.edges = [];
                    //console.log('C');
                    //console.log([this.nodes.length, this.edges.length]);
                    return true;
                } else {
                    // If end of this fragment matches end of that fragment
                    // Reverse that fragment and append to end of this fragment
                    this.nodes.pop();
                    fragment.nodes.reverse();
                    fragment.edges.reverse();
                    this.nodes = this.nodes.concat(fragment.nodes);
                    this.edges = this.edges.concat(fragment.edges);
                    fragment.nodes = [];
                    fragment.edges = [];
                    //console.log('D');
                    //console.log([this.nodes.length, this.edges.length]);
                    return true;
                }
            }
        }

        // if both ends of fragA match both ends of fragB, connect only if full tour
        if (a0Match && a1Match) {
            let tempFrag = new Fragment();
            if (a0Index == 0) {
                // If start of fragA matches start of fragB, flip fragA and concat fragB to end
                tempFrag.nodes = [...this.nodes];
                tempFrag.edges = [...this.edges];
                tempFrag.nodes.reverse();
                tempFrag.edges.reverse();
                tempFrag.nodes.pop();
                tempFrag.nodes = tempFrag.nodes.concat(fragment.nodes);
                tempFrag.edges = tempFrag.edges.concat(fragment.edges);
            } else {
                // If start of fragA matches end of fragB, concat fragA to end of fragB
                tempFrag.nodes = [...fragment.nodes];
                tempFrag.edges = [...fragment.edges];
                tempFrag.nodes.pop();
                tempFrag.nodes = tempFrag.nodes.concat(this.nodes);
                tempFrag.edges = tempFrag.edges.concat(this.edges);
            }
            // Check if tempFrag is a full tour, if so, make connection
            if (tempFrag.isFullTour()) {
                // Make this fragment equal to tempFrag and return true
                this.nodes = tempFrag.nodes;
                this.edges = tempFrag.edges;
                fragment.nodes = [];
                fragment.edges = [];
                return true;
            } else {
                // Else reject connection
                return false;
            }
            //console.log('Loop');
            //console.log([this.nodes.length, this.edges.length]);
            //console.log([fragment.nodes.length, fragment.edges.length]);
        }
    }
}

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.index = NODES.length;
    }

    getID() {
        let id = this.index;
        if (id < 10 && NODES.length > 10) {
            id = `0${this.index}`;
        }
        return id;
    }

    showSelf() {
        // Get context
        const c = CANV.getContext('2d');
        c.font = '16px arial';
        c.fillStyle = '#000';
        c.beginPath();
        c.arc(this.x, this.y, 11, 0, 2 * Math.PI);
        c.fill();
        c.fillStyle = '#fff';
        c.textAlign = 'center';
        c.beginPath();
        c.fillText(this.getID(), this.x, this.y+5);
        c.fill();
    }
}

class Edge {
    constructor(a, b) {
        this.nodeA = NODES[a];
        this.nodeB = NODES[b];
        this.weight = distBetween(NODES[a].x, NODES[a].y, NODES[b].x, NODES[b].y);
    }

    contains(node) {
        if (this.nodeA == node || this.nodeB == node) {
            return true;
        }
        return false;
    }

    drawSelf(colour = 'rgba(0,0,0,.1)') {
        const c = CANV.getContext('2d');
        c.strokeStyle = colour;
        c.beginPath();
        c.moveTo(this.nodeA.x, this.nodeA.y);
        c.lineTo(this.nodeB.x, this.nodeB.y);
        c.stroke();
    }
}

function edgeSort(a, b) {
    // Sort edges in ascending weight order
    return  a.weight - b.weight;
}

function fragSort(a, b) {
    // Sort fragments in descending length order
    return b.edges.length - a.edges.length;
}

function newNode(x, y) {
    if (!(x && y)) {
        // Create random numbers for x and y.
        // Don't set them too close to any other node.
        let x, y;
        let near = true;
        while (near) {
            x = Math.round(Math.random()*700 + 50);
            y = Math.round(Math.random()*700 + 50);
            near = false;
            for (let i = 0; i < NODES.length; i++) {
                let nodeX = NODES[i].x;
                let nodeY = NODES[i].y;
                if (distBetween(x, y, nodeX, nodeY) < 30) {
                    near = true;
                }
            }
        }
        NODES.push(new Node(x, y));
    }
}

function distBetween(x1, y1, x2, y2) {
    // Basic pythagoras to find distance between points
    const xDiff = x2 - x1;
    const yDiff = y2 - y1;
    const dist = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
    return dist;
}

function drawGraph() {
    clearCanv();

    if (document.getElementById('showEdges').checked) {
        drawAllEdges();
    }
    const edgeCounter = document.getElementById('edgeCount');
    edgeCounter.textContent = `Checked: ${EDGECOUNT-EDGES.length}/${EDGECOUNT}`;

    FRAGMENTS.sort(fragSort);
    if (FRAGMENTS.length > 0) {
        const fragSize = document.getElementById('fragSize');
        fragSize.textContent = `Largest fragment size: ${FRAGMENTS[0].edges.length}`;
    }

    if (TOUR) {
        TOUR.drawSelf('#0f0');
    } else {
        let max = 1;
        if (FRAGMENTS.length < max) {
            max = FRAGMENTS.length;
        }
        for (let i = 0; i < max; i++) {
            FRAGMENTS[i].drawSelf('#00f', max-i)
        }
    }
    NODES.forEach(node => {
        node.showSelf();
    })
    writeEdges();
    writeFragments();
}

function drawAllEdges() {
    EDGES.forEach(edge => {
        edge.drawSelf('rgba(0,0,0,.05)')
    })
}

function colourFrag(frag, colour) {
    for (let i = 0; i < frag.length; i++) {
        frag[i].drawSelf(colour);
    }
}

function clearCanv() {
    const c = CANV.getContext('2d');
    c.fillStyle = '#eee';
    c.fillRect(0,0,CANV.width, CANV.height);
}

async function createGraph(n = 10) {
    if (n > 100) {n = 100}
    NODES = [];
    EDGES = [];
    FRAGMENTS = [];
    TOUR = undefined;
    await clearCanv();
    for (let i = 0; i < n; i++) {
        newNode();
    }
    const fragSize = document.getElementById('fragSize');
    fragSize.textContent = 'Largest fragment size: --';
    const edgeCounter = document.getElementById('edgeCount');
    edgeCounter.textContent = 'Checked: --';
    getAllEdges();
    EDGECOUNT = EDGES.length;
    drawGraph();
}

async function getAllEdges() {
    EDGES = [];
    for (let i = 0; i < NODES.length; i++) {
        for (let j = i+1; j < NODES.length; j++) {
            EDGES.push(new Edge(i,j));
        }
    }
    EDGES.sort(edgeSort);
}

function finalFrag(fragment) {
    TOUR = fragment;
    drawGraph();
    fragment.drawSelf('#0f0');
    NODES.forEach(node => {
        node.showSelf();
    })
}

async function multiFragAlg() {
    FRAGMENTS = [];
    TOUR = undefined;
    const COUNT = NODES.length;

    /*
        Mult-Fragment Algorithm rules:

        1) If one of the edge’s nodes appears in the middle of a fragment, the edge is discarded.

        2) If neither of the edge’s nodes appear in any existing fragments, then a new fragment is created from that edge.

        3) If one of the edge’s nodes appears at the end of a fragment(A) and doesn’t appear on the end of any other fragment, then the edge gets added to fragment A.

        4) If one of the edge’s nodes appears at the end of a fragment (A) and the other node appears at the end o fa fragment (B),
           then the fragments and edge are joined together to make one larger fragment (fragment A + edge + fragment B),
           providing the larger fragment does not form a closed tour which doesn’t already include all the nodes required.
    */

    mainLoop:
    while (EDGES.length > 0) {
        await pause(100);
        const edge = EDGES.shift();
        await drawGraph();
        await edge.drawSelf('#f00');
        // Rule 1
        for (let f = 0; f < FRAGMENTS.length; f++) {
            const containsA = FRAGMENTS[f].contains(edge.nodeA);
            const containsB = FRAGMENTS[f].contains(edge.nodeB);

            // If either node of the edge is contained in any fragment, discard edge
            if (containsA || containsB) {
                continue mainLoop;
            }
        }

        // Rule 2
        //for (let f = 0; f < FRAGMENTS.length; f++) {
        //    const success = FRAGMENTS[f].addEdge(edge);
        //    if (success) {
        //        continue mainLoop;
        //    }
        //}
        FRAGMENTS.push(new Fragment(edge));

        // Check if any fragments can be connected
        fragLoop:
        for (let fa = 0; fa < FRAGMENTS.length; fa++) {
            let fragA = FRAGMENTS[fa];

            for (let fb = fa+1; fb < FRAGMENTS.length; fb++) {
                let fragB = FRAGMENTS[fb];
                //await drawGraph();
                //await fragB.drawSelf('#00f');
                //await fragA.drawSelf('#f00');
                //await pause(50);

                let connected = await fragA.connectFrag(fragB);

                // If frags were connected, then fragB no longer needed, so remove from list
                if (connected) {
                    FRAGMENTS.splice(fb, 1);
                    // If a full tour has been found, then finish
                    if (fragA.isFullTour()) {
                        finalFrag(fragA);
                        console.log('Fin')
                        return;
                    }
                    if (fragA.nodes.length == COUNT && fragA.edges.length == COUNT-1) {
                        let aIndex = NODES.indexOf(fragA.nodes[0]);
                        let bIndex = NODES.indexOf(fragA.nodes[COUNT-1]);
                        let temp = new Edge(aIndex, bIndex);
                        fragA.addEdge(temp);
                        finalFrag(fragA);
                        return;
                    }
                    if (fragA.edges.length > COUNT) {
                        console.log('\n');
                        console.log('Fin')
                        console.log(fragA);
                        console.log(FRAGMENTS[fa]);
                        return;
                    }
                    // If not a full tour, restart the frag checker loop
                    fa = -1;
                    continue fragLoop;
                }
            }
        }

    }
    window.alert('Err');
    return false
}

function writeEdges() {
    const edgeContainer = document.getElementById('edgeList');
    let content = '';
    for (let i = 0; i < EDGES.length; i++) {
        content += `${EDGES[i].nodeA.getID()} &rarr; ${EDGES[i].nodeB.getID()}<br>`
    }
    edgeContainer.innerHTML = content;
}

function writeFragments() {
    const fragContainer = document.getElementById('fragList');
    let content = '';
    for (let i = 0; i < FRAGMENTS.length; i++) {
        const nodes = FRAGMENTS[i].nodes;
        content += '[';
        for (let j = 0; j < nodes.length; j++) {
            if (j > 0) {
                content += ', ';
            }
            content += `${nodes[j].getID()}`
        }
        content += ']\n';
    }
    fragContainer.innerText = content;
}

// Add event listeners
document.getElementById('newGraph').addEventListener('click', async () => {
    let nodes = parseInt(document.getElementById('nodeCount').value);
    if (nodes) {
        await createGraph(nodes);
    } else {
        await createGraph();
    }
});

document.getElementById('showEdges').addEventListener('change', () => {
    drawGraph();
})

document.getElementById('mfButton').addEventListener('click', multiFragAlg);
