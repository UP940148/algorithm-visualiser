let LIST = [];
let SORTED = [];
const CANV = document.getElementById('mainView');

// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function initList(n = 100) {
    LIST = [];
    // Create a list of n items in ascending order
    for (let i = 1; i < n+1; i++) {
        LIST.push(i);
        if (i > 5) {
            await drawList();
            // Make new bar blue
            colourBar(i-1, '#00f');
        }
    }
}

async function shuffle() {
    // Randomise list order
    let i = LIST.length;
    let random;

    while (i > 0) {
        random = Math.floor(Math.random() * i);
        i--;
        // Highlight current item in red, and swap target in blue
        colourBar(i, '#f00');
        colourBar(random, '#00f');
        // Swap items
        [LIST[i], LIST[random]] = [LIST[random], LIST[i]];
        await drawList();

    }
}


async function drawList() {
    await pause(1000 / LIST.length);
    const c = CANV.getContext('2d');
    // Clear canvas first
    c.fillStyle = '#eee';
    c.fillRect(0,0,CANV.width,CANV.height);
    c.fillStyle = '#000';
    const barWidth = CANV.width / LIST.length;
    for (let i = 0; i < LIST.length; i++) {
        const barHeight = (CANV.height / LIST.length) * LIST[i];
        const leftSide = i * barWidth;
        c.fillRect(leftSide, CANV.height - barHeight, barWidth, barHeight);
    }
    SORTED.forEach(index => {
        colourBar(index, '#0f0');
    })
}

function colourBar(index, colour) {
    const c = CANV.getContext('2d');
    const barWidth = CANV.width / LIST.length;
    const barHeight = (CANV.height / LIST.length) * LIST[index];
    const leftSide = index * barWidth;
    c.fillStyle = colour;
    c.fillRect(leftSide, CANV.height - barHeight, barWidth, barHeight);
}

async function sortFinished() {
    SORTED = [];
    for (let i = 0; i < LIST.length; i++) {
        await drawList();
        colourBar(i, '#0f0');
    }
    await drawList();
}

async function bubbleSort() {
    SORTED = [];
    let n = LIST.length;
    let swapped = true;
    while (swapped) {
        swapped = false;
        for (let i = 0; i < n-1; i++) {
            colourBar(i, '#f00');
            colourBar(i+1, '#00f');

            if (LIST[i] > LIST[i+1]) {
                [LIST[i], LIST[i+1]] = [LIST[i+1], LIST[i]];
                swapped = true;
            }
            await drawList();

        }
        n--;
        SORTED.push(n);
    }
    await sortFinished();
}

async function beginQuickSort() {
    SORTED = [];
    await quickSort();
    await sortFinished();
}

async function quickSort(start = 0, end = LIST.length-1) {
    await pause(10000/LIST.length);
    await drawList();
    if (start < end) {
        let pivot = partition(start, end);
        colourBar(pivot, '#0f0');
        colourBar(start, '#f00');
        colourBar(end, '#f00');

        await quickSort(start, pivot-1);
        await quickSort(pivot+1, end);
    }
}

function partition(start, end) {
    let pivot = LIST[end];
    let i = (start-1);
    for (let j = start; j <= end; j++) {
        if (LIST[j] < pivot) {
            i++;
            [LIST[i], LIST[j]] = [LIST[j], LIST[i]];
        }
    }
    [LIST[i+1],LIST[end]] = [LIST[end], LIST[i+1]];
    return (i+1);
}

async function cocktailSort() {
    let swapped = true;
    let start = 0;
    let end = LIST.length;
    while (swapped) {
        swapped = false;
        for (let i = start; i < end-1; i++) {
            colourBar(i, '#f00');
            colourBar(i+1, '#00f');
            if (LIST[i] > LIST[i+1]) {
                [LIST[i], LIST[i+1]] = [LIST[i+1], LIST[i]];
                swapped = true;
            }
            await drawList();
        }
        end--;
        SORTED.push(end);
        if (!swapped) break;
        swapped = false;
        for (let i = end; i > start; i--) {
            colourBar(i, '#f00');
            colourBar(i-1, '#00f');
            if (LIST[i] < LIST[i-1]) {
                [LIST[i], LIST[i-1]] = [LIST[i-1], LIST[i]];
                swapped = true;
            }
            await drawList();
        }
        SORTED.push(start)
        start++;
    }
    sortFinished();
}

async function beginMergeSort() {
    await mergeSort();
    await sortFinished();
}

async function mergeSort(left = 1, right = LIST.length) {
    if (right > left) {
        let middle = Math.floor((left + right)/2);
        await mergeSort(left, middle);
        await mergeSort(middle+1, right);
        merge(left, middle, right);
        await drawList();
    }
}

async function merge(left, middle, right) {
    const n1 = middle - left + 1;
    const n2 = right - middle;
    const L = [];
    const R = [];
    for (let i = 0; i < n1; i++) {
        L.push(LIST[left + i-1]);
    }
    for (let j = 0; j < n2; j++) {
        R.push(LIST[middle + j]);
    }
    L.push(Infinity);
    R.push(Infinity);
    i = 0;
    j = 0;
    for (let k = left-1; k < right; k++) {
        colourBar(k, '#f00');
        colourBar(left + i, '#00f');
        colourBar(middle + j, '#00f');
        if (k < 0) {console.log(k)}
        if (L[i] <= R[j]) {
            LIST[k] = L[i];
            i++;
        } else {
            LIST[k] = R[j];
            j++;
        }
    }
}


// Add event listeners
document.getElementById('initBtn').addEventListener('click', async () => {
    let length = parseInt(document.getElementById('initSize').value);
    if (length) {
        await initList(length);
    } else {
        await initList();
    }
});
document.getElementById('shuffleBtn').addEventListener('click', async () => {await shuffle()});
document.getElementById('bubbleBtn').addEventListener('click', async () => {await bubbleSort()});
document.getElementById('quickBtn').addEventListener('click', async () => {await beginQuickSort()});
document.getElementById('cocktailBtn').addEventListener('click', async () => {await cocktailSort()});
document.getElementById('mergeBtn').addEventListener('click', async () => {await beginMergeSort()});
