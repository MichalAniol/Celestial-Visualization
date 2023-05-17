(function () {
    const IMG_WIDTH = 112;
    const IMG_HEIGHT = 112;
    const canvas = document.getElementById("canvas");
    canvas.addEventListener('error', () => { });
    canvas.width = IMG_WIDTH;
    canvas.height = IMG_HEIGHT;
    const ctx = canvas.getContext("2d");
    const img = new Image;
    img.src = moonData;
    ctx.drawImage(img, 0, 0);
    const moonDataElem = document.getElementById('moonData');
    const moonRowLengthElem = document.getElementById('moonRowLength');
    const moonRowStartElem = document.getElementById('moonRowStart');
    const moonWidthElem = document.getElementById('moonWidth');
    const moonHeightElem = document.getElementById('moonHeight');
    moonDataElem.innerHTML = 'const moonData = [';
    moonRowLengthElem.innerHTML = 'const moonRowLength = [';
    moonRowStartElem.innerHTML = 'const moonRowStart = [';
    moonWidthElem.innerHTML = 'const moonWidth = ' + IMG_WIDTH;
    moonHeightElem.innerHTML = 'const moonHeight = ' + IMG_HEIGHT;
    const TAB_X = IMG_WIDTH;
    const TAB_Y = IMG_HEIGHT;
    const SCALE = 1;
    const DELTA = .00001;
    setTimeout(() => {
        let minColor = 255;
        let maxColor = 0;
        const data = [];
        for (let y = 0; y < TAB_Y; y += SCALE) {
            let rowLength = 0;
            const rowData = [];
            let imgRowStart = 0;
            let rowStarted = false;
            for (let x = 0; x < TAB_X; x += SCALE) {
                let r = 0;
                let g = 0;
                let b = 0;
                let a = 0;
                const pixel = ctx.getImageData(x, y, SCALE, SCALE).data;
                for (let yy = 0; yy < SCALE; ++yy) {
                    for (let xx = 0; xx < SCALE; ++xx) {
                        const pos = ((yy * SCALE) + xx) * 4;
                        r += pixel[pos];
                        g += pixel[pos + 1];
                        b += pixel[pos + 2];
                        a += pixel[pos + 3];
                    }
                }
                if (a < 128) {
                    if (!rowStarted)
                        ++imgRowStart;
                    continue;
                }
                const value = Math.round(((r + b + g) / 3) / (SCALE * SCALE));
                rowData.push(value);
                if (value < minColor)
                    minColor = value;
                if (value > maxColor)
                    maxColor = value;
                rowLength++;
                rowStarted = true;
                continue;
            }
            data.push(rowData);
            moonRowLengthElem.innerHTML += `${rowLength}${y < TAB_Y - SCALE - DELTA ? ',' : ']'}`;
            moonRowStartElem.innerHTML += `${imgRowStart}${y < TAB_Y - SCALE - DELTA ? ',' : ']'}`;
            console.log('%c rowLength:', 'background: #ffcc00; color: #003300', rowLength);
        }
        console.log('%c minColor:', 'background: #ffcc00; color: #003300', minColor);
        console.log('%c maxColor:', 'background: #ffcc00; color: #003300', maxColor);
        const ratio = 255 / (maxColor - minColor);
        const getStretched = (value) => Math.floor((value - minColor) * ratio);
        let newMin = 255;
        let newMax = 0;
        for (let y = 0; y < data.length; ++y) {
            let imgInner = '';
            let row = data[y];
            for (let x = 0; x < row.length; ++x) {
                const value = getStretched(row[x]);
                if (value < newMin)
                    newMin = value;
                if (value > newMax)
                    newMax = value;
                imgInner += `${value}${x < row.length - 1 ? ',' : ''}`;
            }
            moonDataElem.innerHTML += `[${imgInner}]${y < data.length - 1 ? ',<br>' : ']'}`;
        }
        console.log('%c newMax:', 'background: #ffcc00; color: #003300', newMax);
        console.log('%c newMin:', 'background: #ffcc00; color: #003300', newMin);
    }, 1500);
}());
