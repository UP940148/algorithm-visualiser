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

import * as testNodes from './testingNodes.js';

let NODES = testNodes.test25;
let EDGES = [];
let FRAGS = [];
let TOUR = [];
let DISTMAT = [];
const CANV = document.getElementById('mainView');
const WIDTH = CANV.width;
const HEIGHT = CANV.height;




/**
 * Creates a new node and appends it to NODES.
 * @param {number} x - x co-ordinate of node.
 * @param {number} y - y co-ordinate of node.
 */
function createNode(x, y) {
  // If co-ordinate not specified, return false
  if (isNaN(x) || isNaN(y)) {
    return false;
  }

  const node = {
    x: x,
    y: y,
  };

  NODES.push(node);
}

/**
 * Gets all edges in the complete graph made up of nodes in NODES.
 */
function getEdges() {
  for (let i = 0; i < NODES.length; i++) {
    for (let j = i + 1; j < NODES.length; j++) {
      // Add edges from this node (i) to all following nodes (j)
      const edge = {
        a: i,
        b: j,
      };

      EDGES.push(edge);
    }
  }
}

/**
 * Get the distance between two nodes
 * @param {integer} a - First node.
 * @param {integer} b - Second node.
 * @return {number} The distance between the two nodes.
 */
function distBetween(a, b) {
  const xDist = a.x - b.x;
  const yDist = a.y - b.y;
  return Math.sqrt((xDist ** 2) + (yDist ** 2));
}

function makeDistMatrix() {
  DISTMAT = [];
  for (let i = 0; i < NODES.length; i++) {
    const row = [];
    for (let j = 0; j < NODES.length; j++) {
      if (i === j) {
        row.push(Infinity);
      } else {
        row.push(distBetween(NODES[i], NODES[j]));
      }
    }
    DISTMAT.push(row);
  }
}

// Sort edges in ascending weight order.
function edgeSort(a, b) {
  const aLength = distBetween(NODES[a.a], NODES[a.b]);
  const bLength = distBetween(NODES[b.a], NODES[b.b]);
  return aLength - bLength;
}

// Sort fragments in descending length order.
function fragSort(a, b) {
  return b.length - a.length;
}

/**
 * Retrieves and sorts all edges.
 */
function initEdges() {
  EDGES = [];
  getEdges();
  EDGES.sort(edgeSort);
}

/**
 * Create a selection of randomly positioned nodes.
 *
 * @param {integer} [n=10] - Number of nodes.
 */
function makeRandomNodes(n = 10) {
  for (let i = 0; i < n; i++) {
    let allowed = false;
    let node;
    createLoop:
    while (!allowed) {
      const x = Math.random() * (WIDTH - 20) + 10;
      const y = Math.random() * (HEIGHT - 20) + 10;

      node = {
        x: x,
        y: y,
      };

      for (const other of NODES) {
        if (distBetween(node, other) < 40) {
          continue createLoop;
        }
      }
      allowed = true;
    }
    NODES.push(node);
  }
}

function drawNodes() {
  //
  const ctx = CANV.getContext('2d');
  for (const node of NODES) {
    // Draw node to canvas
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
    ctx.fill();
  }
}

async function multiFrag() {
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

function drawFrag(frag) {
  const ctx = CANV.getContext('2d');
  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(frag[frag.length - 1].x, frag[frag.length - 1].y);
  for (const index of frag) {
    const node = NODES[index];
    ctx.lineTo(node.x, node.y);
    ctx.stroke();
  }
  ctx.closePath();
  ctx.stroke();
}

function clearCanv() {
  const ctx = CANV.getContext('2d');
  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function getFragWeight(frag) {
  let total = 0;
  for (let curr = 0; curr < frag.length; curr++) {
    let next = curr + 1;
    if (next === frag.length) {
      next = 0;
    }
    const nodeA = NODES[frag[curr]];
    const nodeB = NODES[frag[next]];
    const weight = distBetween(nodeA, nodeB);
    total += weight;
  }
  return total;
}
/*
function improveFrag(frag) {
  let weight = getFragWeight(frag);
  for (let curr = 0; curr < frag.length; curr++) {
    const temp = [...frag];
    let next = curr + 1;
    if (next === temp.length) {
      next = 0;
    }
    [temp[curr], temp[next]] = [temp[next], temp[curr]];
    const newWeight = getFragWeight(temp);
    if (newWeight < weight) {
      frag = temp;
      weight = newWeight;
    }
  }
  return frag;
}
*/

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
  drawFrag(TOUR);
  drawNodes();
  console.log(`Neighbour swap improvement: ${getFragWeight(TOUR)}`);
}

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function init() {
  clearCanv();
  drawNodes();
  makeDistMatrix();
}

async function executeMF() {
  FRAGS = [];
  TOUR = [];
  initEdges();
  await multiFrag();
  TOUR = [...FRAGS[0]];
  drawFrag(TOUR);
  drawNodes();
  console.log(`MF: ${getFragWeight(TOUR)}`);
}

function getClosest(n, exclude) {
  let closest;
  let bestDist = Infinity;
  for (let i = 0; i < NODES.length; i++) {
    if (exclude.includes(i)) {
      continue;
    }
    const thisDist = distBetween(NODES[n], NODES[i]);
    if (thisDist < bestDist) {
      bestDist = thisDist;
      closest = i;
    }
  }
  return closest;
}

function nearestNeighbour() {
  // Start is arbitrary, begin at 0
  TOUR = [0];

  // Loop until full tour created
  while (TOUR.length !== NODES.length) {
    const tail = TOUR[0];
    const next = getClosest(tail, TOUR);
    TOUR.unshift(next);
  }
}

async function executeNN() {
  TOUR = [];
  await nearestNeighbour();
  drawFrag(TOUR);
  drawNodes();
  console.log(`NN: ${getFragWeight(TOUR)}`);
}

function doubleEndedNN() {
  TOUR = [0];
  let front = true;
  while (TOUR.length !== NODES.length) {
    if (front) {
      const next = getClosest(TOUR[0], TOUR);
      TOUR.unshift(next);
      front = false;
      continue;
    }
    const tail = TOUR[TOUR.length - 1];
    const next = getClosest(tail, TOUR);
    TOUR.push(next);
    front = true;
  }
}

async function executeDENN() {
  TOUR = [];
  await doubleEndedNN();
  drawFrag(TOUR);
  drawNodes();
  console.log(`DENN: ${getFragWeight(TOUR)}`);
}

init();
const configEl = document.getElementById('config');
configEl.addEventListener('change', () => {
  if (configEl.value === '25') {
    NODES = testNodes.test25;
  } else if (configEl.value === '50') {
    NODES = testNodes.test50;
  } else if (configEl.value === '100') {
    NODES = testNodes.test100;
  }
  init();
});

document.getElementById('execMF').addEventListener('click', () => {
  executeMF();
});

document.getElementById('execNN').addEventListener('click', () => {
  executeNN();
});

document.getElementById('execDENN').addEventListener('click', () => {
  executeDENN();
});


document.getElementById('improv1').addEventListener('click', () => {
  if (TOUR.length === 0) {
    return;
  }
  neighbourImprove(TOUR);
});
