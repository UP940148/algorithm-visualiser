/* eslint-disable no-labels */
/*
Node Structure:
{
  x: ?,
  y: ?
}

Edge Structure:
{
  a: ?,
  b: ?
}

Fragment Structure:
[node1, node2, node3, ..., nodeN]
*/


let NODES = [];
let EDGES = [];
let FRAGS = [];
let TOUR = [];
let DISTMAT = [];

// Create non-euclidean graph

function initRandWeightMatrix(n = 50) {
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix.push([]);
    for (let j = 0; j < n; j++) {
      matrix[i].push(undefined);
    }
  }
  // Create a random weight matrix (weights between 1 and 500)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // For every edge, create random weight (How do I make the matrix symmetrical?)
      if (i === j) {
        matrix[i][j] = Infinity;
      } else {
        const weight = Math.random() * 999 + 1;
        matrix[i][j] = weight;
        matrix[j][i] = weight;
      }
    }
  }
  DISTMAT = matrix;
}

function getEdges() {
  EDGES = [];
  for (let i = 0; i < DISTMAT.length; i++) {
    for (let j = i + 1; j < DISTMAT.length; j++) {
      EDGES.push({ a: i, b: j });
    }
  }
  EDGES.sort(edgeSort);
}

// Sort edges in ascending weight order.
function edgeSort(a, b) {
  const aLength = DISTMAT[a.a][a.b];
  const bLength = DISTMAT[b.a][b.b];
  return aLength - bLength;
}

// Sort fragments in descending length order.
function fragSort(a, b) {
  return b.length - a.length;
}

async function multiFrag() {
  FRAGS = [];
  while (EDGES.length > 0) {
    // Get next shortest edge
    const edge = EDGES.shift();
    // if (EDGES.length % 10000 === 0) {
    //   console.log(EDGES.length);
    // }

    if (FRAGS.length === 0) {
      FRAGS.push([edge.a, edge.b]);
    }

    // Check if either node appears in any fragment
    if (anyFragContains(edge)) {
      continue;
    }

    // Add edge to existing fragment or create new
    if (!addEdge(edge)) {
      continue;
    }

    // Sort frags in descending order by length
    await FRAGS.sort(fragSort);
    // Check if longest frag is full tour
    if (FRAGS[0].length === NODES.length) {
      return FRAGS[0];
    }

    // Check if fragments can be connected
    for (let i = FRAGS.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const [a, b] = joinFragments(FRAGS[i], FRAGS[j]);
        if (a) {
          [FRAGS[i], FRAGS[j]] = [a, b];
        }
      }
    }
    // Remove any empty fragments
    FRAGS = FRAGS.filter(frag => frag.length > 0);
  }
}

function anyFragContains(edge) {
  for (const fragment of FRAGS) {
    const end = fragment.length - 1;
    // Check if first node appears in fragment
    let position = fragment.indexOf(edge.a, 1);
    if (position < end && position !== -1) {
      return true;
    }
    // Check if second node appears in fragment
    position = fragment.indexOf(edge.b, 1);
    if (position < end && position !== -1) {
      return true;
    }
  }
  // If not found in any fragment, return false
  return false;
}

function addEdge(edge) {
  //
  for (const fragment of FRAGS) {
    const end = fragment.length - 1;
    // Check if any fragment ends with either node
    const startA = fragment[0] === edge.a;
    const startB = fragment[0] === edge.b;
    const endA = fragment[end] === edge.a;
    const endB = fragment[end] === edge.b;

    // If adding edge would form a loop, return false
    if ((startA && endB) || (startB && endA)) {
      return false;
    }

    if (startA) {
      // If 'a' matches start of fragment, unshift 'b' onto fragment
      fragment.unshift(edge.b);
      return true;
    } else if (startB) {
      // If 'b' matches start of fragment, unshift 'a' onto fragment
      fragment.unshift(edge.a);
      return true;
    } else if (endA) {
      // If 'a' matches end of fragment, push 'b' onto fragment
      fragment.push(edge.b);
      return true;
    } else if (endB) {
      // If 'b' matches end of fragment, push 'a' onto fragment
      fragment.push(edge.a);
      return true;
    }
  }

  // If can't join any fragment, create new fragment
  FRAGS.push([edge.a, edge.b]);
  return true;
}

function joinFragments(a, b) {
  //
  const aEnd = a.length - 1;
  const bEnd = b.length - 1;
  const startAstartB = a[0] === b[0];
  const startAendB = a[0] === b[bEnd];
  const endAstartB = a[aEnd] === b[0];
  const endAendB = a[aEnd] === b[bEnd];

  if (startAstartB) {
    // If starts match, reverse B and concat A on end
    b.reverse();
    b.pop();
    a = b.concat(a);
    b = [];
    return [a, b];
  } else if (startAendB) {
    // If startA matches endB, concat A on end of B
    b.pop();
    a = b.concat(a);
    b = [];
    return [a, b];
  } else if (endAstartB) {
    // If endA matches startB, concat B on end of A
    a.pop();
    a = a.concat(b);
    b = [];
    return [a, b];
  } else if (endAendB) {
    // If ends match, reverse B and concat to end of A
    b.reverse();
    a.pop();
    a = a.concat(b);
    b = [];
    return [a, b];
  }

  // If no matches, return false
  return [false, false];
}

function getFragWeight(frag) {
  let total = 0;
  for (let curr = 0; curr < frag.length; curr++) {
    let next = curr + 1;
    if (next === frag.length) {
      next = 0;
    }
    const nodeA = frag[curr];
    const nodeB = frag[next];
    const weight = DISTMAT[nodeA][nodeB];
    total += weight;
  }
  return total;
}

/* IMPROVEMENT ALGORITHMS */
function neighbourImprove() {
  // Get best weight
  let best = getFragWeight(TOUR);
  let swapped = true;
  while (swapped) {
    swapped = false;
    // Loop through every consecutive pair of nodes. Check if swapping would make tour shorter
    for (let curr = 0; curr < TOUR.length; curr++) {
      let next = curr + 1;
      // If next value is out of index, next value is start node
      if (next === TOUR.length) {
        next = 0;
      }
      // Make copy of current tour
      const temp = [...TOUR];

      [temp[curr], temp[next]] = [temp[next], temp[curr]];

      const weight = getFragWeight(temp);
      if (weight < best) {
        best = weight;
        TOUR = temp;
        swapped = true;
      }
    }
  }
}


document.getElementById('init').addEventListener('click', () => {
  const n = parseInt(document.getElementById('nCount').value);
  initRandWeightMatrix(n);
});

document.getElementById('MF').addEventListener('click', async () => {
  const n = document.getElementById('nCount').value;
  const iters = document.getElementById('iters').value;
  let total = 0;
  for (let i = 0; i < iters; i++) {
    initRandWeightMatrix(n);
    getEdges();
    await multiFrag();
    const weight = getFragWeight(FRAGS[0]);
    total += weight;
  }
  console.log(`Avg: ${total / iters}`);
});

document.getElementById('opt1').addEventListener('click', async () => {
  const n = document.getElementById('nCount').value;
  const iters = document.getElementById('iters').value;
  let totalInit = 0;
  let totalEnd = 0;
  for (let i = 0; i < iters; i++) {
    initRandWeightMatrix(n);
    getEdges();
    await multiFrag();
    TOUR = FRAGS[0];
    const initWeight = getFragWeight(TOUR);
    totalInit += initWeight;
    await neighbourImprove();
    const endWeight = getFragWeight(TOUR);
    totalEnd += endWeight;
  }
  const improv = ((totalInit - totalEnd) / totalInit) * 100;
  totalInit = totalInit / iters;
  totalEnd = totalEnd / iters;
  console.log('-------------------------------------------------------------');
  console.log(`Avg improvement: ${improv.toFixed(3)}% over ${iters} iterations`);
});

async function runProgressive(alg) {
  const results = [];
  const low = 4;
  const high = 100;

  for (let n = low; n <= high; n++) {
    console.log(n);
    const iters = document.getElementById('iters').value;
    let totalInit = 0;
    let totalEnd = 0;
    for (let i = 0; i < iters; i++) {
      initRandWeightMatrix(n);
      getEdges();
      await multiFrag();
      TOUR = FRAGS[0];
      const initWeight = getFragWeight(TOUR);
      totalInit += initWeight;
      await alg();
      const endWeight = getFragWeight(TOUR);
      totalEnd += endWeight;
    }
    const improv = ((totalInit - totalEnd) / totalInit) * 100;
    results.push([n, improv]);
  }

  console.log(results);
}
